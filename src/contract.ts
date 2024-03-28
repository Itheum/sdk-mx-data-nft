import {
  AbiRegistry,
  ErrContract,
  IAddress,
  SmartContract
} from '@multiversx/sdk-core/out';
import { ApiNetworkProvider } from '@multiversx/sdk-network-providers/out';
import { EnvironmentsEnum, networkConfiguration } from './config';
import { ErrContractAddressNotSet, ErrNetworkConfig } from './errors';

export abstract class Contract {
  readonly contract: SmartContract;
  readonly chainID: string;
  readonly networkProvider: ApiNetworkProvider;
  readonly env: string;

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
    if (!contractAddress.bech32()) {
      throw new ErrContractAddressNotSet(env);
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
    this.contract = new SmartContract({
      address: contractAddress,
      abi: AbiRegistry.create(abiFile)
    });
  }
}
