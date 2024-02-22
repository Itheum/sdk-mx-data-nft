import {
  AbiRegistry,
  Address,
  AddressValue,
  IAddress,
  ResultsParser,
  SmartContract,
  TokenIdentifierValue,
  U64Value
} from '@multiversx/sdk-core/out';
import { ApiNetworkProvider } from '@multiversx/sdk-network-providers/out';
import { ErrContractQuery, ErrNetworkConfig } from './errors';
import {
  EnvironmentsEnum,
  bondContractAddress,
  networkConfiguration
} from './config';

import bondContractAbi from './abis/core-mx-life-bonding-sc.abi.json';
import { Bond, Compensation, State } from './interfaces';
import {
  parseBond,
  parseCompensation,
  parseTokenIdentifier
} from './common/utils';
import BigNumber from 'bignumber.js';

export class BondContract {
  readonly contract: SmartContract;
  readonly chainID: string;
  readonly networkProvider: ApiNetworkProvider;
  readonly env: string;

  /**
   * Creates a new instance of the DataNftMarket which can be used to interact with the marketplace smart contract
   * @param env 'devnet' | 'mainnet' | 'testnet'
   * @param timeout Timeout for the network provider (DEFAULT = 10000ms)
   */
  constructor(env: string, timeout: number = 10000) {
    if (!(env in EnvironmentsEnum)) {
      throw new ErrNetworkConfig(
        `Invalid environment: ${env}, Expected: 'devnet' | 'mainnet' | 'testnet'`
      );
    }
    this.env = env;
    const networkConfig = networkConfiguration[env as EnvironmentsEnum];
    this.chainID = networkConfig.chainID;
    this.networkProvider = new ApiNetworkProvider(
      networkConfig.networkProvider,
      {
        timeout: timeout
      }
    );
    const contractAddress = bondContractAddress[env as EnvironmentsEnum];

    this.contract = new SmartContract({
      address: new Address(contractAddress),
      abi: AbiRegistry.create(bondContractAbi)
    });
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
   * Returns the contract lock periods and bond amounts
   */
  async viewLockPeriodsWithBonds(): Promise<
    { lockPeriod: string; amount: string }[]
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
      const result: { lockPeriod: string; amount: string }[] = [];
      for (let i = 0; i < lockPeriods.length; i++) {
        const lockPeriod = lockPeriods[i].toString();
        const bondAmount = bondAmounts[i].toString();
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
   * Returns a `Bond` object array for the given bondIds.
   * @param bondIds Bond ids to query.
   */
  async viewBonds(bondIds: number[]): Promise<Bond[]>;
  /**
   * Returns a `Bond` object array for the given full tokenIdentifier.
   * @param fullTokenIdentifier Full tokenIdentifier to query.
   */
  async viewBonds(fullTokenIdentifiers: string[]): Promise<Bond[]>;
  /**
   * Returns a `Bond` object array for the given tokenIdentifiers and nonces.
   * @param tokenIdentifier Token identifiers array to query.
   * @param nonce Nonce array to query.
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
   * Returns a `Compensation` object for the given tokenIdentifier and nonce
   * @param tokenIdentifier token identifier to query
   * @param nonce nonce to query
   */
  async viewCompensation(
    tokenIdentifier: string,
    nonce: number
  ): Promise<Compensation> {
    const interaction = this.contract.methodsExplicit.getCompensation([
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
      const compensation = parseCompensation(firstValue?.valueOf());
      return compensation;
    } else {
      throw new ErrContractQuery('getCompensation', returnCode.toString());
    }
  }
}
