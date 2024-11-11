import {
  AbiRegistry,
  IAddress,
  SmartContract,
  ApiNetworkProvider,
  SmartContractTransactionsFactory,
  TransactionsFactoryConfig
} from '@multiversx/sdk-core/out';
import { EnvironmentsEnum, networkConfiguration } from './config';
import { ErrContractAddressNotSet, ErrNetworkConfig } from './errors';

export abstract class Contract {
  readonly contract: SmartContract;
  readonly chainID: string;
  readonly transactionFactory: SmartContractTransactionsFactory;
  readonly networkProvider: ApiNetworkProvider;
  readonly env: string;

  protected constructor(
    env: string,
    contractAddress: IAddress,
    abiFile: any,
    timeout: number = 20000,
    customNetworkProviderUrl?: string
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
      customNetworkProviderUrl ?? networkConfig.networkProvider,
      {
        timeout: timeout,
        clientName: 'ithuemDataNftSDK'
      }
    );

    this.transactionFactory = new SmartContractTransactionsFactory({
      config: new TransactionsFactoryConfig({ chainID: this.chainID }),
      abi: AbiRegistry.create(abiFile)
    });

    this.contract = new SmartContract({
      address: contractAddress,
      abi: AbiRegistry.create(abiFile)
    });
  }
}
