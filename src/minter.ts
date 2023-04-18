import {
  SmartContract,
  Address,
  AbiRegistry,
  IAddress,
  TokenIdentifierValue,
  AddressValue,
  ResultsParser,
  Transaction,
  ContractCallPayloadBuilder,
  ContractFunction,
  U64Value,
  BigUIntValue,
  StringValue
} from '@multiversx/sdk-core/out';
import { ProxyNetworkProvider } from '@multiversx/sdk-network-providers/out';
import {
  Environment,
  dataNftTokenIdentifier,
  itheumTokenIdentifier,
  minterContractAddress,
  networkConfiguration
} from './config';
import dataNftMintAbi from './abis/datanftmint.abi.json';
import { MinterRequirements } from './interfaces';
import { NFTStorage } from 'nft.storage';
import { File } from '@web-std/file';

export class DataNftMinter {
  readonly contract: SmartContract;
  readonly chainID: string;
  readonly networkProvider: ProxyNetworkProvider;
  readonly env: string;

  /**
   * Creates a new instance of the `DataNftMinter` which can be used to interact with the DataNFT-FTs inside the marketplace
   * @param env 'DEVNET' | 'MAINNET'
   * @param timeout Timeout for the network provider (DEFAULT = 10000ms)
   */
  constructor(env: string, timeout: number = 10000) {
    this.env = env;
    const networkConfig = networkConfiguration[env as Environment];
    this.chainID = networkConfig.chainID;
    this.networkProvider = new ProxyNetworkProvider(
      networkConfig.networkProvider,
      {
        timeout: timeout
      }
    );
    const contractAddress = minterContractAddress[env as Environment];
    this.contract = new SmartContract({
      address: new Address(contractAddress),
      abi: AbiRegistry.create(dataNftMintAbi)
    });
  }

  /**
   * Retrives the address of the minter smart contract based on the environment
   */
  getContractAddress(): IAddress {
    return this.contract.getAddress();
  }

  /**
   * Retrieves the minter smart contract requirements for the given user
   * @param address the address of the user
   * @param taxToken the tax token to be used for the minting (default = `ITHEUM` token identifier based on the  {@link Environment})
   */
  async viewMinterRequirements(
    address: IAddress,
    taxToken = itheumTokenIdentifier[this.env as Environment]
  ): Promise<MinterRequirements> {
    const interaction = this.contract.methodsExplicit.getUserDataOut([
      new AddressValue(address),
      new TokenIdentifierValue(taxToken)
    ]);
    const query = interaction.buildQuery();
    const queryResponse = await this.networkProvider.queryContract(query);
    const endpointDefinition = interaction.getEndpoint();
    const { firstValue, returnCode } = new ResultsParser().parseQueryResponse(
      queryResponse,
      endpointDefinition
    );
    if (returnCode.isSuccess()) {
      const returnValue = firstValue?.valueOf();
      const requirements: MinterRequirements = {
        antiSpamTaxValue: returnValue['anti_spam_tax_value'] as number,
        contractPaused: returnValue['is_paused'] as boolean,
        maxRoyalties: returnValue['max_royalties'] as number,
        minRoyalties: returnValue['min_royalties'] as number,
        maxSupply: returnValue['max_supply'] as number,
        mintTimeLimit: returnValue['mint_time_limit'] as number,
        lastUserMintTime: returnValue['last_mint_time'] as number,
        userWhitelistedForMint: returnValue['is_whitelisted'] as boolean,
        contractWhitelistEnabled: returnValue['whitelist_enabled'] as boolean,
        numberOfMintsForUser: returnValue['minted_per_user'] as number,
        totalNumberOfMints: returnValue['total_minted'] as number,
        addressFrozen: returnValue['frozen'] as boolean,
        frozenNonces: returnValue['frozen_nonces'] as number[]
      };
      return requirements;
    } else {
      throw new Error('Could not retrieve requirements');
    }
  }

