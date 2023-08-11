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
  StringValue,
  BooleanValue
} from '@multiversx/sdk-core/out';
import { ApiNetworkProvider } from '@multiversx/sdk-network-providers/out';
import {
  EnvironmentsEnum,
  dataNftTokenIdentifier,
  imageService,
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
  readonly networkProvider: ApiNetworkProvider;
  readonly env: string;
  readonly imageServiceUrl: string;

  /**
   * Creates a new instance of the `DataNftMinter` which can be used to interact with the Data NFT-FT minter smart contract
   * @param env 'devnet' | 'mainnet' | 'testnet'
   * @param timeout Timeout for the network provider (DEFAULT = 10000ms)
   */
  constructor(env: string, timeout: number = 10000) {
    this.env = env;
    const networkConfig = networkConfiguration[env as EnvironmentsEnum];
    this.imageServiceUrl = imageService[env as EnvironmentsEnum];
    this.chainID = networkConfig.chainID;
    this.networkProvider = new ApiNetworkProvider(
      networkConfig.networkProvider,
      {
        timeout: timeout
      }
    );
    const contractAddress = minterContractAddress[env as EnvironmentsEnum];
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
   * @param taxToken the tax token to be used for the minting (default = `ITHEUM` token identifier based on the  {@link EnvironmentsEnum})
   */
  async viewMinterRequirements(
    address: IAddress,
    taxToken = itheumTokenIdentifier[this.env as EnvironmentsEnum]
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
        antiSpamTaxValue: returnValue.anti_spam_tax_value.toNumber(),
        contractPaused: returnValue.is_paused,
        maxRoyalties: returnValue.max_royalties.toNumber(),
        minRoyalties: returnValue.min_royalties.toNumber(),
        maxSupply: returnValue.max_supply.toNumber(),
        mintTimeLimit: returnValue.mint_time_limit.toNumber(),
        lastUserMintTime: returnValue.last_mint_time,
        userWhitelistedForMint: returnValue.is_whitelisted,
        contractWhitelistEnabled: returnValue.whitelist_enabled,
        numberOfMintsForUser: returnValue.minted_per_user.toNumber(),
        totalNumberOfMints: returnValue.total_minted.toNumber(),
        addressFrozen: returnValue.frozen,
        frozenNonces: returnValue.frozen_nonces.map((v: any) => v.toNumber())
      };
      return requirements;
    } else {
      throw new Error('Could not retrieve requirements');
    }
  }

  /**
   * Retrieves the smart contract pause state
   */
  async viewContractPauseState(): Promise<boolean> {
    const interaction = this.contract.methodsExplicit.getIsPaused();
    const query = interaction.buildQuery();
    const queryResponse = await this.networkProvider.queryContract(query);
    const endpointDefinition = interaction.getEndpoint();
    const { firstValue, returnCode } = new ResultsParser().parseQueryResponse(
      queryResponse,
      endpointDefinition
    );
    if (returnCode.isSuccess()) {
      const returnValue = firstValue?.valueOf();
      return new BooleanValue(returnValue).valueOf();
    } else {
      throw new Error('Error while retrieving the contract pause state');
    }
  }

  /**
   *  Creates a `burn` transaction
   * @param senderAddress the address of the user
   * @param dataNftNonce the nonce of the DataNFT-FT
   * @param quantityToBurn the quantity to burn
   * @param dataNftIdentifier the DataNFT-FT token identifier (default = `DATA-NFT-FT` token identifier based on the {@link EnvironmentsEnum})
   */
  burn(
    senderAddress: IAddress,
    dataNftNonce: number,
    quantityToBurn: number,
    dataNftIdentifier = dataNftTokenIdentifier[this.env as EnvironmentsEnum]
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
   * @param dataStreamUrl the url of the data stream to be encrypted
   * @param dataPreviewUrl the url of the data preview
   * @param royalties the royalties to be set for the Data NFT-FT
   * @param supply the supply of the Data NFT-FT
   * @param datasetTitle the title of the dataset
   * @param datasetDescription the description of the dataset
   * @param antiSpamTax the anti spam tax to be set for the Data NFT-FT with decimals
   * @param storageToken the nft storage token to be used to upload the image and metadata to IPFS
   * @param options optional parameters
   *                 - imageUrl: the URL of the image for the Data NFT (optional, should be stored on `IPFS`)
   *                 - imageDescription: a description for the image (optional, should be passed if the `imageUrl` is passed)
   *                 - antiSpamTokenIdentifier: the anti spam token identifier to be used for the minting (default = `ITHEUM` token identifier based on the  {@link EnvironmentsEnum})
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
    storageToken: string,
    options?: {
      imageUrl?: string;
      imageDescription?: string;
      antiSpamTokenIdentifier?: string;
    }
  ): Promise<Transaction> {
    const {
      imageUrl = '',
      imageDescription = '',
      antiSpamTokenIdentifier = itheumTokenIdentifier[
        this.env as EnvironmentsEnum
      ]
    } = options ?? {};

    if (imageUrl && !imageUrl.startsWith('https://ipfs.io/ipfs')) {
      throw new Error('Invalid image url');
    }

    if (!imageDescription && imageUrl) {
      throw new Error('Invalid image description');
    }

    const { dataNftHash, dataNftStreamUrlEncrypted } =
      await this.dataNFTDataStreamAdvertise(dataStreamUrl, dataMarshalUrl);

    const { image, traits } = await this.createFileFromUrl(
      imageUrl ||
        `${this.imageServiceUrl}/v1/generateNFTArt?hash=${dataNftHash}`,
      datasetTitle,
      datasetDescription,
      dataPreviewUrl,
      senderAddress.bech32(),
      imageDescription!,
      Boolean(imageUrl)
    );

    let { imageOnIpfsUrl, metadataOnIpfsUrl } = await this.storeToIpfs(
      storageToken,
      traits,
      imageUrl ? undefined : image
    );

    imageOnIpfsUrl = imageUrl ? imageUrl : imageOnIpfsUrl;

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
    dataNFTStreamUrl: string,
    dataMarshalUrl: string
  ): Promise<{ dataNftHash: string; dataNftStreamUrlEncrypted: string }> {
    /*
      1) Call the data marshal and get a encrypted data stream url and hash of url (s1)
      2) Use the hash for to generate the gen img URL from the generative API (s2)
        2.1) Save the new generative image to IPFS and get it's IPFS url (s3)
      3) Mint the SFT via the Minter Contract (s4)
    */

    const myHeaders = new Headers();
    myHeaders.append('cache-control', 'no-cache');
    myHeaders.append('Content-Type', 'application/json');

    const requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify({ dataNFTStreamUrl })
    };

    try {
      const res = await fetch(`${dataMarshalUrl}/generate`, requestOptions);
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
    storageToken: string,
    traits: File,
    image?: File
  ): Promise<{ imageOnIpfsUrl: string; metadataOnIpfsUrl: string }> {
    let res;
    try {
      const nftstorage = new NFTStorage({
        token: storageToken
      });
      const dir = image ? [image, traits] : [traits];
      res = await nftstorage.storeDirectory(dir);
      console.log(res);
    } catch {
      throw new Error('Error while uploading to IPFS');
    }

    if (!res) {
      return {
        imageOnIpfsUrl: '',
        metadataOnIpfsUrl: ''
      };
    }
    if (image) {
      return {
        imageOnIpfsUrl: `https://ipfs.io/ipfs/${res}/image.png`,
        metadataOnIpfsUrl: `https://ipfs.io/ipfs/${res}/metadata.json`
      };
    } else {
      return {
        imageOnIpfsUrl: '',
        metadataOnIpfsUrl: `https://ipfs.io/ipfs/${res}/metadata.json`
      };
    }
  }

  private createIpfsMetadata(
    traits: string,
    datasetTitle: string,
    datasetDescription: string,
    dataNFTStreamPreviewUrl: string,
    address: string,
    imageDescription: string,
    hasCustomImage = false
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
    if (hasCustomImage) {
      metadataAttributes.push({
        trait_type: 'Image Description',
        value: imageDescription
      });
    }
    metadataAttributes.push({ trait_type: 'Creator', value: address });
    metadata.attributes = metadataAttributes;
    return metadata;
  }

  private async createFileFromUrl(
    url: string,
    datasetTitle: string,
    datasetDescription: string,
    dataNFTStreamPreviewUrl: string,
    address: string,
    imageDescription: string,
    hasCustomImage = false
  ) {
    let res: any = '';
    let data: any = '';
    let _imageFile: File = new File([], '');
    if (url) {
      res = await fetch(url);
      data = await res.blob();
      _imageFile = new File([data], 'image.png', { type: 'image/png' });
    }
    const traits = this.createIpfsMetadata(
      res.headers.get('x-nft-traits') || '',
      datasetTitle,
      datasetDescription,
      dataNFTStreamPreviewUrl,
      address,
      imageDescription,
      hasCustomImage
    );
    const _traitsFile = new File([JSON.stringify(traits)], 'metadata.json', {
      type: 'application/json'
    });
    return { image: _imageFile, traits: _traitsFile };
  }
}
