import {
  AbiRegistry,
  Address,
  AddressValue,
  BigUIntValue,
  BooleanValue,
  IAddress,
  ResultsParser,
  SmartContract,
  U64Value,
  VariadicValue
} from '@multiversx/sdk-core/out';
import { ProxyNetworkProvider } from '@multiversx/sdk-network-providers/out';
import {
  Environment,
  networkConfiguration,
  marketPlaceContractAddress
} from './config';
import dataMarketAbi from './abis/data_market.abi.json';
import { MarketplaceRequirements, Offer } from './interfaces';

export class DataNftMarket {
  readonly contract: SmartContract;
  readonly chainID: string;
  readonly networkProvider: ProxyNetworkProvider;

  /**
   * Creates a new instance of the DataNftMarket which can be used to interact with the DataNFT-FTs inside the marketplace
   * @param env Environment.DEVNET or Environment.MAINNET
   * @param timeout Timeout for the network provider (DEFAULT = 10000ms)
   */
  constructor(env: Environment, timeout: number = 10000) {
    const networkConfig = networkConfiguration[env];
    this.chainID = networkConfig.chainID;
    this.networkProvider = new ProxyNetworkProvider(
      networkConfig.networkProvider,
      { timeout: timeout }
    );
    const contractAddress = marketPlaceContractAddress[env];

    this.contract = new SmartContract({
      address: new Address(contractAddress),
      abi: AbiRegistry.create(dataMarketAbi)
    });
  }

