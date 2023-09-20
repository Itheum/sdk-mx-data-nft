import {
  Address,
  AddressValue,
  BigUIntValue,
  BooleanValue,
  ContractCallPayloadBuilder,
  ContractFunction,
  IAddress,
  ResultsParser,
  StringValue,
  TokenIdentifierValue,
  Transaction,
  U64Value
} from '@multiversx/sdk-core/out';
import { Minter } from './minter';
import dataNftLeaseAbi from './abis/data-nft-lease.abi.json';
import {
  checkTraitsUrl,
  checkUrlIsUp,
  validateSpecificParamsMint
} from './common/utils';
import {
  createFileFromUrl,
  dataNFTDataStreamAdvertise,
  storeToIpfs
} from './common/mint-utils';
import { ContractConfiguration } from './interfaces';

export class NftMinter extends Minter {
  /**
   * Creates a new instance of the `NftMinter` class, which is used to interact with the factory generated smart contract.
   * @param env 'devnet' | 'devnet2'| 'mainnet' | 'testnet'
   * @param contractAddress The address of the factory generated smart contract
   * @param timeout Timeout for the network provider (DEFAULT = 10000ms)
   */
  constructor(env: string, contractAddress: IAddress, timeout: number = 10000) {
    super(env, contractAddress, dataNftLeaseAbi, timeout);
  }

  /**
   * Creates an initialize contract transaction for the contract
   * @param senderAddress The address of the sender, must be the admin of the contract
   * @param collectionName The name of the NFT collection
   * @param tokenTicker The ticker of the NFT collection
   * @param mintLimit(seconds)- The mint limit between mints
   * @param requireMintTax - A boolean value to set if the mint tax is required or not
   * @param options - If `requireMintTax` is true, the `options` object must contain the `taxTokenIdentifier` and `taxTokenAmount`
   */
  initializeContract(
    senderAddress: IAddress,
    collectionName: string,
    tokenTicker: string,
    mintLimit: number,
    requireMintTax: boolean,
    claimsAddress: IAddress,
    options?: {
      taxTokenIdentifier: string;
      taxTokenAmount: number;
    }
  ): Transaction {
    let data;
    if (requireMintTax && options) {
      data = new ContractCallPayloadBuilder()
        .setFunction(new ContractFunction('initializeContract'))
        .addArg(new StringValue(collectionName))
        .addArg(new StringValue(tokenTicker))
        .addArg(new BigUIntValue(mintLimit))
        .addArg(new BooleanValue(requireMintTax))
        .addArg(new AddressValue(claimsAddress))
        .addArg(new TokenIdentifierValue(options.taxTokenIdentifier))
        .addArg(new BigUIntValue(options.taxTokenAmount))
        .build();
    } else {
      data = new ContractCallPayloadBuilder()
        .setFunction(new ContractFunction('initializeContract'))
        .addArg(new StringValue(collectionName))
        .addArg(new StringValue(tokenTicker))
        .addArg(new BigUIntValue(mintLimit))
        .addArg(new BooleanValue(requireMintTax))
        .addArg(new AddressValue(claimsAddress))
        .build();
    }

    const initializeContractTx = new Transaction({
      value: 50000000000000000,
      data: data,
      receiver: this.contract.getAddress(),
      gasLimit: 50000000,
      sender: senderAddress,
      chainID: this.chainID
    });
    return initializeContractTx;
  }

  /**
   * Creates a updateAttributes transaction for the contract
   * @param senderAddress The address of the sender, must be the admin of the contract
   * @param tokenIdentiifer The token identifier of the data nft to update attributes
   * @param nonce The nonce of the token to update attributes
   * @param attributes The new attributes to update
   * @param quantity The quantity of the token to update attributes (default: 1)
   */
  updateAttributes(
    senderAddress: IAddress,
    tokenIdentiifer: string,
    nonce: number,
    attributes: {
      dataMarshalUrl: string;
      dataStreamUrl: string;
      dataPreviewUrl: string;
      creator: IAddress;
      title: string;
      description: string;
    },
    quantity = 1
  ): Transaction {
    const updateAttributesTx = new Transaction({
      value: 0,
      data: new ContractCallPayloadBuilder()
        .setFunction(new ContractFunction('ESDTNFTTransfer'))
        .addArg(new TokenIdentifierValue(tokenIdentiifer))
        .addArg(new U64Value(nonce))
        .addArg(new U64Value(quantity))
        .addArg(new AddressValue(this.contract.getAddress()))
        .addArg(new StringValue('updateAttributes'))
        .addArg(new StringValue(attributes.dataMarshalUrl))
        .addArg(new StringValue(attributes.dataStreamUrl))
        .addArg(new StringValue(attributes.dataPreviewUrl))
        .addArg(new AddressValue(attributes.creator))
        .addArg(new StringValue(attributes.title))
        .addArg(new StringValue(attributes.description))
        .build(),
      receiver: senderAddress,
      gasLimit: 12000000,
      sender: senderAddress,
      chainID: this.chainID
    });
    return updateAttributesTx;
  }

