import {
  AbiRegistry,
  Address,
  AddressValue,
  BigUIntValue,
  ResultsParser,
  // BooleanValue,
  // ContractCallPayloadBuilder,
  // ContractFunction,
  // IAddress,
  SmartContract,
  U64Value,
  U8Value,
  VariadicValue,
  // Transaction,
  // U64Value
} from '@multiversx/sdk-core/out';
import { ProxyNetworkProvider } from '@multiversx/sdk-network-providers/out';
import { Environment, getNetworkConfig, marketPlaceContractAddress } from './config';
// import { MarketplaceRequirements } from 'types/MarketplaceRequirements';
// import { Offer } from 'types/Offer';
import dataMarketAbi from './abis/data_market.abi.json';
import { Offer } from './interfaces';

export class DataNftMarket {
  readonly contract: SmartContract;
  readonly chainID: string;
  readonly networkProvider: ProxyNetworkProvider;



  /**
   * Creates a new instance of the DataNftMarket 
   * @param env Environment.DEVNET or Environment.MAINNET
   * @param timeout Timeout for the network provider (DEFAULT = 10000ms)
   */
  constructor(env: Environment, timeout: number = 10000) {
    const networkConfig = getNetworkConfig(env);
    this.chainID = networkConfig.chainID;
    this.networkProvider = new ProxyNetworkProvider(networkConfig.networkProvider, { timeout: timeout });
    const contractAddress = marketPlaceContractAddress[env];

    this.contract = new SmartContract({
      address: new Address(contractAddress),
      abi: AbiRegistry.create(dataMarketAbi),
    });

  }

  /**
     * Returns a list of offers for a given address
     * @param address Address to query
     */
  async viewAddressListedOffers(address: string): Promise<Offer[]> {
    const interaction = this.contract.methodsExplicit.viewUserListedOffers([new AddressValue(new Address(address))]);
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
      const offers: Offer[] = (returnValue ?? []).map((offer: any) => ({
        index: offer["offer_id"],
        owner: offer["owner"].bech32(),
        offeredTokenIdentifier: offer["offered_token_identifier"].toString(),
        offeredTokenNonce: offer["offered_token_nonce"].toString(),
        offeredTokenAmount: offer["offered_token_amount"] as number,
        wantedTokenIdentifier: offer["wanted_token_identifier"].toString(),
        wantedTokenNonce: offer["wanted_token_nonce"].toString(),
        wantedTokenAmount: offer["wanted_token_amount"] as number,
        quantity: offer.quantity as number,
      }));
      return offers;
    } else {
      return [];
    }
  }

  /**
     * Returns the total number of offers for a given address
     * @param address Address to query
     */
  async viewAddressTotalOffers(address: string): Promise<BigUIntValue> {
    const interaction = this.contract.methodsExplicit.viewUserTotalOffers([new AddressValue(new Address(address))]);
    const query = interaction.buildQuery();
    const queryResponse = await this.networkProvider.queryContract(query);
    const endpointDefinition = interaction.getEndpoint();
    const { firstValue, returnCode } = new ResultsParser().parseQueryResponse(
      queryResponse,
      endpointDefinition
    );
    if (returnCode.isSuccess()) {
      const returnValue = firstValue?.valueOf();
      return new BigUIntValue(returnValue);
    } else {
      return new BigUIntValue(0);
    }

  }


  // async viewOffersPaged(from: number, size: number): Promise<Offer[]> {



  // }

  // async viewAddressNumberOfOffers(address: IAddress): Promise<number> { }

  // async viewAddressOffers(
  //   from: number,
  //   size: number,
  //   address: IAddress
  // ): Promise<Offer[]> { }

  // async viewRequirements(): Promise<MarketplaceRequirementsType> { }

  // async viewLastValidOfferId(): Promise<number> { }

  // createAcceptOfferTransaction(
  //   offerId: number,
  //   price: number,
  //   amount: number,
  //   senderAddress: string
  // ): Transaction { }

  // createCancelOffer(
  //   offerId: number,
  //   senderAddress: string,
  //   sendFundsBackToOwner = true
  // ): Transaction {
  //   const cancelTx = new Transaction({
  //     value: 0,
  //     data: new ContractCallPayloadBuilder()
  //       .setFunction(new ContractFunction('cancelOffer'))
  //       .addArg(new U64Value(index))
  //       .addArg(new BooleanValue(true))
  //       .build(),
  //     receiver: this.contract.getAddress(),
  //     gasLimit: 12000000,
  //     sender: new Address(senderAddress),
  //     chainID: this.chainID
  //   });

  //   return cancelTx;
  // }

  // createAddToMarketTransaction(
  //   dataNftNonce: number,
  //   dataNftQuantity: number,
  //   pricePerDataNft: number,
  //   senderAddress: string
  // ): Transaction { }

  // createRemoveFromMarketTransaction(
  //   offerId: number,
  //   amountToRemove: number,
  //   senderAddress: string
  // ): Transaction { }

  // createUpdatePriceTransaction(
  //   offerId: number,
  //   newPrice: number,
  //   senderAddress: string
  // ): Transaction { }
}
