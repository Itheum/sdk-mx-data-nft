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
  TypedValue,
  U64Value,
  VariadicValue
} from '@multiversx/sdk-core/out';
import {
  EnvironmentsEnum,
  bondContractAddress,
  itheumTokenIdentifier
} from './config';
import { ErrContractQuery } from './errors';

import BigNumber from 'bignumber.js';
import bondContractAbi from './abis/core-mx-life-bonding-sc.abi.json';
import {
  parseBond,
  parseBondConfiguration,
  parseCompensation,
  parseRefund,
  parseTokenIdentifier
} from './common/utils';
import { Contract } from './contract';
import {
  Bond,
  BondConfiguration,
  Compensation,
  PenaltyType,
  State
} from './interfaces';

export class BondContract extends Contract {
  /**
   * Creates a new instance of the DataNftMarket which can be used to interact with the marketplace smart contract
   * @param env 'devnet' | 'mainnet' | 'testnet'
   * @param timeout Timeout for the network provider (DEFAULT = 10000ms)
   */
  constructor(env: string, timeout: number = 10000) {
    super(
      env,
      new Address(bondContractAddress[env as EnvironmentsEnum]),
      bondContractAbi,
      timeout
    );
  }

  /**
   * Returns the contract address
   */
  getContractAddress(): IAddress {
    return this.contract.getAddress();
  }

  /**
   * Returns the contract state as a `State` enum
   */
  async viewContractState(): Promise<State> {
    const interaction = this.contract.methodsExplicit.getContractState([]);
    const query = interaction.buildQuery();
    const queryResponse = await this.networkProvider.queryContract(query);
    const endpointDefinition = interaction.getEndpoint();
    const { firstValue, returnCode } = new ResultsParser().parseQueryResponse(
      queryResponse,
      endpointDefinition
    );
    if (returnCode.isSuccess()) {
      const stateValue = firstValue?.valueOf();
      return stateValue.name as State;
    } else {
      throw new ErrContractQuery('viewContractState', returnCode.toString());
    }
  }

  /**
   * Returns the `bond` contract configuration
   */
  async viewContractConfiguration(): Promise<BondConfiguration> {
    const interaction = this.contract.methodsExplicit.getContractConfiguration(
      []
    );
    const query = interaction.buildQuery();
    const queryResponse = await this.networkProvider.queryContract(query);
    const endpointDefinition = interaction.getEndpoint();
    const { firstValue, returnCode } = new ResultsParser().parseQueryResponse(
      queryResponse,
      endpointDefinition
    );
    if (returnCode.isSuccess()) {
      const firstValueAsVariadic = firstValue as VariadicValue;
      const returnValue = firstValueAsVariadic?.valueOf();
      const bondConfiguration = parseBondConfiguration(returnValue);
      return bondConfiguration;
    } else {
      throw new ErrContractQuery(
        'viewContractConfiguration',
        returnCode.toString()
      );
    }
  }

  /**
   * Returns the contract owner address
   */
  async viewAdministrator(): Promise<string> {
    const interaction = this.contract.methodsExplicit.getAdministrator([]);
    const query = interaction.buildQuery();
    const queryResponse = await this.networkProvider.queryContract(query);
    const endpointDefinition = interaction.getEndpoint();
    const { firstValue, returnCode } = new ResultsParser().parseQueryResponse(
      queryResponse,
      endpointDefinition
    );
    if (returnCode.isSuccess()) {
      return firstValue?.valueOf();
    } else {
      throw new ErrContractQuery('viewAdministrator', returnCode.toString());
    }
  }

  /**
   * Returns the accepted callers that can bond
   */
  async viewAcceptedCallers(): Promise<string[]> {
    const interaction = this.contract.methodsExplicit.getAcceptedCallers();
    const query = interaction.buildQuery();
    const queryResponse = await this.networkProvider.queryContract(query);
    const endpointDefinition = interaction.getEndpoint();
    const { firstValue, returnCode } = new ResultsParser().parseQueryResponse(
      queryResponse,
      endpointDefinition
    );
    if (returnCode.isSuccess()) {
      return firstValue
        ?.valueOf()
        .map((address: any) => new Address(address).bech32());
    } else {
      throw new ErrContractQuery('viewAcceptedCallers', returnCode.toString());
    }
  }

  /**
   * Returns a list of addresses that are blacklisted from claiming compensations
   * @param compensationId compensaton id to query
   */
  async viewCompensationBlacklist(compensationId: number): Promise<string[]> {
    const interaction = this.contract.methodsExplicit.getCompensationBlacklist([
      new U64Value(compensationId)
    ]);
    const query = interaction.buildQuery();
    const queryResponse = await this.networkProvider.queryContract(query);
    const endpointDefinition = interaction.getEndpoint();
    const { firstValue, returnCode } = new ResultsParser().parseQueryResponse(
      queryResponse,
      endpointDefinition
    );
    if (returnCode.isSuccess()) {
      return firstValue
        ?.valueOf()
        .map((address: any) => new Address(address).bech32());
    } else {
      throw new ErrContractQuery(
        'viewCompensationBlacklist',
        returnCode.toString()
      );
    }
  }

