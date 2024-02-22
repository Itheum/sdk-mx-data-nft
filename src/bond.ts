import { AbiRegistry, Address, SmartContract } from '@multiversx/sdk-core/out';
import { ApiNetworkProvider } from '@multiversx/sdk-network-providers/out';
import { ErrNetworkConfig } from './errors';
import {
  EnvironmentsEnum,
  bondContractAddress,
  networkConfiguration
} from './config';

import bondContractAbi from './abis/core-mx-life-bonding-sc.abi.json';

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
}
