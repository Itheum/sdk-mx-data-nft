import {
  Address,
  AddressValue,
  BigUIntValue,
  ContractCallPayloadBuilder,
  ContractFunction,
  IAddress,
  ResultsParser,
  StringValue,
  TokenIdentifierValue,
  Transaction,
  U64Value
} from '@multiversx/sdk-core/out';
import dataNftMinterAbi from './abis/datanftmint.abi.json';
import {
  createFileFromUrl,
  dataNFTDataStreamAdvertise,
  storeToIpfs
} from './common/mint-utils';
import { checkTraitsUrl, checkUrlIsUp } from './common/utils';
import {
  EnvironmentsEnum,
  itheumTokenIdentifier,
  minterContractAddress
} from './config';
import { ErrArgumentNotSet, ErrContractQuery } from './errors';
import { SftMinterRequirements } from './interfaces';
import { Minter } from './minter';
import BigNumber from 'bignumber.js';
import {
  NumericValidator,
  StringValidator,
  validateResults
} from './common/validator';

export class SftMinter extends Minter {
  /**
   * Creates a new instance of the `SftMinter` class, which can be used to interact with the Data NFT-FT minter smart contract
   * @param env 'devnet' | 'mainnet' | 'testnet'
   * @param timeout Timeout for the network provider (DEFAULT = 10000ms)
   */
  constructor(env: string, timeout: number = 10000) {
    super(
      env,
      new Address(minterContractAddress[env as EnvironmentsEnum]),
      dataNftMinterAbi,
      timeout
    );
  }

  /**
   * Retrieves the minter smart contract requirements for the given user
   * @param address the address of the user
   * @param taxToken the tax token to be used for the minting (default = `ITHEUM` token identifier based on the  {@link EnvironmentsEnum})
   */
  async viewMinterRequirements(
    address: IAddress,
    taxToken = itheumTokenIdentifier[this.env as EnvironmentsEnum]
  ): Promise<SftMinterRequirements> {
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
      const requirements: SftMinterRequirements = {
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
      throw new ErrContractQuery(
        'viewMinterRequirements',
        returnCode.toString()
      );
    }
  }

