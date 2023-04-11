import {
  Address,
  BooleanValue,
  ContractCallPayloadBuilder,
  ContractFunction,
  IAddress,
  SmartContract,
  Transaction,
  TransactionPayload,
  U64Value
} from '@multiversx/sdk-core/out';
import { MarketplaceRequirementsType } from 'types/MarketplaceRequirements';

export class DataNftMarket {
  contract: SmartContract;
  chainID: string;

  constructor(networkId: string) {
    this.chainID = networkId;
    this.contract = new SmartContract({
      address: new Address()
    });
  }

  async viewNumberOfOffers(): Promise<number> {}

  async viewOffers(from: number, size: number): Promise<Offer[]> {}

  async viewAddressNumberOfOffers(address: IAddress): Promise<number> {}

  async viewAddressOffers(
    from: number,
    size: number,
    address: IAddress
  ): Promise<Offer[]> {}

  async viewRequirements(): Promise<MarketplaceRequirementsType> {}

  async viewLastValidOfferId(): Promise<number> {}

  createAcceptOfferTransaction(
    offerId: number,
    price: number,
    amount: number,
    senderAddress: string
  ): Transaction {}

  createCancelOffer(
    offerId: number,
    senderAddress: string,
    sendFundsBackToOwner = true
  ): Transaction {
    const cancelTx = new Transaction({
      value: 0,
      data: new ContractCallPayloadBuilder()
        .setFunction(new ContractFunction('cancelOffer'))
        .addArg(new U64Value(index))
        .addArg(new BooleanValue(true))
        .build(),
      receiver: this.contract.getAddress(),
      gasLimit: 12000000,
      sender: new Address(senderAddress),
      chainID: this.chainID
    });

    return cancelTx;
  }

  createAddToMarketTransaction(
    dataNftNonce: number,
    dataNftQuantity: number,
    pricePerDataNft: number,
    senderAddress: string
  ): Transaction {}

  createRemoveFromMarketTransaction(
    offerId: number,
    amountToRemove: number,
    senderAddress: string
  ): Transaction {}

  createUpdatePriceTransaction(
    offerId: number,
    newPrice: number,
    senderAddress: string
  ): Transaction {}
}
