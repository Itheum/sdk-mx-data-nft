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
  U64Value,
  ApiNetworkProvider,
  TokenTransfer,
  Token
} from '@multiversx/sdk-core/out';
import {
  EnvironmentsEnum,
  dataNftTokenIdentifier,
  imageService,
  networkConfiguration
} from './config';
import { ErrContractQuery, ErrNetworkConfig } from './errors';
import BigNumber from 'bignumber.js';
import { Contract } from './contract';

export abstract class Minter extends Contract {
  readonly imageServiceUrl: string;

  protected constructor(
    env: string,
    contractAddress: IAddress,
    abiFile: any,
    timeout: number = 20000,
    customNetworkProviderUrl?: string
  ) {
    super(env, contractAddress, abiFile, timeout, customNetworkProviderUrl);
    this.imageServiceUrl = imageService[env as EnvironmentsEnum];
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
    const burnTx = this.transactionFactory.createTransactionForExecute({
      function: 'burn',
      arguments: [],
      sender: senderAddress,
      contract: this.contract.getAddress(),
      gasLimit: 50_000_000n,
      tokenTransfers: [
        new TokenTransfer({
          token: new Token({
            identifier: dataNftIdentifier,
            nonce: BigInt(dataNftNonce)
          }),
          amount: BigInt(quantityToBurn.toString())
        })
      ]
    });

    return burnTx;
  }

  /**
   * Creates a setLocalRoles transaction for the contract
   * @param senderAddress The address of the sender, must be the admin of the contract
   */
  setLocalRoles(senderAddress: IAddress): Transaction {
    const setLocalRolesTx = this.transactionFactory.createTransactionForExecute(
      {
        function: 'setLocalRoles',
        arguments: [],
        sender: senderAddress,
        contract: this.contract.getAddress(),
        gasLimit: 100_000_000n
      }
    );

    return setLocalRolesTx;
  }

  /** Creates a pause transaction for the contract
   * @param senderAddress The address of the sender, must be the admin of the contract
   */
  pauseContract(senderAddress: IAddress): Transaction {
    const pauseContractTx = this.transactionFactory.createTransactionForExecute(
      {
        function: 'setIsPaused',
        arguments: [new BooleanValue(true)],
        sender: senderAddress,
        contract: this.contract.getAddress(),
        gasLimit: 6000000n
      }
    );

    return pauseContractTx;
  }

