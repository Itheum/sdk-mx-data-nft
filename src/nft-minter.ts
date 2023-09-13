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

  /** Creates a pause transaction for the contract
   * @param senderAddress The address of the sender, must be the admin of the contract
   */
  pauseContract(senderAddress: IAddress): Transaction {
    const pauseContractTx = new Transaction({
      value: 0,
      data: new ContractCallPayloadBuilder()
        .setFunction(new ContractFunction('setIsPaused'))
        .addArg(new BooleanValue(true))
        .build(),
      receiver: this.contract.getAddress(),
      gasLimit: 10000000,
      sender: senderAddress,
      chainID: this.chainID
    });

    return pauseContractTx;
  }

  /** Creates a unpause transaction for the contract
   * @param senderAddress The address of the sender, must be the admin of the contract
   */
  unpauseContract(senderAddress: IAddress): Transaction {
    const unpauseContractTx = new Transaction({
      value: 0,
      data: new ContractCallPayloadBuilder()
        .setFunction(new ContractFunction('setIsPaused'))
        .addArg(new BooleanValue(false))
        .build(),
      receiver: this.contract.getAddress(),
      gasLimit: 10000000,
      sender: senderAddress,
      chainID: this.chainID
    });

    return unpauseContractTx;
  }
}