  /**
   * Creates a `mint` transaction
   *
   * NOTE: The `dataStreamUrl` is being encrypted and the `media` and `metadata` urls are build and uploaded to IPFS
   *
   * NOTE: The `options.nftStorageToken` is required when not using custom image and traits, when using custom image and traits the traits should be compliant with the [Traits](https://github.com/Itheum/sdk-mx-data-nft#traits-structure) structure
   *
   * For more information, see the [README documentation](https://github.com/Itheum/sdk-mx-data-nft#create-a-mint-transaction).
   *
   * @param senderAddress the address of the user
   * @param tokenName the name of the DataNFT-FT. Between 3 and 20 alphanumeric characters, no spaces.
   * @param dataMarshalUrl the url of the data marshal. A live HTTPS URL that returns a 200 OK HTTP code.
   * @param dataStreamUrl the url of the data stream to be encrypted. A live HTTPS URL that returns a 200 OK HTTP code.
   * @param dataPreviewUrl the url of the data preview. A live HTTPS URL that returns a 200 OK HTTP code.
   * @param royalties the royalties to be set for the Data NFT-FT. A number between 0 and 50. This equates to a % value. e.g. 10%
   * @param datasetTitle the title of the dataset. Between 10 and 60 alphanumeric characters.
   * @param datasetDescription the description of the dataset. Between 10 and 400 alphanumeric characters.
   * @param options [optional] below parameters are optional or required based on use case
   *                 - imageUrl: the URL of the image for the Data NFT
   *                 - traitsUrl: the URL of the traits for the Data NFT
   *                 - nftStorageToken: the nft storage token to be used to upload the image and metadata to IPFS
   *                 - antiSpamTokenIdentifier: the anti spam token identifier to be used for the minting
   *                 - antiSpamTax: the anti spam tax to be set for the Data NFT-FT with decimals. Needs to be greater than 0 and should be obtained in real time via {@link viewMinterRequirements} prior to calling mint.
   */
  async mint(
    senderAddress: IAddress,
    tokenName: string,
    dataMarshalUrl: string,
    dataStreamUrl: string,
    dataPreviewUrl: string,
    royalties: number,
    datasetTitle: string,
    datasetDescription: string,
    options?: {
      imageUrl?: string;
      traitsUrl?: string;
      nftStorageToken?: string;
      antiSpamTokenIdentifier?: string;
      antiSpamTax?: number;
    }
  ): Promise<Transaction> {
    const {
      imageUrl,
      traitsUrl,
      nftStorageToken,
      antiSpamTokenIdentifier,
      antiSpamTax
    } = options ?? {};

    // S: run any format specific validation
    const { allPassed, validationMessages } = validateSpecificParamsMint({
      senderAddress,
      tokenName,
      royalties,
      datasetTitle,
      datasetDescription,
      _mandatoryParamsList: [
        'senderAddress',
        'tokenName',
        'royalties',
        'datasetTitle',
        'datasetDescription'
      ]
    });

    if (!allPassed) {
      throw new Error(`Params have validation issues = ${validationMessages}`);
      // throw new ErrFailedOperation(
      //   this.mint.name,
      //   new Error(`params have validation issues = ${validationMessages}`)
      // );
    }
    // E: run any format specific validation...

    // deep validate all mandatory URLs
    try {
      await checkUrlIsUp(dataStreamUrl, [200, 403]);
      await checkUrlIsUp(dataPreviewUrl, [200]);
      await checkUrlIsUp(dataMarshalUrl + '/health-check', [200]);
    } catch (error) {
      throw error;
      // if (error instanceof Error) {
      //   throw new ErrFailedOperation(this.mint.name, error);
      // } else {
      //   throw new ErrFailedOperation(this.mint.name);
      // }
    }

    let imageOnIpfsUrl: string;
    let metadataOnIpfsUrl: string;

    const { dataNftHash, dataNftStreamUrlEncrypted } =
      await dataNFTDataStreamAdvertise(dataStreamUrl, dataMarshalUrl);

    if (!imageUrl) {
      if (!nftStorageToken) {
        throw new Error(
          'NFT Storage token is required when not using custom image and traits'
        );
        // throw new ErrArgumentNotSet(
        //   'nftStorageToken',
        //   'NFT Storage token is required when not using custom image and traits'
        // );
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
        throw new Error('Traits URL is required when using custom image');
        // throw new ErrArgumentNotSet(
        //   'traitsUrl',
        //   'Traits URL is required when using custom image'
        // );
      }

      await checkTraitsUrl(traitsUrl);

      imageOnIpfsUrl = imageUrl;
      metadataOnIpfsUrl = traitsUrl;
    }

    let data;
    if (
      antiSpamTax &&
      antiSpamTokenIdentifier &&
      antiSpamTokenIdentifier != 'EGLD' &&
      antiSpamTax > 0
    ) {
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
        .addArg(new StringValue(datasetTitle))
        .addArg(new StringValue(datasetDescription))
        .build();
    }

    const mintTx = new Transaction({
      value: antiSpamTokenIdentifier == 'EGLD' ? antiSpamTax : 0,
      data,
      sender: senderAddress,
      receiver: this.contract.getAddress(),
      gasLimit: 60000000,
      chainID: this.chainID
    });

    return mintTx;
  }