  /**
   * Retrieves a list of nonces that are frozen for address
   * @param address The address to check
   */
  async viewAddressFrozenNonces(address: IAddress): Promise<number[]> {
    const interaction = this.contract.methodsExplicit.getSftsFrozenForAddress([
      new AddressValue(address)
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
      const frozenNonces: number[] = returnValue.map((nonce: any) =>
        nonce.toNumber()
      );
      return frozenNonces;
    } else {
      throw new ErrContractQuery(
        'viewAddressFrozenNonces',
        returnCode.toString()
      );
    }
  }

  /**
   * Creates an initialize contract transaction for the contract
   * @param senderAddress The address of the sender, must be the admin of the contract
   * @param collectionName The name of the NFT collection
   * @param tokenTicker The ticker of the NFT collection
   * @param antiSpamTaxTokenIdentifier The token identifier of the anti spam token
   * @param antiSpamTaxTokenAmount The amount of anti spam token to be used for minting as tax
   * @param mintLimit(seconds)- The mint limit between mints
   * @param treasury_address The address of the treasury to collect the anti spam tax
   */
  initializeContract(
    senderAddress: IAddress,
    collectionName: string,
    tokenTicker: string,
    antiSpamTaxTokenIdentifier: string,
    antiSpamTaxTokenAmount: BigNumber.Value,
    mintLimit: number,
    treasury_address: IAddress
  ): Transaction {
    const initializeContractTx = new Transaction({
      value: 0,
      data: new ContractCallPayloadBuilder()
        .setFunction(new ContractFunction('initializeContract'))
        .addArg(new StringValue(collectionName))
        .addArg(new StringValue(tokenTicker))
        .addArg(new TokenIdentifierValue(antiSpamTaxTokenIdentifier))
        .addArg(new BigUIntValue(antiSpamTaxTokenAmount))
        .addArg(new U64Value(mintLimit))
        .addArg(new AddressValue(treasury_address))
        .build(),
      receiver: this.contract.getAddress(),
      gasLimit: 10000000,
      sender: senderAddress,
      chainID: this.chainID
    });
    return initializeContractTx;
  }

  /**
   * Creates a `setTreasuryAddress` transaction
   * @param senderAddress The address of the sender, must be the admin of the contract
   * @param treasuryAddress The address of the treasury to collect the anti spam tax
   */
  setTreasuryAddress(
    senderAddress: IAddress,
    treasuryAddress: IAddress
  ): Transaction {
    const setTreasuryAddressTx = new Transaction({
      value: 0,
      data: new ContractCallPayloadBuilder()
        .setFunction(new ContractFunction('setTreasuryAddress'))
        .addArg(new AddressValue(treasuryAddress))
        .build(),
      receiver: this.contract.getAddress(),
      gasLimit: 10000000,
      sender: senderAddress,
      chainID: this.chainID
    });
    return setTreasuryAddressTx;
  }

  /**
   * Creates a `setAntiSpamTax` transaction
   * @param senderAddress The address of the sender, must be the admin of the contract
   * @param maxSupply The maximum supply that can be minted
   */
  setMaxSupply(
    senderAddress: IAddress,
    maxSupply: BigNumber.Value
  ): Transaction {
    const setMaxSupplyTx = new Transaction({
      value: 0,
      data: new ContractCallPayloadBuilder()
        .setFunction(new ContractFunction('setMaxSupply'))
        .addArg(new BigUIntValue(maxSupply))
        .build(),
      receiver: this.contract.getAddress(),
      gasLimit: 10000000,
      sender: senderAddress,
      chainID: this.chainID
    });
    return setMaxSupplyTx;
  }

  /**
   * Creates a `mint` transaction
   *
   * NOTE: The `dataStreamUrl` is being encrypted and the `media` and `metadata` urls are build and uploaded to IPFS
   *
   * NOTE: The `options.nftStorageToken` is required when not using custom image and traits, when using custom image and traits the traits should be compliant with the `traits` structure
   *
   * For more information, see the [README documentation](https://github.com/Itheum/sdk-mx-data-nft#create-a-mint-transaction).
   *
   * @param senderAddress the address of the user
   * @param tokenName the name of the DataNFT-FT. Between 3 and 20 alphanumeric characters, no spaces.
   * @param dataMarshalUrl the url of the data marshal. A live HTTPS URL that returns a 200 OK HTTP code.
   * @param dataStreamUrl the url of the data stream to be encrypted. A live HTTPS URL that returns a 200 OK HTTP code.
   * @param dataPreviewUrl the url of the data preview. A live HTTPS URL that returns a 200 OK HTTP code.
   * @param royalties the royalties to be set for the Data NFT-FT. A number between 0 and 50. This equates to a % value. e.g. 10%
   * @param supply the supply of the Data NFT-FT. A number between 1 and 1000.
   * @param datasetTitle the title of the dataset. Between 10 and 60 alphanumeric characters.
   * @param datasetDescription the description of the dataset. Between 10 and 400 alphanumeric characters.
   * @param lockPeriod the lock period for the bond in days
   * @param amountToSend the amount of the bond + anti spam tax (if anti spam tax > 0) to be sent
   * @param options [optional] below parameters are optional or required based on use case
   *                 - imageUrl: the URL of the image for the Data NFT
   *                 - traitsUrl: the URL of the traits for the Data NFT
   *                 - nftStorageToken: the nft storage token to be used to upload the image and metadata to IPFS
   *
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
    lockPeriod: number,
    amountToSend: number,
    options?: {
      imageUrl?: string;
      traitsUrl?: string;
      nftStorageToken?: string;
    }
  ): Promise<Transaction> {
    const { imageUrl, traitsUrl, nftStorageToken } = options ?? {};

    const tokenNameValidator = new StringValidator()
      .notEmpty()
      .alphanumeric()
      .minLength(3)
      .maxLength(20)
      .validate(tokenName);

    const datasetTitleValidator = new StringValidator()
      .notEmpty()
      .minLength(10)
      .maxLength(60)
      .validate(datasetTitle.trim());

    const datasetDescriptionValidator = new StringValidator()
      .notEmpty()
      .minLength(10)
      .maxLength(400)
      .validate(datasetDescription);

    const royaltiesValidator = new NumericValidator()
      .integer()
      .minValue(0)
      .validate(royalties);

    const supplyValidator = new NumericValidator()
      .integer()
      .minValue(1)
      .validate(supply);

    validateResults([
      tokenNameValidator,
      datasetTitleValidator,
      datasetDescriptionValidator,
      royaltiesValidator,
      supplyValidator
    ]);

    // deep validate all mandatory URLs
    try {
      await checkUrlIsUp(dataStreamUrl, [200, 403]);
      await checkUrlIsUp(dataPreviewUrl, [200]);
      await checkUrlIsUp(dataMarshalUrl + '/health-check', [200]);
    } catch (error) {
      throw error;
    }

    let imageOnIpfsUrl: string;
    let metadataOnIpfsUrl: string;

    const { dataNftHash, dataNftStreamUrlEncrypted } =
      await dataNFTDataStreamAdvertise(
        dataStreamUrl,
        dataMarshalUrl,
        senderAddress.bech32() // the caller is the Creator
      );

    if (!imageUrl) {
      if (!nftStorageToken) {
        throw new ErrArgumentNotSet(
          'nftStorageToken',
          'NFT Storage token is required when not using custom image and traits'
        );
      }
      const { image, traits } = await createFileFromUrl(
        `${this.imageServiceUrl}/v1/generateNFTArt?hash=${dataNftHash}`,
        datasetTitle,
        datasetDescription,
        dataPreviewUrl,
        senderAddress.bech32()
      );

      const {
        imageOnIpfsUrl: imageIpfsUrl,
        metadataOnIpfsUrl: metadataIpfsUrl
      } = await storeToIpfs(nftStorageToken, traits, image);

      imageOnIpfsUrl = imageIpfsUrl;
      metadataOnIpfsUrl = metadataIpfsUrl;
    } else {
      if (!traitsUrl) {
        throw new ErrArgumentNotSet(
          'traitsUrl',
          'Traits URL is required when using custom image'
        );
      }

      await checkTraitsUrl(traitsUrl);

      imageOnIpfsUrl = imageUrl;
      metadataOnIpfsUrl = traitsUrl;
    }

    const data = new ContractCallPayloadBuilder()
      .setFunction(new ContractFunction('ESDTTransfer'))
      .addArg(
        new TokenIdentifierValue(
          itheumTokenIdentifier[this.env as EnvironmentsEnum]
        )
      )
      .addArg(new BigUIntValue(amountToSend))
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
      .addArg(new U64Value(lockPeriod))
      .build();

    const mintTx = new Transaction({
      data,
      sender: senderAddress,
      receiver: this.contract.getAddress(),
      gasLimit: 80_000_000,
      chainID: this.chainID
    });

    return mintTx;
  }
}
