import {
  Address,
  AddressValue,
  BooleanType,
  BooleanValue,
  ContractCallPayloadBuilder,
  IAddress,
  OptionValue,
  ResultsParser,
  TokenIdentifierValue,
  Transaction,
  VariadicValue
} from '@multiversx/sdk-core/out';
import {
  dataNftTokenIdentifier,
  EnvironmentsEnum,
  livelinessStakeContractAddress
} from './config';
import { Contract } from './contract';
import livelinessStakeAbi from './abis/core-mx-liveliness-stake.abi.json';
import {
  ContractConfiguration,
  LivelinessStakeConfiguration,
  State,
  UserData
} from './interfaces';
import { ErrContractQuery } from './errors';
import {
  parseLivelinessStakeConfiguration,
  parseUserData
} from './common/utils';
import BigNumber from 'bignumber.js';
import { Token } from 'nft.storage';

export class LivelinessStake extends Contract {
  constructor(env: string, timeout: number = 10000) {
    super(
      env,
      new Address(livelinessStakeContractAddress[env as EnvironmentsEnum]),
      livelinessStakeAbi,
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
   * Returns the `liveliness stake` contract configuration
   */
  async viewContractConfiguration(): Promise<LivelinessStakeConfiguration> {
    const interaction = this.contract.methodsExplicit.contractDetails([]);
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
      const livelinessConfiguration =
        parseLivelinessStakeConfiguration(returnValue);
      return livelinessConfiguration;
    } else {
      throw new ErrContractQuery(
        'viewContractConfiguration',
        returnCode.toString()
      );
    }
  }

  /**
   * Returns the `user data out` for a given address
   * @param address address to check user data out
   * @param tokenIdentifier the token identifier of the Data Nft [default is the Data Nft token identifier based on {@link EnvironmentsEnum}]
   */
  async getUserDataOut(
    address: IAddress,
    tokenIdentifier = dataNftTokenIdentifier[this.env as EnvironmentsEnum]
  ): Promise<{
    contractDetails: LivelinessStakeConfiguration;
    userData: UserData;
  }> {
    const interaction = this.contract.methodsExplicit.userDataOut([
      new AddressValue(address),
      new TokenIdentifierValue(tokenIdentifier)
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
      const livelinessConfiguration = parseLivelinessStakeConfiguration(
        returnValue.field0.valueOf()
      );
      const userData = parseUserData(returnValue.field1.valueOf());
      return { contractDetails: livelinessConfiguration, userData };
    } else {
      throw new ErrContractQuery('getUserDataOut', returnCode.toString());
    }
  }

  /**
   * Returns rewards state as a `State` enum
   */
  async viewRewardsState(): Promise<State> {
    const interaction = this.contract.methodsExplicit.rewardsState([]);
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
   * Returns a `BigNumber.Value` representing the claimable rewards
   * @param address address to check claimable rewards
   * @param bypass_liveliness_check boolean value to bypass liveliness check
   * @returns
   */

  async viewClaimableRewards(
    address: IAddress,
    bypass_liveliness_check: boolean = false
  ): Promise<BigNumber.Value> {
    let interaction = bypass_liveliness_check
      ? this.contract.methodsExplicit.claimableRewards([
          new AddressValue(address),
          new OptionValue(
            new BooleanType(),
            new BooleanValue(bypass_liveliness_check)
          )
        ])
      : this.contract.methodsExplicit.claimableRewards([
          new AddressValue(address),
          new OptionValue(
            new BooleanType(),
            new BooleanValue(bypass_liveliness_check)
          )
        ]);

    const query = interaction.buildQuery();
    const queryResponse = await this.networkProvider.queryContract(query);
    const endpointDefinition = interaction.getEndpoint();
    const { firstValue, returnCode } = new ResultsParser().parseQueryResponse(
      queryResponse,
      endpointDefinition
    );
    if (returnCode.isSuccess()) {
      return BigNumber(firstValue?.valueOf());
    } else {
      throw new ErrContractQuery('viewClaimableRewards', returnCode.toString());
    }
  }

  /**
   * Builds a `claimRewards` transaction
   * @param senderAddress address of the sender
   * @returns
   */
  claimRewards(senderAddress: IAddress): Transaction {
    const claimRewardsTx = new Transaction({
      value: 0,
      data: new ContractCallPayloadBuilder()
        .setFunction('claimRewards')
        .build(),
      receiver: this.contract.getAddress(),
      sender: senderAddress,
      gasLimit: 50_000_000,
      chainID: this.chainID
    });
    return claimRewardsTx;
  }

  /**
   * Builds a `stakeRewards` transaction
   * @param senderAddress address of the sender
   * @param tokenIdentifier the token identifier of the Data Nft [default is the Data Nft token identifier based on {@link EnvironmentsEnum}]
   */
  stakeRewards(
    senderAddress: IAddress,
    tokenIdentifier = dataNftTokenIdentifier[this.env as EnvironmentsEnum]
  ): Transaction {
    const stakeRewardsTx = new Transaction({
      value: 0,
      data: new ContractCallPayloadBuilder()
        .setFunction('stakeRewards')
        .addArg(new TokenIdentifierValue(tokenIdentifier))
        .build(),
      receiver: this.contract.getAddress(),
      sender: senderAddress,
      gasLimit: 90_000_000,
      chainID: this.chainID
    });
    return stakeRewardsTx;
  }
}