  /**
   * Creates a setTransferRoles transaction for the contract
   * @param senderAddress The address of the sender, must be the admin of the contract
   * @param address The address to set the transfer roles
   */
  setTransferRole(senderAddress: IAddress, address: IAddress): Transaction {
    const setTransferRolesTx = new Transaction({
      value: 0,
      data: new ContractCallPayloadBuilder()
        .setFunction(new ContractFunction('setTransferRole'))
        .addArg(new AddressValue(address))
        .build(),
      receiver: this.contract.getAddress(),
      gasLimit: 10000000,
      sender: senderAddress,
      chainID: this.chainID
    });
    return setTransferRolesTx;
  }

  /**
   * Creates an unsetTransferRoles transaction for the contract
   * @param senderAddress The address of the sender, must be the admin of the contract
   * @param address The address to unset the transfer roles
   */
  unsetTransferRole(senderAddress: IAddress, address: IAddress): Transaction {
    const unsetTransferRolesTx = new Transaction({
      value: 0,
      data: new ContractCallPayloadBuilder()
        .setFunction(new ContractFunction('unsetTransferRole'))
        .addArg(new AddressValue(address))
        .build(),
      receiver: this.contract.getAddress(),
      gasLimit: 10000000,
      sender: senderAddress,
      chainID: this.chainID
    });
    return unsetTransferRolesTx;
  }

  /** Creates a set mint tax transaction for the contract
   * @param senderAddress The address of the sender, must be the admin of the contract
   * @param is_required A boolean value to set if the mint tax is required or not
   */
  setMintTaxIsRequired(
    senderAddress: IAddress,
    is_required: boolean
  ): Transaction {
    const setMintTaxIsRequiredTx = new Transaction({
      value: 0,
      data: new ContractCallPayloadBuilder()
        .setFunction(new ContractFunction('setTaxIsRequired'))
        .addArg(new BooleanValue(is_required))
        .build(),
      receiver: this.contract.getAddress(),
      gasLimit: 10000000,
      sender: senderAddress,
      chainID: this.chainID
    });

    return setMintTaxIsRequiredTx;
  }

  /** Sets the claim address for the contract
   * @param senderAddress The address of the sender, must be the admin of the contract
   * @param claimsAddress The claims address
   */
  setClaimsAddress(
    senderAddress: IAddress,
    claimsAddress: IAddress
  ): Transaction {
    const setClaimsAddressTx = new Transaction({
      value: 0,
      data: new ContractCallPayloadBuilder()
        .setFunction(new ContractFunction('setClaimsAddress'))
        .addArg(new AddressValue(claimsAddress))
        .build(),
      receiver: this.contract.getAddress(),
      gasLimit: 10000000,
      sender: senderAddress,
      chainID: this.chainID
    });
    return setClaimsAddressTx;
  }