  /**
   * Retrieves all `Offer` objects listed on the marketplace for a given address
   * @param address Address to query
   */
  async viewAddressListedOffers(address: IAddress): Promise<Offer[]> {
    const interaction = this.contract.methodsExplicit.viewUserListedOffers([
      new AddressValue(address)
    ]);
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
      const offers: Offer[] = returnValue.map((offer: any) => ({
        index: offer['offer_id'],
        owner: offer['owner'].bech32(),
        offeredTokenIdentifier: offer['offered_token_identifier'].toString(),
        offeredTokenNonce: offer['offered_token_nonce'].toString(),
        offeredTokenAmount: offer['offered_token_amount'] as number,
        wantedTokenIdentifier: offer['wanted_token_identifier'].toString(),
        wantedTokenNonce: offer['wanted_token_nonce'].toString(),
        wantedTokenAmount: offer['wanted_token_amount'] as number,
        quantity: offer.quantity as number
      }));
      return offers;
    } else {
      return [];
    }
  }

  /**
   * Retrieves an array of `Offer` objects listed on the marketplace for a given address within a specified range.
   * @param from The starting index of the desired range of offers.
   * @param to The ending index of the desired range of offers.
   * @param address The address to query.
   */
  async viewAddressPagedOffers(
    from: number,
    to: number,
    address: IAddress
  ): Promise<Offer[]> {
    const interaction = this.contract.methodsExplicit.viewUserPagedOffers([
      new U64Value(from),
      new U64Value(to),
      new AddressValue(address)
    ]);
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
      const offers: Offer[] = returnValue.map((offer: any) => ({
        index: offer['offer_id'],
        owner: offer['owner'].bech32(),
        offeredTokenIdentifier: offer['offered_token_identifier'].toString(),
        offeredTokenNonce: offer['offered_token_nonce'].toString(),
        offeredTokenAmount: offer['offered_token_amount'] as number,
        wantedTokenIdentifier: offer['wanted_token_identifier'].toString(),
        wantedTokenNonce: offer['wanted_token_nonce'].toString(),
        wantedTokenAmount: offer['wanted_token_amount'] as number,
        quantity: offer.quantity as number
      }));
      return offers;
    } else {
      return [];
    }
  }

  /**
   * Returns the total number of offers listed for a given address
   * @param address Address to query
   */
  async viewAddressTotalOffers(address: IAddress): Promise<BigUIntValue> {
    const interaction = this.contract.methodsExplicit.viewUserTotalOffers([
      new AddressValue(address)
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
      return new BigUIntValue(returnValue);
    } else {
      return new BigUIntValue(0);
    }
  }

  /**
   * Retrieves all cancelled `Offer` objects for a given address which opted to not withdraw the funds
   * @param address Address to query
   */
  async viewAddressCancelledOffers(address: IAddress): Promise<Offer[]> {
    const interaction = this.contract.methodsExplicit.viewCancelledOffers([
      new AddressValue(address)
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
      const offers: Offer[] = returnValue.map((offer: any) => ({
        index: offer['offer_id'],
        owner: offer['owner'].bech32(),
        offeredTokenIdentifier: offer['offered_token_identifier'].toString(),
        offeredTokenNonce: offer['offered_token_nonce'].toString(),
        offeredTokenAmount: offer['offered_token_amount'] as number,
        wantedTokenIdentifier: offer['wanted_token_identifier'].toString(),
        wantedTokenNonce: offer['wanted_token_nonce'].toString(),
        wantedTokenAmount: offer['wanted_token_amount'] as number,
        quantity: offer.quantity as number
      }));
      return offers;
    } else {
      return [];
    }
  }

  /**
   * Retrieves an array of `Offer` objects in an arbitrary order.
   * @param from first index
   * @param to last index
   */
  async viewPagedOffers(from: number, to: number): Promise<Offer[]> {
    const interaction = this.contract.methodsExplicit.viewPagedOffers([
      new U64Value(from),
      new U64Value(to)
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
      const offers: Offer[] = returnValue.map((offer: any) => ({
        index: offer['offer_id'],
        owner: offer['owner'].bech32(),
        offeredTokenIdentifier: offer['offered_token_identifier'].toString(),
        offeredTokenNonce: offer['offered_token_nonce'].toString(),
        offeredTokenAmount: offer['offered_token_amount'] as number,
        wantedTokenIdentifier: offer['wanted_token_identifier'].toString(),
        wantedTokenNonce: offer['wanted_token_nonce'].toString(),
        wantedTokenAmount: offer['wanted_token_amount'] as number,
        quantity: offer.quantity as number
      }));
      return offers;
    } else {
      return [];
    }
  }

  /**
   * Returns the smart contract requirements for the marketplace
   */
  async viewRequirements(): Promise<MarketplaceRequirements> {
    const interaction = this.contract.methodsExplicit.viewRequirements();
    const query = interaction.buildQuery();
    const queryResponse = await this.networkProvider.queryContract(query);
    const endpointDefinition = interaction.getEndpoint();
    const { firstValue, returnCode } = new ResultsParser().parseQueryResponse(
      queryResponse,
      endpointDefinition
    );
    if (returnCode.isSuccess()) {
      const returnValue = firstValue?.valueOf();
      const requirements: MarketplaceRequirements = {
        acceptedTokens: returnValue['accepted_tokens'] as string[],
        acceptedPayments: returnValue['accepted_payments'] as string[],
        maximumPaymentFees: returnValue['maximum_payment_fees'] as number[],
        buyerTaxPercentageDiscount: returnValue[
          'discount_fee_percentage_buyer'
        ] as number,
        sellerTaxPercentageDiscount: returnValue[
          'discount_fee_percentage_seller'
        ] as number,
        buyerTaxPercentage: returnValue['percentage_cut_from_buyer'] as number,
        sellerTaxPercentage: returnValue['percentage_cut_from_seller'] as number
      };
      return requirements;
    } else {
      throw new Error('Error while retrieving the marketplace requirements');
    }
  }

  /**
   * Retrieves the last valid offer id in the storage
   */
  async viewLastValidOfferId(): Promise<number> {
    const interaction = this.contract.methodsExplicit.getLastValidOfferId();
    const query = interaction.buildQuery();
    const queryResponse = await this.networkProvider.queryContract(query);
    const endpointDefinition = interaction.getEndpoint();
    const { firstValue, returnCode } = new ResultsParser().parseQueryResponse(
      queryResponse,
      endpointDefinition
    );
    if (returnCode.isSuccess()) {
      const returnValue = firstValue?.valueOf();
      return new U64Value(returnValue).valueOf().toNumber();
    }
    throw new Error('Error while retrieving the last valid offer id');
  }

  /**
   * Retrieves if the smart contract is paused or not
   */
  async viewContractPauseState(): Promise<boolean> {
    const interaction = this.contract.methodsExplicit.getIsPaused();
    const query = interaction.buildQuery();
    const queryResponse = await this.networkProvider.queryContract(query);
    const endpointDefinition = interaction.getEndpoint();
    const { firstValue, returnCode } = new ResultsParser().parseQueryResponse(
      queryResponse,
      endpointDefinition
    );
    if (returnCode.isSuccess()) {
      const returnValue = firstValue?.valueOf();
      return new BooleanValue(returnValue).valueOf();
    } else {
      throw new Error('Error while retrieving the contract pause state');
    }
  }

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
