import {
  AbiRegistry,
  Address,
  AddressValue,
  BigUIntValue,
  BooleanValue,
  ContractCallPayloadBuilder,
  ContractFunction,
  IAddress,
  ResultsParser,
  SmartContract,
  StringValue,
  TokenIdentifierValue,
  Transaction,
  U64Value
} from '@multiversx/sdk-core/out';
import { ApiNetworkProvider } from '@multiversx/sdk-network-providers/out';
import {
  EnvironmentsEnum,
  dataNftTokenIdentifier,
  imageService,
  networkConfiguration
} from './config';
import { ErrContractQuery, ErrNetworkConfig } from './errors';
import BigNumber from 'bignumber.js';

export abstract class Minter {
  readonly contract: SmartContract;
  readonly chainID: string;
  readonly networkProvider: ApiNetworkProvider;
  readonly env: string;
  readonly imageServiceUrl: string;

  protected constructor(
    env: string,
    contractAddress: IAddress,
    abiFile: any,
    timeout: number = 10000
  ) {
    if (!(env in EnvironmentsEnum)) {
      throw new ErrNetworkConfig(
        `Invalid environment: ${env}, Expected: 'devnet' | 'mainnet' | 'testnet'`
      );
    }
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
    this.contract = new SmartContract({
      address: contractAddress,
      abi: AbiRegistry.create(abiFile)
    });
  }

  /**
   * Retrieves the address of the minter smart contract based on the environment
   */
  getContractAddress(): IAddress {
    return this.contract.getAddress();
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
      throw new ErrContractQuery(
        'viewContractPauseState',
        returnCode.toString()
      );
    }
  }

  /**
   * Retrieves the minter whitelist
   */
  async viewWhitelist(): Promise<string[]> {
    const interaction = this.contract.methodsExplicit.getWhiteList();
    const query = interaction.buildQuery();
    const queryResponse = await this.networkProvider.queryContract(query);
    const endpointDefinition = interaction.getEndpoint();
    const { firstValue, returnCode } = new ResultsParser().parseQueryResponse(
      queryResponse,
      endpointDefinition
    );
    if (returnCode.isSuccess()) {
      const returnValue = firstValue?.valueOf();
      const whitelist: string[] = returnValue.map((addres: any) =>
        addres.toString()
      );
      return whitelist;
    } else {
      throw new ErrContractQuery('viewWhitelist', returnCode.toString());
    }
  }

  /**
   * Retrieves a list of addresses that are frozen for collection
   */
  async viewCollectionFrozenAddresses(): Promise<string[]> {
    const interaction = this.contract.methodsExplicit.getCollectionFrozenList();
    const query = interaction.buildQuery();
    const queryResponse = await this.networkProvider.queryContract(query);
    const endpointDefinition = interaction.getEndpoint();
    const { firstValue, returnCode } = new ResultsParser().parseQueryResponse(
      queryResponse,
      endpointDefinition
    );
    if (returnCode.isSuccess()) {
      const returnValue = firstValue?.valueOf();
      const frozenAddresses: string[] = returnValue.map((addres: any) =>
        addres.toString()
      );
      return frozenAddresses;
    } else {
      throw new ErrContractQuery(
        'viewCollectionFrozenAddresses',
        returnCode.toString()
      );
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
    quantityToBurn: BigNumber.Value,
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
      gasLimit: 100000000,
      sender: senderAddress,
      chainID: this.chainID
    });
    return setLocalRolesTx;
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
      gasLimit: 6000000,
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
      gasLimit: 6000000,
      sender: senderAddress,
      chainID: this.chainID
    });

    return unpauseContractTx;
  }

  /** Creates a set mint tax transaction for the contract
   * @param senderAddress The address of the sender, must be the admin of the contract
   * @param tokenIdentifier The token identifier of the token to set the mint tax
   * @param tax The tax to set for the token
   */
  setMintTax(
    senderAddress: IAddress,
    tokenIdentifier: string,
    tax: BigNumber.Value
  ): Transaction {
    const setMintTaxTx = new Transaction({
      value: 0,
      data: new ContractCallPayloadBuilder()
        .setFunction(new ContractFunction('setAntiSpamTax'))
        .addArg(new TokenIdentifierValue(tokenIdentifier))
        .addArg(new BigUIntValue(tax))
        .build(),
      receiver: this.contract.getAddress(),
      gasLimit: 6000000,
      sender: senderAddress,
      chainID: this.chainID
    });
    return setMintTaxTx;
  }

  /**
   *
   * @param senderAddress The address of the sender, must be the admin of the contract
   * @param minRoyalties The minimum royalties to set for minting
   * @param maxRoyalties The maximum royalties to set for minting
   *
   * Remarks: The royalties are set in percentage (e.g. 100% = 10000)
   */
  setRoyaltiesLimits(
    senderAddress: IAddress,
    minRoyalties: BigNumber.Value,
    maxRoyalties: BigNumber.Value
  ): Transaction {
    const setRoyaltiesLimitsTx = new Transaction({
      value: 0,
      data: new ContractCallPayloadBuilder()
        .setFunction(new ContractFunction('setRoyaltiesLimits'))
        .addArg(new BigUIntValue(minRoyalties))
        .addArg(new BigUIntValue(maxRoyalties))
        .build(),
      receiver: this.contract.getAddress(),
      gasLimit: 6000000,
      sender: senderAddress,
      chainID: this.chainID
    });
    return setRoyaltiesLimitsTx;
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
      gasLimit: 6000000,
      sender: senderAddress,
      chainID: this.chainID
    });
    return setWhitelistIsEnabledTx;
  }

  /** Creates a whitelist transaction for the contract
   * @param senderAddress The address of the sender, must be the admin of the contract
   * @param addresses The addresses to whitelist
   * @param extraGas The extra gas to add to the transaction
   */

  whitelist(
    senderAddress: IAddress,
    addresses: string[],
    extraGas = 0
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
      gasLimit: 50000000 + extraGas,
      sender: senderAddress,
      chainID: this.chainID
    });
    return whitelistTx;
  }

  /**  Creates a remove whitelist transaction for the contract
   *  @param senderAddress The address of the sender, must be the admin of the contract
   *  @param addresses The addresses to remove from the whitelist
   *  @param extraGas The extra gas to add to the transaction
   */
  removeWhitelist(
    senderAddress: IAddress,
    addresses: string[],
    extraGas = 0
  ): Transaction {
    const removeWhitelistTx = new Transaction({
      value: 0,
      data: new ContractCallPayloadBuilder()
        .setFunction(new ContractFunction('removeWhiteListSpots'))
        .setArgs(
          addresses.map((address) => new AddressValue(new Address(address)))
        )
        .build(),
      receiver: this.contract.getAddress(),
      gasLimit: 50000000 + extraGas,
      sender: senderAddress,
      chainID: this.chainID
    });
    return removeWhitelistTx;
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
        .addArg(new U64Value(timeLimit))
        .build(),
      receiver: this.contract.getAddress(),
      gasLimit: 6000000,
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
      gasLimit: 6000000,
      sender: senderAddress,
      chainID: this.chainID
    });
    return setAdministratorTx;
  }

  // Collection management methods

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
      gasLimit: 100000000,
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
      gasLimit: 100000000,
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
      gasLimit: 100000000,
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
      gasLimit: 100000000,
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
      gasLimit: 100000000,
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
      gasLimit: 100000000,
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
      gasLimit: 100000000,
      sender: senderAddress,
      chainID: this.chainID
    });
    return wipeSingleNFTTx;
  }
}