  /** Creates a claim royalties transaction for the contract
   * @param senderAddress The address of the sender, must be the admin of the contract
   * @param tokenIdentifier The token identifier of the token to claim royalties
   * @param nonce The nonce of the token to claim royalties (default: 0 for ESDT)
   */
  claimRoyalties(
    senderAddress: IAddress,
    tokenIdentifier: string,
    nonce = 0
  ): Transaction {
    const claimRoyaltiesTx = new Transaction({
      value: 0,
      data: new ContractCallPayloadBuilder()
        .setFunction(new ContractFunction('claimRoyalties'))
        .addArg(new TokenIdentifierValue(tokenIdentifier))
        .addArg(new BigUIntValue(nonce))
        .build(),
      receiver: this.contract.getAddress(),
      gasLimit: 10000000,
      sender: senderAddress,
      chainID: this.chainID
    });
    return claimRoyaltiesTx;
  }

  /**
   * Retrieves the smart contract configuration
   */
  async viewContractConfiguration(): Promise<ContractConfiguration> {
    const interaction =
      this.contract.methodsExplicit.getContractConfiguration();
    const query = interaction.buildQuery();
    const queryResponse = await this.networkProvider.queryContract(query);
    const endpointDefinition = interaction.getEndpoint();
    const { firstValue, returnCode } = new ResultsParser().parseQueryResponse(
      queryResponse,
      endpointDefinition
    );
    if (returnCode.isSuccess()) {
      const returnValue = firstValue?.valueOf();
      const contractConfiguration: ContractConfiguration = {
        tokenIdentifier: returnValue?.token_identifier.toString(),
        mintedTokens: returnValue?.minted_tokens.toNumber(),
        isTaxRequired: returnValue?.tax_required as boolean,
        maxRoyalties: returnValue?.max_royalties.toNumber(),
        minRoyalties: returnValue?.min_royalties.toNumber(),
        mintTimeLimit: returnValue?.mint_time_limit.toNumber(),
        isWhitelistEnabled: returnValue?.is_whitelist_enabled as boolean,
        isContractPaused: returnValue?.is_paused as boolean,
        rolesAreSet: returnValue?.roles_are_set as boolean,
        claimsAddress: returnValue?.claims_address.toString(),
        administratorAddress: returnValue?.administrator_address.toString()
      };
      return contractConfiguration;
    } else {
      throw new Error('Error while retrieving the contract pause state');
      // throw new ErrContractQuery(
      //   'Error while retrieving the contract pause state'
      // );
    }
  }

  /**
   * Retrieves the addresses with transfer roles for contract collection
   */
  async viewTransferRoles(): Promise<string[]> {
    const interaction =
      this.contract.methodsExplicit.getAddressesWithTransferRole();
    const query = interaction.buildQuery();
    const queryResponse = await this.networkProvider.queryContract(query);
    const endpointDefinition = interaction.getEndpoint();
    const { firstValue, returnCode } = new ResultsParser().parseQueryResponse(
      queryResponse,
      endpointDefinition
    );
    if (returnCode.isSuccess()) {
      const returnValue = firstValue?.valueOf();
      const addressesWithTransferRole: string[] = returnValue?.map(
        (address: any) => address.toString()
      );
      return addressesWithTransferRole;
    } else {
      throw new Error(
        'Error while retrieving the addresses with transfer roles'
      );
      // throw new ErrContractQuery(
      //   'Error while retrieving the addresses with transfer roles'
      // );
    }
  }

  /**
   * Retrieves the addresss with update attributes roles for contract collection
   */
  async viewUpdateAttributesRoles(): Promise<string[]> {
    const interaction =
      this.contract.methodsExplicit.getAddressesWithUpdateAttributesRole();
    const query = interaction.buildQuery();
    const queryResponse = await this.networkProvider.queryContract(query);
    const endpointDefinition = interaction.getEndpoint();
    const { firstValue, returnCode } = new ResultsParser().parseQueryResponse(
      queryResponse,
      endpointDefinition
    );
    if (returnCode.isSuccess()) {
      const returnValue = firstValue?.valueOf();
      const addressesWithUpdateAttributesRole: string[] = returnValue?.map(
        (address: any) => address.toString()
      );
      return addressesWithUpdateAttributesRole;
    } else {
      throw new Error(
        'Error while retrieving the addresses with update attributes roles'
      );
      // throw new ErrContractQuery(
      //   'Error while retrieving the addresses with update attributes roles'
      // );
    }
  }
}
