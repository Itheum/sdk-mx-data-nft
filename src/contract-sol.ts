import { EnvironmentsEnum, networkConfiguration } from './config';
import { ErrNetworkConfig } from './errors';

export abstract class ContractSol {
  readonly chainID: string;
  readonly env: string;

  protected constructor(env: string) {
    if (!(env in EnvironmentsEnum)) {
      throw new ErrNetworkConfig(
        `Invalid environment: ${env}, Expected: 'devnet' | 'mainnet' | 'testnet'`
      );
    }

    this.env = env;
    const networkConfig = networkConfiguration[env as EnvironmentsEnum];
    this.chainID = networkConfig.chainID;
  }
}