  /**
   * Returns the contract lock periods and bond amounts
   */
  async viewLockPeriodsWithBonds(): Promise<
    { lockPeriod: number; amount: BigNumber.Value }[]
  > {
    const interaction = this.contract.methodsExplicit.getLockPeriodsBonds([]);
    const query = interaction.buildQuery();
    const queryResponse = await this.networkProvider.queryContract(query);
    const endpointDefinition = interaction.getEndpoint();
    const { firstValue, returnCode } = new ResultsParser().parseQueryResponse(
      queryResponse,
      endpointDefinition
    );
    if (returnCode.isSuccess()) {
      const lockPeriods: BigNumber[] = firstValue?.valueOf().field0;
      const bondAmounts: BigNumber[] = firstValue?.valueOf().field1;

      // Construct array of objects containing lock period and bond amount
      const result: { lockPeriod: number; amount: BigNumber.Value }[] = [];
      for (let i = 0; i < lockPeriods.length; i++) {
        const lockPeriod = lockPeriods[i].toNumber();
        const bondAmount = bondAmounts[i];
        result.push({ lockPeriod: lockPeriod, amount: bondAmount });
      }

      return result;
    } else {
      throw new ErrContractQuery(
        'viewLockPeriodsWithBonds',
        returnCode.toString()
      );
    }
  }

  /**
   * Returns the contract bond payment token
   */
  async viewBondPaymentToken(): Promise<string> {
    const interaction = this.contract.methodsExplicit.getBondPaymentToken([]);
    const query = interaction.buildQuery();
    const queryResponse = await this.networkProvider.queryContract(query);
    const endpointDefinition = interaction.getEndpoint();
    const { firstValue, returnCode } = new ResultsParser().parseQueryResponse(
      queryResponse,
      endpointDefinition
    );
    if (returnCode.isSuccess()) {
      return firstValue?.valueOf();
    } else {
      throw new ErrContractQuery('viewBondPaymentToken', returnCode.toString());
    }
  }