  /**
   *  Creates a `burn` transaction
   * @param senderAddress the address of the user
   * @param dataNftNonce the nonce of the DataNFT-FT
   * @param quantityToBurn the quantity to burn
   * @param dataNftIdentifier the DataNFT-FT token identifier (default = `DATA-NFT-FT` token identifier based on the {@link Environment})
   */
  burn(
    senderAddress: IAddress,
    dataNftNonce: number,
    quantityToBurn: number,
    dataNftIdentifier = dataNftTokenIdentifier[this.env as Environment]
  ): Transaction {
    const burnTx = new Transaction({
      value: 0,
      data: new ContractCallPayloadBuilder()
        .setFunction(new ContractFunction('ESDTNFTTransfer'))
        .addArg(new TokenIdentifierValue(dataNftIdentifier))
        .addArg(new U64Value(dataNftNonce))
        .addArg(new BigUIntValue(quantityToBurn))
        .addArg(new AddressValue(this.contract.getAddress()))
        .addArg(new StringValue('burn'))
        .build(),
      receiver: senderAddress,
      sender: senderAddress,
      gasLimit: 12000000,
      chainID: this.chainID
    });
    return burnTx;
  }

  /**
   * Creates a `mint` transaction
   *
   * NOTE: The `dataStreamUrl` is being encrypted and the `media` and `metadata` urls are build and uploaded to IPFS
   *
   * @param senderAddress the address of the user
   * @param tokenName the name of the DataNFT-FT
   * @param dataMarshalUrl the url of the data marshal
   * @param dataStreamUrl the url of the data stream
   * @param dataPreviewUrl the url of the data preview
   * @param royalties the royalties to be set for the DataNFT-FT
   * @param supply the supply of the DataNFT-FT
   * @param datasetTitle the title of the dataset
   * @param datasetDescription the description of the dataset
   * @param antiSpamTax the anti spam tax to be set for the DataNFT-FT
   * @param antiSpamTokenIdentifier the anti spam token identifier to be used for the minting (default = `ITHEUM` token identifier based on the  {@link Environment})
   */
  async mint(
    senderAddress: IAddress,
    tokenName: string,
    dataMarshalUrl: string,
    dataStreamUrl: string,
    dataPreviewUrl: string,
    royalties: number,
    supply: number,
    datasetTitle: string,
    datasetDescription: string,
    antiSpamTax: number,
    antiSpamTokenIdentifier = itheumTokenIdentifier[this.env as Environment]
  ): Promise<Transaction> {
    const { dataNftHash, dataNftStreamUrlEncrypted } =
      await this.dataNFTDataStreamAdvertise(dataStreamUrl);

    const newNFTImg = `${process.env.REACT_APP_ENV_DATADEX_API}/v1/generateNFTArt?hash=${dataNftHash}`;

    const { image, traits } = await this.createFileFromUrl(
      newNFTImg,
      datasetTitle,
      datasetDescription,
      dataPreviewUrl,
      senderAddress.bech32()
    );

    const { imageOnIpfsUrl, metadataOnIpfsUrl } = await this.storeToIpfs(
      image,
      traits
    );

    let data;
    if (antiSpamTax > 0) {
      data = new ContractCallPayloadBuilder()
        .setFunction(new ContractFunction('ESDTTransfer'))
        .addArg(new TokenIdentifierValue(antiSpamTokenIdentifier))
        .addArg(new BigUIntValue(antiSpamTax))
        .addArg(new StringValue('mint'))
        .addArg(new StringValue(tokenName))
        .addArg(new StringValue(imageOnIpfsUrl))
        .addArg(new StringValue(metadataOnIpfsUrl))
        .addArg(new StringValue(dataMarshalUrl))
        .addArg(new StringValue(dataNftStreamUrlEncrypted))
        .addArg(new StringValue(dataPreviewUrl))
        .addArg(new U64Value(royalties))
        .addArg(new U64Value(supply))
        .addArg(new StringValue(datasetTitle))
        .addArg(new StringValue(datasetDescription))
        .build();
    } else {
      data = new ContractCallPayloadBuilder()
        .setFunction(new ContractFunction('mint'))
        .addArg(new StringValue(tokenName))
        .addArg(new StringValue(imageOnIpfsUrl))
        .addArg(new StringValue(metadataOnIpfsUrl))
        .addArg(new StringValue(dataMarshalUrl))
        .addArg(new StringValue(dataNftStreamUrlEncrypted))
        .addArg(new StringValue(dataPreviewUrl))
        .addArg(new U64Value(royalties))
        .addArg(new U64Value(supply))
        .addArg(new StringValue(datasetTitle))
        .addArg(new StringValue(datasetDescription))
        .build();
    }

    const mintTx = new Transaction({
      data,
      sender: senderAddress,
      receiver: this.contract.getAddress(),
      gasLimit: 60000000,
      chainID: this.chainID
    });

    return mintTx;
  }