  /** Creates a unpause transaction for the contract
   * @param senderAddress The address of the sender, must be the admin of the contract
   */
  unpauseContract(senderAddress: IAddress): Transaction {
    const unpauseContractTx =
      this.transactionFactory.createTransactionForExecute({
        function: 'setIsPaused',
        arguments: [new BooleanValue(false)],
        sender: senderAddress,
        contract: this.contract.getAddress(),
        gasLimit: 6000000n
      });

    return unpauseContractTx;
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
    const setRoyaltiesLimitsTx =
      this.transactionFactory.createTransactionForExecute({
        function: 'setRoyaltiesLimits',
        arguments: [minRoyalties, maxRoyalties],
        sender: senderAddress,
        contract: this.contract.getAddress(),
        gasLimit: 6000000n
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
    const setWhitelistIsEnabledTx =
      this.transactionFactory.createTransactionForExecute({
        function: 'setWhiteListEnabled',
        arguments: [is_enabled],
        sender: senderAddress,
        contract: this.contract.getAddress(),
        gasLimit: 6000000n
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
    extraGas = 0n
  ): Transaction {
    const setWhitelistSpotsTx =
      this.transactionFactory.createTransactionForExecute({
        function: 'setWhiteListSpots',
        arguments: [addresses],
        sender: senderAddress,
        contract: this.contract.getAddress(),
        gasLimit: 6000000n + extraGas
      });

    return setWhitelistSpotsTx;
  }

  /**  Creates a remove whitelist transaction for the contract
   *  @param senderAddress The address of the sender, must be the admin of the contract
   *  @param addresses The addresses to remove from the whitelist
   *  @param extraGas The extra gas to add to the transaction
   */
  removeWhitelist(
    senderAddress: IAddress,
    addresses: string[],
    extraGas = 0n
  ): Transaction {
    const removeWhitelistSpotsTx =
      this.transactionFactory.createTransactionForExecute({
        function: 'removeWhiteListSpots',
        arguments: [addresses],
        sender: senderAddress,
        contract: this.contract.getAddress(),
        gasLimit: 6000000n + extraGas
      });

    return removeWhitelistSpotsTx;
  }

  /** Creates a set mint time limit transaction for the contract
   * @param senderAddress The address of the sender, must be the admin of the contract
   * @param timeLimit(seconds)  The time limit to set between mints
   */
  setMintTimeLimit(senderAddress: IAddress, timeLimit: number): Transaction {
    const setMintTimeLimitTx =
      this.transactionFactory.createTransactionForExecute({
        function: 'setMintTimeLimit',
        arguments: [timeLimit],
        sender: senderAddress,
        contract: this.contract.getAddress(),
        gasLimit: 6000000n
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
    const setAdministratorTx =
      this.transactionFactory.createTransactionForExecute({
        function: 'setAdministrator',
        arguments: [newAdministrator],
        sender: senderAddress,
        contract: this.contract.getAddress(),
        gasLimit: 6000000n
      });

    return setAdministratorTx;
  }

  // Collection management methods

  /**
   * Pause collection transaction
   * @param senderAddress The address of the sender, must be the admin or owner of the contract
   */
  pauseCollection(senderAddress: IAddress): Transaction {
    const pauseCollectionTx =
      this.transactionFactory.createTransactionForExecute({
        function: 'pause',
        arguments: [],
        sender: senderAddress,
        contract: this.contract.getAddress(),
        gasLimit: 100000000n
      });

    return pauseCollectionTx;
  }

  /**
   * Unpause collection transaction
   * @param senderAddress The address of the sender, must be the admin or owner of the contract
   */
  unpauseCollection(senderAddress: IAddress): Transaction {
    const unpauseCollectionTx =
      this.transactionFactory.createTransactionForExecute({
        function: 'unpause',
        arguments: [],
        sender: senderAddress,
        contract: this.contract.getAddress(),
        gasLimit: 100000000n
      });

    return unpauseCollectionTx;
  }

  /**
   * Freeze transaction
   * @param senderAddress The address of the sender, must be the admin or owner of the contract
   */
  freeze(senderAddress: IAddress, freezeAddress: IAddress): Transaction {
    const freezeTx = this.transactionFactory.createTransactionForExecute({
      function: 'freeze',
      arguments: [freezeAddress],
      sender: senderAddress,
      contract: this.contract.getAddress(),
      gasLimit: 100000000n
    });

    return freezeTx;
  }

  /**
   *  Unfreeze transaction
   * @param senderAddress The address of the sender, must be the admin or owner of the contract
   */
  unfreeze(senderAddress: IAddress, unfreezeAddress: IAddress): Transaction {
    const unfreezeTx = this.transactionFactory.createTransactionForExecute({
      function: 'unfreeze',
      arguments: [unfreezeAddress],
      sender: senderAddress,
      contract: this.contract.getAddress(),
      gasLimit: 100000000n
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
    const freezeSingleNftTx =
      this.transactionFactory.createTransactionForExecute({
        function: 'freezeSingleNFT',
        arguments: [nonce, freezeAddress],
        sender: senderAddress,
        contract: this.contract.getAddress(),
        gasLimit: 100000000n
      });

    return freezeSingleNftTx;
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
    const unfreezeSingleNftTx =
      this.transactionFactory.createTransactionForExecute({
        function: 'unFreezeSingleNFT',
        arguments: [nonce, unfreezeAddress],
        sender: senderAddress,
        contract: this.contract.getAddress(),
        gasLimit: 100000000n
      });

    return unfreezeSingleNftTx;
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
    const wipeSingleNftTx = this.transactionFactory.createTransactionForExecute(
      {
        function: 'wipeSingleNFT',
        arguments: [nonce, wipeAddress],
        sender: senderAddress,
        contract: this.contract.getAddress(),
        gasLimit: 100000000n
      }
    );

    return wipeSingleNftTx;
  }
}