  /**
   * Returns a `Compensation` object for the given compensation id
   * @param compensationId compensation id to query
   */
  async viewCompensation(compensationId: number) {
    const interaction = this.contract.methodsExplicit.getCompensation([
      new U64Value(compensationId)
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
      const compensation: Compensation = parseCompensation(returnValue);
      return compensation;
    } else {
      throw new ErrContractQuery('viewCompensation', returnCode.toString());
    }
  }

  /**
   * Returns a `Compensation` object array for the given tokens
   * @param tokens tokens to query
   */
  async viewCompensations(
    tokens: { tokenIdentifier: string; nonce: number }[]
  ) {
    let combinedArray = [];
    for (const token of tokens) {
      combinedArray.push(new TokenIdentifierValue(token.tokenIdentifier));
      combinedArray.push(new U64Value(token.nonce));
    }
    const interaction =
      this.contract.methodsExplicit.getCompensations(combinedArray);
    const query = interaction.buildQuery();
    const queryResponse = await this.networkProvider.queryContract(query);
    const endpointDefinition = interaction.getEndpoint();
    const { firstValue, returnCode } = new ResultsParser().parseQueryResponse(
      queryResponse,
      endpointDefinition
    );
    if (returnCode.isSuccess()) {
      const returnValue = firstValue?.valueOf();
      const compensations: Compensation[] = returnValue.map(
        (compensation: Compensation) => parseCompensation(compensation)
      );
      return compensations;
    } else {
      throw new ErrContractQuery('viewCompensations', returnCode.toString());
    }
  }

  /**
   * Returns an Optional `Compensation` and `Refund` object for the given address and compensation id
   * @param address address to query
   * @param tokenIdentifier token identifier to query
   * @param nonce nonce to query
   */
  async viewAddressRefundForCompensation(
    address: IAddress,
    tokenIdentifier: string,
    nonce: number
  ) {
    const interaction =
      this.contract.methodsExplicit.getAddressRefundForCompensation([
        new AddressValue(address),
        new TokenIdentifierValue(tokenIdentifier),
        new U64Value(nonce)
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
      if (returnValue) {
        const [compensation, refund] = returnValue;
        const parsedCompensation = parseCompensation(compensation);
        const parsedRefund = refund ? parseRefund(refund) : null;
        return { compensation: parsedCompensation, refund: parsedRefund };
      } else {
        return null;
      }
    } else {
      throw new ErrContractQuery('viewAddressRefund', returnCode.toString());
    }
  }

  /**
   * Returns a `Compensation` object array for the given indexes
   * @param start_index index to start
   * @param end_index index to end
   */
  async viewPagedCompensations(startIndex: number, endIndex: number) {
    const interaction = this.contract.methodsExplicit.getPagedCompensations([
      new U64Value(startIndex),
      new U64Value(endIndex)
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
      const compensations: Compensation[] = returnValue.map(
        (compensation: Compensation) => parseCompensation(compensation)
      );
      return compensations;
    } else {
      throw new ErrContractQuery(
        'viewPagedCompensations',
        returnCode.toString()
      );
    }
  }

  /**
   * Returns a `Bond` object for the given bondId
   * @param bondId bond id to query
   */
  async viewBond(bondId: number) {
    const interaction = this.contract.methodsExplicit.getBond([
      new U64Value(bondId)
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
      const bond: Bond = parseBond(returnValue);
      return bond;
    } else {
      throw new ErrContractQuery('viewBond', returnCode.toString());
    }
  }

  /**
   * Returns a `Bond` object array for the given address
   * @param address address to query
   */
  async viewAddressBonds(address: IAddress): Promise<Bond[]> {
    const interaction = this.contract.methodsExplicit.getAddressBonds([
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
      const bonds: Bond[] = returnValue.map((offer: any) => parseBond(offer));
      return bonds;
    } else {
      throw new ErrContractQuery('viewAddressBonds', returnCode.toString());
    }
  }

  /**
   * Returns a `Bond` object array
   */
  async viewAllBonds(): Promise<Bond[]> {
    const interaction = this.contract.methodsExplicit.getAllBonds([]);
    const query = interaction.buildQuery();
    const queryResponse = await this.networkProvider.queryContract(query);
    const endpointDefinition = interaction.getEndpoint();
    const { firstValue, returnCode } = new ResultsParser().parseQueryResponse(
      queryResponse,
      endpointDefinition
    );
    if (returnCode.isSuccess()) {
      const returnValue = firstValue?.valueOf();
      const bonds: Bond[] = returnValue.map((offer: any) => parseBond(offer));
      return bonds;
    } else {
      throw new ErrContractQuery('viewAllBonds', returnCode.toString());
    }
  }

  /**
   * Returns the total number of bonds
   */
  async viewTotalBonds(): Promise<number> {
    const interaction = this.contract.methodsExplicit.getBondsLen([]);
    const query = interaction.buildQuery();
    const queryResponse = await this.networkProvider.queryContract(query);
    const endpointDefinition = interaction.getEndpoint();
    const { firstValue, returnCode } = new ResultsParser().parseQueryResponse(
      queryResponse,
      endpointDefinition
    );
    if (returnCode.isSuccess()) {
      return firstValue?.valueOf().toNumber();
    } else {
      throw new ErrContractQuery('viewTotalBonds', returnCode.toString());
    }
  }

  /**
   * Returns the total number of compensations
   */
  async viewTotalCompensations(): Promise<number> {
    const interaction = this.contract.methodsExplicit.getCompensationsLen([]);
    const query = interaction.buildQuery();
    const queryResponse = await this.networkProvider.queryContract(query);
    const endpointDefinition = interaction.getEndpoint();
    const { firstValue, returnCode } = new ResultsParser().parseQueryResponse(
      queryResponse,
      endpointDefinition
    );
    if (returnCode.isSuccess()) {
      return firstValue?.valueOf().toNumber();
    } else {
      throw new ErrContractQuery(
        'viewTotalCompensations',
        returnCode.toString()
      );
    }
  }

  /**
   * Returns a `Bond` object array for the given indexes
   * @param start_index index to start
   * @param end_index index to end
   */
  async viewPagedBonds(startIndex: number, endIndex: number) {
    const interaction = this.contract.methodsExplicit.getPagedBonds([
      new U64Value(startIndex),
      new U64Value(endIndex)
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
      const bonds: Bond[] = returnValue.map((bond: any) => parseBond(bond));
      return bonds;
    } else {
      throw new ErrContractQuery('viewPagedBonds', returnCode.toString());
    }
  }

  /**
   * Returns a `Bond` object array for the given bondIds
   * @param bondIds Bond ids to query
   */
  async viewBonds(bondIds: number[]): Promise<Bond[]>;
  /**
   * Returns a `Bond` object array for the given full tokenIdentifier
   * @param fullTokenIdentifier Full tokenIdentifier to query
   */
  async viewBonds(fullTokenIdentifiers: string[]): Promise<Bond[]>;
  /**
   * Returns a `Bond` object array for the given tokenIdentifiers and nonces
   * @param tokenIdentifier Token identifiers array to query
   * @param nonce Nonce array to query
   */
  async viewBonds(
    tokenIdentifiers: string[],
    nonces: number[]
  ): Promise<Bond[]>;

  async viewBonds(arg1: number[] | string[], arg2?: number[]): Promise<Bond[]> {
    let interaction;

    if (Array.isArray(arg1) && typeof arg1[0] === 'number') {
      // Implementation for bondIds
      const bondIdsAsU64 = arg1.map((id) => new U64Value(id));
      interaction = this.contract.methodsExplicit.getBonds(bondIdsAsU64);
    } else if (Array.isArray(arg1) && typeof arg1[0] === 'string' && arg2) {
      // Implementation for tokenIdentifier and nonce
      if (arg2.length !== arg1.length) {
        throw new Error(
          'Nonce is required and must have the same length as tokenIdentifier'
        );
      }
      const combinedArray = [];
      for (let i = 0; i < arg1.length; i++) {
        combinedArray.push(new TokenIdentifierValue(arg1[i].toString()));
        combinedArray.push(new U64Value(arg2[i]));
      }
      interaction =
        this.contract.methodsExplicit.getBondsByTokenIdentifierNonce(
          combinedArray
        );
    } else if (Array.isArray(arg1) && typeof arg1[0] === 'string' && !arg2) {
      // Implementation for fullTokenIdentifier
      const combinedArray = [];
      for (let i = 0; i < arg1.length; i++) {
        const { collection, nonce } = parseTokenIdentifier(arg1[i].toString());
        combinedArray.push(new TokenIdentifierValue(collection));
        combinedArray.push(new U64Value(nonce));
      }

      interaction =
        this.contract.methodsExplicit.getBondsByTokenIdentifierNonce(
          combinedArray
        );
    } else {
      throw new Error('Invalid arguments provided');
    }

    const query = interaction.buildQuery();
    const queryResponse = await this.networkProvider.queryContract(query);
    const endpointDefinition = interaction.getEndpoint();
    const { firstValue, returnCode } = new ResultsParser().parseQueryResponse(
      queryResponse,
      endpointDefinition
    );
    if (returnCode.isSuccess()) {
      const returnValue = firstValue?.valueOf();
      const bonds: Bond[] = returnValue.map((bond: any) => parseBond(bond));
      return bonds;
    } else {
      throw new ErrContractQuery('viewBonds', returnCode.toString());
    }
  }

  /**
   * Builds a `setAdministrator` transaction
   * @param senderAddress address of the sender (must be the owner of the contract)
   * @param newAdministrator new administrator address
   */
  setAdministrator(
    senderAddress: IAddress,
    newAdministrator: IAddress
  ): Transaction {
    const setAdministratorTx = new Transaction({
      value: 0,
      data: new ContractCallPayloadBuilder()
        .setFunction('setAdministrator')
        .addArg(new AddressValue(newAdministrator))
        .build(),
      receiver: this.contract.getAddress(),
      sender: senderAddress,
      gasLimit: 10_000_000,
      chainID: this.chainID
    });
    return setAdministratorTx;
  }

  /**
   * Builds a `sanction` transaction
   * @param senderAddress address of the sender (must be the owner of the contract or the administrator)
   * @param tokenIdentifier token identifier to sanction
   * @param nonce nonce to sanction
   * @param penalty penalty type
   * @param customPenalty custom penalty amount (required if penalty is `Custom`)
   */
  sanction(
    senderAddress: IAddress,
    tokenIdentifier: string,
    nonce: number,
    penalty: PenaltyType,
    customPenalty?: number
  ): Transaction {
    let data;
    if (penalty === PenaltyType.Custom && customPenalty) {
      data = new ContractCallPayloadBuilder()
        .setFunction('sanction')
        .addArg(new TokenIdentifierValue(tokenIdentifier))
        .addArg(new U64Value(nonce))
        .addArg(new U64Value(penalty))
        .addArg(new U64Value(customPenalty))
        .build();
    } else {
      data = new ContractCallPayloadBuilder()
        .setFunction('sanction')
        .addArg(new TokenIdentifierValue(tokenIdentifier))
        .addArg(new U64Value(nonce))
        .addArg(new U64Value(penalty))
        .build();
    }

    const sanctionTx = new Transaction({
      value: 0,
      data,
      receiver: this.contract.getAddress(),
      sender: senderAddress,
      gasLimit: 30_000_000,
      chainID: this.chainID
    });
    return sanctionTx;
  }

  /**
   * Builds a `modifyBond` transaction
   * @param senderAddress address of the sender (must be the owner of the contract or the administrator)
   * @param tokenIdentifier token identifier to modify the bond for
   * @param nonce nonce to modify the bond for
   */
  modifyBond(
    senderAddress: IAddress,
    tokenIdentifier: string,
    nonce: number
  ): Transaction {
    const modifyBondTx = new Transaction({
      value: 0,
      data: new ContractCallPayloadBuilder()
        .setFunction('modifyBond')
        .addArg(new TokenIdentifierValue(tokenIdentifier))
        .addArg(new U64Value(nonce))
        .build(),
      receiver: this.contract.getAddress(),
      sender: senderAddress,
      gasLimit: 10_000_000,
      chainID: this.chainID
    });
    return modifyBondTx;
  }

  /**
   * Builds a `setContractState` transaction
   * @param senderAddress address of the sender (must be the owner of the contract or the administrator)
   * @param state state to set the contract to
   */
  setContractState(senderAddress: IAddress, state: State): Transaction {
    let data;
    if (state === State.Inactive) {
      data = new ContractCallPayloadBuilder()
        .setFunction('setContractStateInactive')
        .build();
    } else {
      data = new ContractCallPayloadBuilder()
        .setFunction('setContractStateActive')
        .build();
    }

    const setContractStateTx = new Transaction({
      value: 0,
      data: data,
      receiver: this.contract.getAddress(),
      sender: senderAddress,
      gasLimit: 10_000_000,
      chainID: this.chainID
    });
    return setContractStateTx;
  }

  /**
   *Builds a `setAcceptedCallers` transaction to add accepted callers for the `bond` endpoint
   * @param senderAddress the address of the sender
   * @param addresses an array of addresses to be added as accepted callers for `bond` endpoint
   */
  setAcceptedCallers(senderAddress: IAddress, addresses: IAddress[]) {
    const inputAddresses = addresses.map(
      (address) => new AddressValue(address)
    );
    const tx = new Transaction({
      value: 0,
      data: new ContractCallPayloadBuilder()
        .setFunction('setAcceptedCallers')
        .setArgs(inputAddresses)
        .build(),
      receiver: this.contract.getAddress(),
      sender: senderAddress,
      gasLimit: 20_000_000,
      chainID: this.chainID
    });
    return tx;
  }

  /**
   *Builds a `setBlacklist` transaction to blacklist addresses
   * @param senderAddress the address of the sender
   * @param compensationid the compensation id to add the blacklist
   * @param addresses an array of addresses to be added to the blacklist
   */
  setBlacklist(
    senderAddress: IAddress,
    compensationId: number,
    addresses: IAddress[]
  ) {
    const inputAddresses = addresses.map(
      (address) => new AddressValue(address)
    );
    const tx = new Transaction({
      value: 0,
      data: new ContractCallPayloadBuilder()
        .setFunction('setBlacklist')
        .setArgs([new U64Value(compensationId), ...inputAddresses])
        .build(),
      receiver: this.contract.getAddress(),
      sender: senderAddress,
      gasLimit: 20_000_000,
      chainID: this.chainID
    });
    return tx;
  }

  /**
   *Builds a `removeBlacklist` transaction to remove addresses from the blacklist
   * @param senderAddress the address of the sender
   * @param compensationId the compensation id to remove the blacklist from
   * @param addresses an array of addresses to be removed from the blacklist
   */
  removeBlacklist(
    senderAddress: IAddress,
    compensationId: number,
    addresses: IAddress[]
  ) {
    const toBeRemovedAddresses = addresses.map(
      (address) => new AddressValue(address)
    );
    const tx = new Transaction({
      value: 0,
      data: new ContractCallPayloadBuilder()
        .setFunction('removeBlacklist')
        .setArgs([new U64Value(compensationId), ...toBeRemovedAddresses])
        .build(),
      receiver: this.contract.getAddress(),
      sender: senderAddress,
      gasLimit: 20_000_000,
      chainID: this.chainID
    });
    return tx;
  }

  /**
   * Builds a `removeAcceptedCallers` transaction to remove the accepted callers
   * @param senderAddress the address of the sender
   * @param addresses the addresses to be removed
   */
  removeAcceptedCallers(senderAddress: IAddress, addresses: IAddress[]) {
    const inputAddresses = addresses.map(
      (address) => new AddressValue(address)
    );
    const tx = new Transaction({
      value: 0,
      data: new ContractCallPayloadBuilder()
        .setFunction('removeAcceptedCallers')
        .setArgs(inputAddresses)
        .build(),
      receiver: this.contract.getAddress(),
      sender: senderAddress,
      gasLimit: 20_000_000,
      chainID: this.chainID
    });
    return tx;
  }

  /**
   * Builds a `setBondToken` transaction to set the bond token
   * @param senderAddress the address of the sender
   * @param tokenIdentifier the token identifier. If not provided, the default token identifier based on the {@link EnvironmentsEnum}
   */
  setBondToken(
    senderAddress: IAddress,
    tokenIdentifier = itheumTokenIdentifier[this.env as EnvironmentsEnum]
  ) {
    const tx = new Transaction({
      value: 0,
      data: new ContractCallPayloadBuilder()
        .setFunction('setBondToken')
        .addArg(new TokenIdentifierValue(tokenIdentifier))
        .build(),
      receiver: this.contract.getAddress(),
      sender: senderAddress,
      gasLimit: 20_000_000,
      chainID: this.chainID
    });
    return tx;
  }

  /**
   * Builds a `initiateBond` transaction to "whitelist" an address for being able to bond for a specific Data NFT
   * @param senderAddress the address of the sender
   * @param address the address to be whitelisted
   * @param tokenIdentifier the token identifier
   * @param nonce the token identifier nonce
   */
  initiateBond(
    senderAddress: IAddress,
    address: IAddress,
    tokenIdentifier: string,
    nonce: number
  ): Transaction {
    const tx = new Transaction({
      value: 0,
      data: new ContractCallPayloadBuilder()
        .setFunction('initiateBond')
        .addArg(new AddressValue(address))
        .addArg(new TokenIdentifierValue(tokenIdentifier))
        .addArg(new U64Value(nonce))
        .build(),
      receiver: this.contract.getAddress(),
      sender: senderAddress,
      gasLimit: 20_000_000,
      chainID: this.chainID
    });
    return tx;
  }

  /**
   * Builds a `addPeriodsBonds` transaction to set the periods and bonds
   * @param senderAddress the address of the sender
   * @param periods an array of periods
   * @param bonds an array of bond values
   */
  addPeriodsBonds(
    senderAddress: IAddress,
    lockPeriodsWithBonds: {
      lockPeriod: number;
      amount: BigNumber.Value;
    }[]
  ) {
    let combinedArray: TypedValue[] = [];
    lockPeriodsWithBonds.map((lockPeriodWithBond) => {
      combinedArray.push(new U64Value(lockPeriodWithBond.lockPeriod));
      combinedArray.push(new BigUIntValue(lockPeriodWithBond.amount));
    });

    const tx = new Transaction({
      value: 0,
      data: new ContractCallPayloadBuilder()
        .setFunction('addPeriodsBonds')
        .setArgs(combinedArray)
        .build(),
      receiver: this.contract.getAddress(),
      sender: senderAddress,
      gasLimit: 20_000_000,
      chainID: this.chainID
    });
    return tx;
  }

  /**
   * Builds a `removePeriodsBonds` transaction to remove the bonds for each of the specified periods
   * @param senderAddress the address of the sender
   * @param periods an array of periods for which the bonds should be removed
   */
  removePeriodsBonds(senderAddress: IAddress, periods: number[]) {
    const inputPeriods = periods.map((period) => new U64Value(period));

    const removePeriodsBondsTx = new Transaction({
      value: 0,
      data: new ContractCallPayloadBuilder()
        .setFunction('removePeriodsBonds')
        .setArgs(inputPeriods)
        .build(),
      receiver: this.contract.getAddress(),
      sender: senderAddress,
      gasLimit: 20_000_000,
      chainID: this.chainID
    });
    return removePeriodsBondsTx;
  }

  /**
  Builds a `setMinimumPenalty` transaction to set the minimum penalty
   * @param senderAddress the address of the sender
   * @param penalty the minimum penalty value to be set
   */
  setMinimumPenalty(senderAddress: IAddress, penalty: number) {
    const tx = new Transaction({
      value: 0,
      data: new ContractCallPayloadBuilder()
        .setFunction('setMinimumPenalty')
        .addArg(new U64Value(penalty))
        .build(),
      receiver: this.contract.getAddress(),
      sender: senderAddress,
      gasLimit: 20_000_000,
      chainID: this.chainID
    });
    return tx;
  }

  /**
   * Builds a `setMaximumPenalty` transaction to set the maximum penalty
   * @param senderAddress the address of the sender
   * @param penalty the maximum penalty value to be set
   */
  setMaximumPenalty(senderAddress: IAddress, penalty: number) {
    const tx = new Transaction({
      value: 0,
      data: new ContractCallPayloadBuilder()
        .setFunction('setMaximumPenalty')
        .addArg(new U64Value(penalty))
        .build(),
      receiver: this.contract.getAddress(),
      sender: senderAddress,
      gasLimit: 20_000_000,
      chainID: this.chainID
    });
    return tx;
  }

  /**
   * Builds a `setWithdrawPenalty` transaction to set the withdraw penalty
   * @param senderAddress the address of the sender
   * @param penalty the withdraw penalty value to be set
   */
  setWithdrawPenalty(senderAddress: IAddress, penalty: number) {
    const tx = new Transaction({
      value: 0,
      data: new ContractCallPayloadBuilder()
        .setFunction('setWithdrawPenalty')
        .addArg(new U64Value(penalty))
        .build(),
      receiver: this.contract.getAddress(),
      sender: senderAddress,
      gasLimit: 20_000_000,
      chainID: this.chainID
    });
    return tx;
  }

  /**
   * Builds a `refund` transaction
   * @param senderAddress the address of the sender
   * @param tokenIdentifier the identifier of the NFT/SFT
   * @param nonce the token identifier nonce
   * @param timestamp the end timestamp for the proof period for a refund
   */
  initiateRefund(
    senderAddress: IAddress,
    tokenIdentifier: string,
    nonce: number,
    timestamp: number
  ) {
    const refundTx = new Transaction({
      value: 0,
      data: new ContractCallPayloadBuilder()
        .setFunction('initiateRefund')
        .addArg(new TokenIdentifierValue(tokenIdentifier))
        .addArg(new U64Value(nonce))
        .addArg(new U64Value(timestamp))
        .build(),
      receiver: this.contract.getAddress(),
      sender: senderAddress,
      gasLimit: 20_000_000,
      chainID: this.chainID
    });
    return refundTx;
  }

  /**
   * Builds a `bond` transaction with ESDT transfer
   * @param senderAddress the address of the sender
   * @param originalCaller  the address of the original caller
   * @param tokenIdentifier the token identifier of the NFT/SFT
   * @param nonce the token identifier nonce
   * @param lockPeriod the lock period for the bond
   * @param payment the payment for the bond (tokenIdentifier and amount)
   */
  bondWithESDT(
    senderAddress: IAddress,
    originalCaller: IAddress,
    tokenIdentifier: string,
    nonce: number,
    lockPeriod: number,
    payment: {
      tokenIdentifier: string;
      amount: BigNumber.Value;
    }
  ): Transaction {
    const bondTx = new Transaction({
      value: 0,
      data: new ContractCallPayloadBuilder()
        .setFunction(new ContractFunction('ESDTTransfer'))
        .addArg(new TokenIdentifierValue(payment.tokenIdentifier))
        .addArg(new BigUIntValue(payment.amount))
        .addArg(new StringValue('bond'))
        .addArg(new AddressValue(originalCaller))
        .addArg(new TokenIdentifierValue(tokenIdentifier))
        .addArg(new U64Value(nonce))
        .addArg(new U64Value(lockPeriod))
        .build(),
      receiver: this.contract.getAddress(),
      sender: senderAddress,
      gasLimit: 40_000_000,
      chainID: this.chainID
    });
    return bondTx;
  }

  /**
   * Builds a `bond` transaction with NFT/SFT transfer
   * @param senderAddress the address of the sender
   * @param originalCaller  the address of the original caller
   * @param tokenIdentifier the token identifier of the NFT/SFT
   * @param nonce the token identifier nonce
   * @param lockPeriod the lock period for the bond
   * @param payment the payment for the bond (tokenIdentifier, nonce and amount)
   */
  bondWithNFT(
    senderAddress: IAddress,
    originalCaller: IAddress,
    tokenIdentifier: string,
    nonce: number,
    lockPeriod: number,
    payment: {
      tokenIdentifier: string;
      nonce: number;
      amount: BigNumber.Value;
    }
  ): Transaction {
    const bondTx = new Transaction({
      value: 0,
      data: new ContractCallPayloadBuilder()
        .setFunction(new ContractFunction('ESDTNFTTransfer'))
        .addArg(new TokenIdentifierValue(payment.tokenIdentifier))
        .addArg(new U64Value(payment.nonce))
        .addArg(new BigUIntValue(payment.amount))
        .addArg(new AddressValue(this.contract.getAddress()))
        .addArg(new StringValue('bond'))
        .addArg(new AddressValue(originalCaller))
        .addArg(new TokenIdentifierValue(tokenIdentifier))
        .addArg(new U64Value(nonce))
        .addArg(new U64Value(lockPeriod))
        .build(),
      receiver: senderAddress,
      sender: senderAddress,
      gasLimit: 40_000_000,
      chainID: this.chainID
    });
    return bondTx;
  }

  /**
   * Builds a `bond` transaction with EGLD transfer
   * @param senderAddress the address of the sender
   * @param originalCaller  the address of the original caller
   * @param tokenIdentifier the token identifier of the NFT/SFT
   * @param nonce the token identifier nonce
   * @param lockPeriod the lock period for the bond
   * @param payment the payment for the bond (tokenIdentifier, nonce and amount)
   */
  bondWithEGLD(
    senderAddress: IAddress,
    originalCaller: IAddress,
    tokenIdentifier: string,
    nonce: number,
    lockPeriod: number,
    payment: BigNumber.Value
  ): Transaction {
    const bondTx = new Transaction({
      value: payment,
      data: new ContractCallPayloadBuilder()
        .setFunction('bond')
        .addArg(new AddressValue(originalCaller))
        .addArg(new TokenIdentifierValue(tokenIdentifier))
        .addArg(new U64Value(nonce))
        .addArg(new U64Value(lockPeriod))
        .build(),
      receiver: this.contract.getAddress(),
      sender: senderAddress,
      gasLimit: 40_000_000,
      chainID: this.chainID
    });
    return bondTx;
  }

  /**
   * Builds a `bond` transaction with no payment
   * @param senderAddress the address of the sender
   * @param originalCaller  the address of the original caller
   * @param tokenIdentifier the token identifier of the NFT/SFT
   * @param nonce the token identifier nonce
   * @param lockPeriod the lock period for the bond
   */
  bondWithNoPayment(
    senderAddress: IAddress,
    originalCaller: IAddress,
    tokenIdentifier: string,
    nonce: number,
    lockPeriod: number
  ): Transaction {
    const bondTx = new Transaction({
      value: 0,
      data: new ContractCallPayloadBuilder()
        .setFunction('bond')
        .addArg(new AddressValue(originalCaller))
        .addArg(new TokenIdentifierValue(tokenIdentifier))
        .addArg(new U64Value(nonce))
        .addArg(new U64Value(lockPeriod))
        .build(),
      receiver: this.contract.getAddress(),
      sender: senderAddress,
      gasLimit: 40_000_000,
      chainID: this.chainID
    });
    return bondTx;
  }

  /**
   * Builds a `withdraw` transaction
   * @param senderAddress address of the sender
   * @param tokenIdentifier token identifier to withdraw the bond for
   * @param nonce nonce to withdraw the bond for
   */
  withdraw(
    senderAddress: IAddress,
    tokenIdentifier: string,
    nonce: number
  ): Transaction {
    const withdrawTx = new Transaction({
      value: 0,
      data: new ContractCallPayloadBuilder()
        .setFunction('withdraw')
        .addArg(new TokenIdentifierValue(tokenIdentifier))
        .addArg(new U64Value(nonce))
        .build(),
      receiver: this.contract.getAddress(),
      sender: senderAddress,
      gasLimit: 50_000_000,
      chainID: this.chainID
    });
    return withdrawTx;
  }

  /**
   * Builds a `renew` transaction
   * @param senderAddress address of the sender
   * @param tokenIdentifier token identifier for the bond to renew
   * @param nonce nonce for the bond to renew
   * @param newlockPeriod new lock period for the bond
   */
  renew(
    senderAddress: IAddress,
    tokenIdentifier: string,
    nonce: number
  ): Transaction {
    const data = new ContractCallPayloadBuilder()
      .setFunction('renew')
      .addArg(new TokenIdentifierValue(tokenIdentifier))
      .addArg(new U64Value(nonce))
      .build();

    const renewTx = new Transaction({
      value: 0,
      data,
      receiver: this.contract.getAddress(),
      sender: senderAddress,
      gasLimit: 10_000_000,
      chainID: this.chainID
    });
    return renewTx;
  }

  /**
   * Builds a `proof` transaction
   * @param senderAddress the address of the sender
   * @param payment the payment (NFT/SFT) to prove
   * @returns
   */
  proof(
    senderAddress: IAddress,
    payment: { tokenIdentifier: string; nonce: number; amount: BigNumber.Value }
  ): Transaction {
    const data = new ContractCallPayloadBuilder()
      .setFunction(new ContractFunction('ESDTNFTTransfer'))
      .addArg(new TokenIdentifierValue(payment.tokenIdentifier))
      .addArg(new U64Value(payment.nonce))
      .addArg(new BigUIntValue(payment.amount))
      .addArg(new AddressValue(this.contract.getAddress()))
      .addArg(new StringValue('proof'))
      .build();

    const proofTx = new Transaction({
      value: 0,
      data,
      receiver: senderAddress,
      sender: senderAddress,
      gasLimit: 40_000_000,
      chainID: this.chainID
    });
    return proofTx;
  }

  /**
   * Builds a `claimRefund` transaction
   * @param senderAddress address of the sender
   * @param tokenIdentifier token identifier of the proven ownership NFT/SFT
   * @param nonce nonce of the proven ownership NFT/SFT
   */
  claimRefund(
    senderAddress: IAddress,
    tokenIdentifier: string,
    nonce: number
  ): Transaction {
    const data = new ContractCallPayloadBuilder()
      .setFunction('claimRefund')
      .addArg(new TokenIdentifierValue(tokenIdentifier))
      .addArg(new U64Value(nonce))
      .build();

    const claimRefundTx = new Transaction({
      value: 0,
      data,
      receiver: this.contract.getAddress(),
      sender: senderAddress,
      gasLimit: 10_000_000,
      chainID: this.chainID
    });
    return claimRefundTx;
  }
}
