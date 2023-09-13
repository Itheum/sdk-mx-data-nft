import {
  BooleanValue,
  ContractCallPayloadBuilder,
  ContractFunction,
  IAddress,
  Transaction
} from '@multiversx/sdk-core/out';
import { Minter } from './minter';

export class NftMinter extends Minter {
  constructor(env: string, contractAddress: string, timeout: number = 10000) {
    super(env, contractAddress, timeout);
  }

  pauseContract(senderAddress: IAddress, state: boolean): Transaction {
    const pauseContractTx = new Transaction({
      value: 0,
      data: new ContractCallPayloadBuilder()
        .setFunction(new ContractFunction('setIsPaused'))
        .addArg(new BooleanValue(state))
        .build(),
      receiver: this.contract.getAddress(),
      gasLimit: 10000000,
      sender: senderAddress,
      chainID: this.chainID
    });

    return pauseContractTx;
  }
}
