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
import { Bond, Compensation } from './interfaces';
import { parseBond, parseCompensation } from './common/utils';

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
   * Returns a `Bond` object for the given bondId
   * @param bondId bond id to query
   */
  async viewBond(bondId: number): Promise<Bond> {
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
      const bond = parseBond(firstValue);
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
   * Returns a `Bond` object array for the given bondIds.
   * @param bondIds Bond ids to query.
   */
  async viewBonds(bondIds: number[]): Promise<Bond[]>;
  /**
   * Returns a `Bond` object array for the given tokenIdentifiers and nonces.
   * @param tokenIdentifier Token identifiers array to query.
   * @param nonce Nonce array to query.
   */
  async viewBonds(tokenIdentifier: string[], nonce: number[]): Promise<Bond[]>;
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
        this.contract.methodsExplicit.getBondsByTokenIdentifierAndNonce(
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
      const bonds: Bond[] = returnValue.map((offer: any) => parseBond(offer));
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
  async getCompensation(
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
      const compensation = parseCompensation(firstValue);
      return compensation;
    } else {
      throw new ErrContractQuery('getCompensation', returnCode.toString());
    }
  }
}
