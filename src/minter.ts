import {
  SmartContract,
  Address,
  IAddress,
  Transaction,
  SignableMessage
} from '@multiversx/sdk-core/out';
import { DataNft } from 'types/DataNft';
import { MinterRequirements } from 'types/MinterRequirements';

export class DataNftMarket {
  contract: SmartContract;
  chainID: string;

  constructor(networkId: string) {
    this.chainID = networkId;
    this.contract = new SmartContract({
      address: new Address()
    });
  }

  async viewMinterRequirements(): Promise<MinterRequirements> {}

  createMintTransaction(
    tokenName: string,
    dataMarshalUrl: string,
    dataStreamUrl: string,
    dataPreviewUrl: string,
    royalties: number,
    supply: number,
    datasetTitle: string,
    datasetDescription: string,
    senderAddress: IAddress
  ): Transaction {
    // Don't forget to first encrypt the data stream url
  }

  createBurnTransaction(
    dataNftNonce: number,
    senderAddress: IAddress,
    quantityToBurn: number
  ): Transaction {}

  decodeNftAttributes(nft: Nft): DataNft {}

  createViewDataMessageToSign(
    address: IAddress,
    nonce: number
  ): SignableMessage;

  viewData(viewDataSignedMessage: SignableMessage): Promise<any> {}
}