  private async dataNFTDataStreamAdvertise(
    dataNFTStreamUrl: string
  ): Promise<{ dataNftHash: string; dataNftStreamUrlEncrypted: string }> {
    /*
      1) Call the data marshal and get a encrypted data stream url and hash of url (s1)
      2) Use the hash for to generate the gen img URL from the generative API (s2)
        2.1) Save the new generative image to IPFS and get it's IPFS url (s3)
      3) Mint the SFT via the Minter Contract (s4)
    */

    const myHeaders = new Headers();
    myHeaders.append(
      'authorization',
      process.env.REACT_APP_ENV_ITHEUMAPI_M2M_KEY || ''
    );
    myHeaders.append('cache-control', 'no-cache');
    myHeaders.append('Content-Type', 'application/json');

    const requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify({ dataNFTStreamUrl })
    };

    try {
      const res = await fetch(
        `${process.env.REACT_APP_ENV_DATAMARSHAL_API}/generate`,
        requestOptions
      );
      const data = await res.json();

      if (data && data.encryptedMessage && data.messageHash) {
        return {
          dataNftHash: data.messageHash,
          dataNftStreamUrlEncrypted: data.encryptedMessage
        };
      } else {
        throw new Error('Could not generate data stream url');
      }
    } catch {
      throw new Error('Could not generate data stream url');
    }
  }

  private async storeToIpfs(
    image: File,
    traits: File
  ): Promise<{ imageOnIpfsUrl: string; metadataOnIpfsUrl: string }> {
    let res;
    try {
      const nftstorage = new NFTStorage({
        token: process.env.REACT_APP_ENV_NFT_STORAGE_KEY || ''
      });
      res = await nftstorage.storeDirectory([image, traits]);
    } catch {
      throw new Error('Error while uploading to IPFS');
    }

    if (!res) {
      return {
        imageOnIpfsUrl: '',
        metadataOnIpfsUrl: ''
      };
    }
    return {
      imageOnIpfsUrl: `https://ipfs.io/ipfs/${res}/image.png`,
      metadataOnIpfsUrl: `https://ipfs.io/ipfs/${res}/metadata.json`
    };
  }

  private createIpfsMetadata(
    traits: string,
    datasetTitle: string,
    datasetDescription: string,
    dataNFTStreamPreviewUrl: string,
    address: string
  ) {
    const metadata = {
      description: `${datasetTitle} : ${datasetDescription}`,
      attributes: [] as object[]
    };
    const attributes = traits
      .split(',')
      .filter((element) => element.trim() !== '');
    const metadataAttributes = [];
    for (const attribute of attributes) {
      const [key, value] = attribute.split(':');
      const trait = { trait_type: key.trim(), value: value.trim() };
      metadataAttributes.push(trait);
    }
    metadataAttributes.push({
      trait_type: 'Data Preview URL',
      value: dataNFTStreamPreviewUrl
    });
    metadataAttributes.push({ trait_type: 'Creator', value: address });
    metadata.attributes = metadataAttributes;
    return metadata;
  }

  private async createFileFromUrl(
    url: string,
    datasetTitle: string,
    datasetDescription: string,
    dataNFTStreamPreviewUrl: string,
    address: string
  ) {
    const res = await fetch(url);
    const data = await res.blob();
    const _imageFile = new File([data], 'image.png', { type: 'image/png' });
    const traits = this.createIpfsMetadata(
      res.headers.get('x-nft-traits') || '',
      datasetTitle,
      datasetDescription,
      dataNFTStreamPreviewUrl,
      address
    );
    const _traitsFile = new File([JSON.stringify(traits)], 'metadata.json', {
      type: 'application/json'
    });
    return { image: _imageFile, traits: _traitsFile };
  }
}
