import {
  Address,
  AddressValue,
  BigUIntValue,
  BooleanValue,
  ContractCallPayloadBuilder,
  ContractFunction,
  IAddress,
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

export class NftMinter extends Minter {
  constructor(env: string, contractAddress: string, timeout: number = 10000) {
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
    options: {
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
        .build();
    }

    const initializeContractTx = new Transaction({
      value: 50000000000000000,
      data: data,
      receiver: this.contract.getAddress(),
      gasLimit: 10000000,
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
   * @param options [optional] below parameters are optional or required based on use case
   *                 - imageUrl: the URL of the image for the Data NFT
   *                 - traitsUrl: the URL of the traits for the Data NFT
   *                 - nftStorageToken: the nft storage token to be used to upload the image and metadata to IPFS
   *                 - antiSpamTokenIdentifier: the anti spam token identifier to be used for the minting (default = `ITHEUM` token identifier based on the  {@link EnvironmentsEnum})
   *                 - antiSpamTax: the anti spam tax to be set for the Data NFT-FT with decimals. Needs to be greater than 0 and should be obtained in real time via {@link viewMinterRequirements} prior to calling mint.
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
      supply,
      datasetTitle,
      datasetDescription,
      _mandatoryParamsList: [
        'senderAddress',
        'tokenName',
        'royalties',
        'supply',
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
    if (antiSpamTax && antiSpamTokenIdentifier && antiSpamTax > 0) {
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

  /**
   * Creates a setLocalRoles transaction for the contract
   * @param senderAddress The address of the sender, must be the admin of the contract
   */
  setLocalRoles(senderAddress: IAddress): Transaction {
    const setLocalRolesTx = new Transaction({
      value: 0,
      data: new ContractCallPayloadBuilder()
        .setFunction(new ContractFunction('setLocalRoles'))
        .build(),
      receiver: this.contract.getAddress(),
      gasLimit: 10000000,
      sender: senderAddress,
      chainID: this.chainID
    });
    return setLocalRolesTx;
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

  /** Creates a pause transaction for the contract
   * @param senderAddress The address of the sender, must be the admin of the contract
   */
  pauseContract(senderAddress: IAddress): Transaction {
    const pauseContractTx = new Transaction({
      value: 0,
      data: new ContractCallPayloadBuilder()
        .setFunction(new ContractFunction('setIsPaused'))
        .addArg(new BooleanValue(true))
        .build(),
      receiver: this.contract.getAddress(),
      gasLimit: 10000000,
      sender: senderAddress,
      chainID: this.chainID
    });

    return pauseContractTx;
  }

  /** Creates a unpause transaction for the contract
   * @param senderAddress The address of the sender, must be the admin of the contract
   */
  unpauseContract(senderAddress: IAddress): Transaction {
    const unpauseContractTx = new Transaction({
      value: 0,
      data: new ContractCallPayloadBuilder()
        .setFunction(new ContractFunction('setIsPaused'))
        .addArg(new BooleanValue(false))
        .build(),
      receiver: this.contract.getAddress(),
      gasLimit: 10000000,
      sender: senderAddress,
      chainID: this.chainID
    });

    return unpauseContractTx;
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

  /** Creates a set mint tax transaction for the contract
   * @param senderAddress The address of the sender, must be the admin of the contract
   * @param tokenIdentifier The token identifier of the token to set the mint tax
   * @param tax The tax to set for the token
   */
  setMintTax(
    senderAddress: IAddress,
    tokenIdentifier: string,
    tax: number
  ): Transaction {
    const setMintTaxTx = new Transaction({
      value: 0,
      data: new ContractCallPayloadBuilder()
        .setFunction(new ContractFunction('setAntiSpamTax'))
        .addArg(new TokenIdentifierValue(tokenIdentifier))
        .addArg(new BigUIntValue(tax))
        .build(),
      receiver: this.contract.getAddress(),
      gasLimit: 10000000,
      sender: senderAddress,
      chainID: this.chainID
    });
    return setMintTaxTx;
  }

  /** Creates a set mint tax transaction for the contract
   * @param senderAddress The address of the sender, must be the admin of the contract
   * @param is_enabled A boolean value to set if whitelist is enabled or not
   */
  setWhitelistIsEnabled(
    senderAddress: IAddress,
    is_enabled: boolean
  ): Transaction {
    const setWhitelistIsEnabledTx = new Transaction({
      value: 0,
      data: new ContractCallPayloadBuilder()
        .setFunction(new ContractFunction('setWhiteListEnabled'))
        .addArg(new BooleanValue(is_enabled))
        .build(),
      receiver: this.contract.getAddress(),
      gasLimit: 10000000,
      sender: senderAddress,
      chainID: this.chainID
    });
    return setWhitelistIsEnabledTx;
  }

  /** Creates a whitelist transaction for the contract
   * @param senderAddress The address of the sender, must be the admin of the contract
   * @param addresses The addresses to whitelist
   */

  whitelist(
    senderAddress: IAddress,
    addresses: string[],
    gasLimit = 0
  ): Transaction {
    const whitelistTx = new Transaction({
      value: 0,
      data: new ContractCallPayloadBuilder()
        .setFunction(new ContractFunction('setWhiteListSpots'))
        .setArgs(
          addresses.map((address) => new AddressValue(new Address(address)))
        )
        .build(),
      receiver: this.contract.getAddress(),
      gasLimit: 10000000 + gasLimit,
      sender: senderAddress,
      chainID: this.chainID
    });
    return whitelistTx;
  }

  /**  Creates a delist transaction for the contract
   *  @param senderAddress The address of the sender, must be the admin of the contract
   *  @param addresses The addresses to delist
   */
  delist(
    senderAddress: IAddress,
    addresses: string[],
    gasLimit: 0
  ): Transaction {
    const delistTx = new Transaction({
      value: 0,
      data: new ContractCallPayloadBuilder()
        .setFunction(new ContractFunction('delist'))
        .setArgs(
          addresses.map((address) => new AddressValue(new Address(address)))
        )
        .build(),
      receiver: this.contract.getAddress(),
      gasLimit: 10000000 + gasLimit,
      sender: senderAddress,
      chainID: this.chainID
    });
    return delistTx;
  }

  /** Creates a set mint time limit transaction for the contract
   * @param senderAddress The address of the sender, must be the admin of the contract
   * @param timeLimit(seconds)  The time limit to set between mints
   */
  setMintTimeLimit(senderAddress: IAddress, timeLimit: number): Transaction {
    const setMintTimeLimitTx = new Transaction({
      value: 0,
      data: new ContractCallPayloadBuilder()
        .setFunction(new ContractFunction('setMintTimeLimit'))
        .addArg(new BigUIntValue(timeLimit))
        .build(),
      receiver: this.contract.getAddress(),
      gasLimit: 10000000,
      sender: senderAddress,
      chainID: this.chainID
    });
    return setMintTimeLimitTx;
  }

  /** Sets a new administrator for the contract
   * @param senderAddress The address of the sender, must be the admin of the contract
   * @param newAdministrator The address of the new administrator
   */
  setAdministrator(
    senderAddress: IAddress,
    newAdministrator: IAddress
  ): Transaction {
    const setAdministratorTx = new Transaction({
      value: 0,
      data: new ContractCallPayloadBuilder()
        .setFunction(new ContractFunction('setAdministrator'))
        .addArg(new AddressValue(newAdministrator))
        .build(),
      receiver: this.contract.getAddress(),
      gasLimit: 10000000,
      sender: senderAddress,
      chainID: this.chainID
    });
    return setAdministratorTx;
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
   * Pause collection transaction
   * @param senderAddress The address of the sender, must be the admin or owner of the contract
   */
  pauseCollection(senderAddress: IAddress): Transaction {
    const pauseCollectionTx = new Transaction({
      value: 0,
      data: new ContractCallPayloadBuilder()
        .setFunction(new ContractFunction('pause'))
        .build(),
      receiver: this.contract.getAddress(),
      gasLimit: 10000000,
      sender: senderAddress,
      chainID: this.chainID
    });
    return pauseCollectionTx;
  }

  /**
   * Unpause collection transaction
   * @param senderAddress The address of the sender, must be the admin or owner of the contract
   */
  unpauseCollection(senderAddress: IAddress): Transaction {
    const unpauseCollectionTx = new Transaction({
      value: 0,
      data: new ContractCallPayloadBuilder()
        .setFunction(new ContractFunction('unpause'))
        .build(),
      receiver: this.contract.getAddress(),
      gasLimit: 10000000,
      sender: senderAddress,
      chainID: this.chainID
    });

    return unpauseCollectionTx;
  }

  /**
   * Freeze transaction
   * @param senderAddress The address of the sender, must be the admin or owner of the contract
   */
  freeze(senderAddress: IAddress, freezeAddress: IAddress): Transaction {
    const freezeTx = new Transaction({
      value: 0,
      data: new ContractCallPayloadBuilder()
        .setFunction(new ContractFunction('freeze'))
        .addArg(new AddressValue(freezeAddress))
        .build(),
      receiver: this.contract.getAddress(),
      gasLimit: 10000000,
      sender: senderAddress,
      chainID: this.chainID
    });

    return freezeTx;
  }

  /**
   *  Unfreeze transaction
   * @param senderAddress The address of the sender, must be the admin or owner of the contract
   */
  unfreeze(senderAddress: IAddress, unfreezeAddress: IAddress): Transaction {
    const unfreezeTx = new Transaction({
      value: 0,
      data: new ContractCallPayloadBuilder()
        .setFunction(new ContractFunction('unfreeze'))
        .addArg(new AddressValue(unfreezeAddress))
        .build(),
      receiver: this.contract.getAddress(),
      gasLimit: 10000000,
      sender: senderAddress,
      chainID: this.chainID
    });

    return unfreezeTx;
  }

  /**
   *
   * @param senderAddress The address of the sender, must be the admin or owner of the contract
   * @param nonce The nonce of the token to freeze for `freezeAddress`
   * @param freezeAddress The address to freeze
   */
  freezeSingleNFT(
    senderAddress: IAddress,
    nonce: number,
    freezeAddress: IAddress
  ): Transaction {
    const freezeSingleNFTTx = new Transaction({
      value: 0,
      data: new ContractCallPayloadBuilder()
        .setFunction(new ContractFunction('freezeSingleNFT'))
        .addArg(new U64Value(nonce))
        .addArg(new AddressValue(freezeAddress))
        .build(),
      receiver: this.contract.getAddress(),
      gasLimit: 10000000,
      sender: senderAddress,
      chainID: this.chainID
    });
    return freezeSingleNFTTx;
  }

  /**
   *
   * @param senderAddress The address of the sender, must be the admin or owner of the contract
   * @param nonce The nonce of the token to unfreeze for `unfreezeAddress`
   * @param unfreezeAddress The address to unfreeze
   */
  unFreezeSingleNFT(
    senderAddress: IAddress,
    nonce: number,
    unfreezeAddress: IAddress
  ): Transaction {
    const unFreezeSingleNFTTx = new Transaction({
      value: 0,
      data: new ContractCallPayloadBuilder()
        .setFunction(new ContractFunction('unFreezeSingleNFT'))
        .addArg(new U64Value(nonce))
        .addArg(new AddressValue(unfreezeAddress))
        .build(),
      receiver: this.contract.getAddress(),
      gasLimit: 10000000,
      sender: senderAddress,
      chainID: this.chainID
    });
    return unFreezeSingleNFTTx;
  }

  /**
   *
   * @param senderAddress The address of the sender, must be the admin or owner of the contract
   * @param nonce The nonce of the token to wipe for `wipeAddress`
   * @param wipeAddress The address to wipe from
   * Important: This will wipe all NFTs from the address
   * Note: The nonce must be freezed before wiping
   */
  wipeSingleNFT(
    senderAddress: IAddress,
    nonce: number,
    wipeAddress: IAddress
  ): Transaction {
    const wipeSingleNFTTx = new Transaction({
      value: 0,
      data: new ContractCallPayloadBuilder()
        .setFunction(new ContractFunction('wipeSingleNFT'))
        .addArg(new U64Value(nonce))
        .addArg(new AddressValue(wipeAddress))
        .build(),
      receiver: this.contract.getAddress(),
      gasLimit: 10000000,
      sender: senderAddress,
      chainID: this.chainID
    });
    return wipeSingleNFTTx;
  }
}
