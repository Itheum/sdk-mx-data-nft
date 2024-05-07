import {
  AbiRegistry,
  Address,
  AddressValue,
  BigUIntValue,
  BooleanValue,
  ContractCallPayloadBuilder,
  ContractFunction,
  IAddress,
  ResultsParser,
  SmartContract,
  StringValue,
  TokenIdentifierValue,
  Transaction,
  U64Value,
  U8Value,
  VariadicValue
} from '@multiversx/sdk-core/out';
import { ApiNetworkProvider } from '@multiversx/sdk-network-providers/out';
import dataMarketAbi from './abis/data_market.abi.json';
import { parseOffer } from './common/utils';
import {
  EnvironmentsEnum,
  itheumTokenIdentifier,
  marketPlaceContractAddress,
  networkConfiguration
} from './config';
import { ErrContractQuery, ErrNetworkConfig } from './errors';
import { MarketplaceRequirements, Offer } from './interfaces';
import BigNumber from 'bignumber.js';
// import { ErrContractQuery } from './errors';

export class DataNftMarket {
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
    const contractAddress = marketPlaceContractAddress[env as EnvironmentsEnum];

    this.contract = new SmartContract({
      address: new Address(contractAddress),
      abi: AbiRegistry.create(dataMarketAbi)
    });
  }

  /**
   * Retrieves the address of the marketplace smart contract based on the environment
   */
  getContractAddress(): IAddress {
    return this.contract.getAddress();
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
      const offers: Offer[] = returnValue.map((offer: any) =>
        parseOffer(offer)
      );
      return offers;
    } else {
      throw new ErrContractQuery(
        'viewAddressListedOffers',
        returnCode.toString()
      );
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
      const offers: Offer[] = returnValue.map((offer: any) =>
        parseOffer(offer)
      );
      return offers;
    } else {
      throw new ErrContractQuery(
        'viewAddressPagedOffers',
        returnCode.toString()
      );
    }
  }

  /**
   * Returns the total number of offers listed for a given address
   * @param address Address to query
   */
  async viewAddressTotalOffers(address: IAddress): Promise<number> {
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
      return returnValue.toNumber();
    } else {
      throw new ErrContractQuery(
        'viewAddressTotalOffers',
        returnCode.toString()
      );
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
      const offers: Offer[] = returnValue.map((offer: any) =>
        parseOffer(offer)
      );
      return offers;
    } else {
      throw new ErrContractQuery(
        'viewAddressCancelledOffers',
        returnCode.toString()
      );
    }
  }

  /**
   * Retrieves an array of `Offer` objects in an arbitrary order.
   * @param from first index
   * @param to last index
   * @param senderAddress the address of the sender (optional)
   */
  async viewPagedOffers(
    from: number,
    to: number,
    senderAddress?: IAddress
  ): Promise<Offer[]> {
    let interaction = this.contract.methodsExplicit.viewPagedOffers([
      new U64Value(from),
      new U64Value(to)
    ]);
    if (senderAddress) {
      interaction = this.contract.methodsExplicit.viewPagedOffers([
        new U64Value(from),
        new U64Value(to),
        new AddressValue(senderAddress)
      ]);
    }
    const query = interaction.buildQuery();
    const queryResponse = await this.networkProvider.queryContract(query);
    const endpointDefinition = interaction.getEndpoint();
    const { firstValue, returnCode } = new ResultsParser().parseQueryResponse(
      queryResponse,
      endpointDefinition
    );
    if (returnCode.isSuccess()) {
      const returnValue = firstValue?.valueOf();
      const offers: Offer[] = returnValue.map((offer: any) =>
        parseOffer(offer)
      );
      return offers;
    } else {
      throw new ErrContractQuery('viewPagedOffers', returnCode.toString());
    }
  }

  /**
   *  Retrieves an `Offer` object based on the offer id
   * @param offerId The id of the offer to be retrieved
   */
  async viewOffer(offerId: number): Promise<Offer> {
    let interaction = this.contract.methodsExplicit.viewOffer([
      new U64Value(offerId)
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
      const offer: Offer = parseOffer(returnValue);
      return offer;
    } else {
      throw new ErrContractQuery('viewPagedOffers', returnCode.toString());
    }
  }

  /**
   * Retrieves an array of `Offer` objects.
   */
  async viewOffers(offerIds: number[]): Promise<Offer[]> {
    const input = offerIds.map((id) => new U64Value(id));
    const interaction = this.contract.methodsExplicit.viewOffers(input);
    const query = interaction.buildQuery();
    const queryResponse = await this.networkProvider.queryContract(query);
    const endpointDefinition = interaction.getEndpoint();
    const { firstValue, returnCode } = new ResultsParser().parseQueryResponse(
      queryResponse,
      endpointDefinition
    );
    if (returnCode.isSuccess()) {
      const returnValue = firstValue?.valueOf();
      const offers: Offer[] = returnValue.map((offer: any) =>
        parseOffer(offer)
      );
      return offers;
    } else {
      throw new ErrContractQuery('viewOffers', returnCode.toString());
    }
  }

  /**
   * Retrieves the smart contract requirements for the marketplace
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
        acceptedTokens: returnValue.accepted_tokens as string[],
        acceptedPayments: returnValue.accepted_payments as string[],
        maximumPaymentFees: returnValue.maximum_payment_fees.map((v: any) =>
          v.toFixed(0)
        ),
        buyerTaxPercentageDiscount:
          returnValue.discount_fee_percentage_buyer.toNumber(),
        sellerTaxPercentageDiscount:
          returnValue.discount_fee_percentage_seller.toNumber(),
        buyerTaxPercentage: returnValue.percentage_cut_from_buyer.toNumber(),
        sellerTaxPercentage: returnValue.percentage_cut_from_seller.toNumber(),
        maxDefaultQuantity: returnValue.max_default_quantity.toNumber()
      };
      return requirements;
    } else {
      throw new ErrContractQuery('viewRequirements', returnCode.toString());
    }
  }

  /**
   * Retrieves the smart contract number of offers
   */
  async viewNumberOfOffers(): Promise<number> {
    const interaction = this.contract.methodsExplicit.viewNumberOfOffers();
    const query = interaction.buildQuery();
    const queryResponse = await this.networkProvider.queryContract(query);
    const endpointDefinition = interaction.getEndpoint();
    const { firstValue, returnCode } = new ResultsParser().parseQueryResponse(
      queryResponse,
      endpointDefinition
    );
    if (returnCode.isSuccess()) {
      const returnValue = firstValue?.valueOf();
      return new U8Value(returnValue).valueOf().toNumber();
    }
    throw new ErrContractQuery('viewNumberOfOffers', returnCode.toString());
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

    throw new ErrContractQuery('viewLastValidOfferId', returnCode.toString());
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
      throw new ErrContractQuery(
        'viewContractPauseState',
        returnCode.toString()
      );
    }
  }

  /**
   * Creates a `addOffer` transaction
   * @param senderAddress the address of the sender
   * @param dataNftIdentifier the identifier of the DATA-NFT
   * @param dataNftNonce the nonce of the DATA-NFT
   * @param dataNftAmount the amount of the DATA-NFT
   * @param paymentTokenIdentifier the identifier of the payment token `sender` wants to receive
   * @param paymentTokenNonce the nonce of the payment token
   * @param paymentTokenAmount the amount of the payment token
   * @param minimumPaymentTokenAmount the minimum amount of which the `sender` is willing to receive (useful in case where an offer was added and the smart contract fee was changed afterwards)
   * @param maxQuantity the maximum quantity a user can buy (default could be 0 - (no enforced max value) or admin defined value)
   */
  addOffer(
    senderAddress: IAddress,
    dataNftIdentifier: string,
    dataNftNonce: number,
    dataNftAmount: BigNumber.Value,
    paymentTokenIdentifier: string,
    paymentTokenNonce: number,
    paymentTokenAmount: BigNumber.Value,
    minimumPaymentTokenAmount = 0,
    maxQuantity: BigNumber.Value
  ): Transaction {
    const addOfferTx = new Transaction({
      value: 0,
      data: new ContractCallPayloadBuilder()
        .setFunction(new ContractFunction('ESDTNFTTransfer'))
        .addArg(new TokenIdentifierValue(dataNftIdentifier))
        .addArg(new U64Value(dataNftNonce))
        .addArg(new BigUIntValue(dataNftAmount))
        .addArg(new AddressValue(this.contract.getAddress()))
        .addArg(new StringValue('addOffer'))
        .addArg(new TokenIdentifierValue(paymentTokenIdentifier))
        .addArg(new U64Value(paymentTokenNonce))
        .addArg(new U64Value(paymentTokenAmount))
        .addArg(new U64Value(minimumPaymentTokenAmount))
        .addArg(new BigUIntValue(dataNftAmount))
        .addArg(new BigUIntValue(maxQuantity))
        .build(),
      receiver: senderAddress,
      sender: senderAddress,
      gasLimit: 12000000,
      chainID: this.chainID
    });

    return addOfferTx;
  }

  /**
   * Creates a `acceptOffer` transaction with ESDT tokens
   * @param senderAddress the address of the sender
   * @param offerId the id of the offer to be accepted
   * @param amount the amount of tokens to be bought
   * @param price the price of the offer for the total amount to be bought (must include the buyer fee)
   * @param paymentTokenIdentifier the identifier of the payment token (default = `ITHEUM` token identifier based on the  {@link EnvironmentsEnum}))
   */
  acceptOfferWithESDT(
    senderAddress: IAddress,
    offerId: number,
    amount: BigNumber.Value,
    price: BigNumber.Value,
    paymentTokenIdentifier = itheumTokenIdentifier[this.env as EnvironmentsEnum]
  ): Transaction {
    const data = new ContractCallPayloadBuilder()
      .setFunction(new ContractFunction('ESDTTransfer'))
      .addArg(new TokenIdentifierValue(paymentTokenIdentifier))
      .addArg(new BigUIntValue(price))
      .addArg(new StringValue('acceptOffer'))
      .addArg(new U64Value(offerId))
      .addArg(new BigUIntValue(amount))
      .build();

    const acceptTx = new Transaction({
      value: 0,
      data: data,
      receiver: this.contract.getAddress(),
      gasLimit: 20_000_000,
      sender: senderAddress,
      chainID: this.chainID
    });

    return acceptTx;
  }

  /**
   *  Creates a `acceptOffer` transaction with NFT/SFT tokens
   *  @param senderAddress the address of the sender
   *  @param offerId the id of the offer to be accepted
   *  @param amount the amount of tokens to be bought
   *  @param tokenIdentifier the identifier of the token for the payment
   *  @param nonce the nonce of the token for the payment
   *  @param paymentAmount the amount of the token for the payment
   */

  acceptOfferWithNFT(
    senderAddress: IAddress,
    offerId: number,
    amount: BigNumber.Value,
    tokenIdentifier: string,
    nonce: number,
    paymentAmount: BigNumber.Value
  ): Transaction {
    const offerEsdtTx = new Transaction({
      value: 0,
      data: new ContractCallPayloadBuilder()
        .setFunction(new ContractFunction('ESDTNFTTransfer'))
        .addArg(new TokenIdentifierValue(tokenIdentifier))
        .addArg(new U64Value(nonce))
        .addArg(new BigUIntValue(paymentAmount))
        .addArg(new AddressValue(this.contract.getAddress()))
        .addArg(new StringValue('acceptOffer'))
        .addArg(new U64Value(offerId))
        .addArg(new BigUIntValue(amount))
        .build(),
      receiver: senderAddress,
      sender: senderAddress,
      gasLimit: 20_000_000,
      chainID: this.chainID
    });
    return offerEsdtTx;
  }

  /**
   * Creates a `acceptOffer` transaction with EGLD
   * @param senderAddress the address of the sender
   * @param offerId the id of the offer to be accepted
   * @param amount the price of the offer for the total amount to be bought (must include the buyer fee)
   * @param price the price of the offer (must include the buyer fee)
   */
  acceptOfferWithEGLD(
    senderAddress: IAddress,
    offerId: number,
    amount: BigNumber.Value,
    price: BigNumber.Value
  ): Transaction {
    const data = new ContractCallPayloadBuilder()
      .setFunction(new ContractFunction('acceptOffer'))
      .addArg(new U64Value(offerId))
      .addArg(new BigUIntValue(amount))
      .build();

    const acceptTx = new Transaction({
      value: price,
      data: data,
      receiver: this.contract.getAddress(),
      gasLimit: 20_000_000,
      sender: senderAddress,
      chainID: this.chainID
    });

    return acceptTx;
  }

  /**
   * Creates a `acceptOffer` without payment token (Free)
   * @param senderAddress the address of the sender
   * @param offerId the id of the offer to be accepted
   * @param amount the amount of tokens to be bought
   */
  acceptOfferWithNoPayment(
    senderAddress: IAddress,
    offerId: number,
    amount: BigNumber.Value
  ): Transaction {
    const data = new ContractCallPayloadBuilder()
      .setFunction(new ContractFunction('acceptOffer'))
      .addArg(new U64Value(offerId))
      .addArg(new BigUIntValue(amount))
      .build();

    const acceptTx = new Transaction({
      value: 0,
      data: data,
      receiver: this.contract.getAddress(),
      gasLimit: 12000000,
      sender: senderAddress,
      chainID: this.chainID
    });

    return acceptTx;
  }

  /**
   * Creates a `cancelOffer` transaction
   * @param senderAddress the address of the sender
   * @param offerId the id of the offer to be cancelled
   * @param quantity the quantity of the offer to be cancelled
   * @param sendFundsBackToOwner default `true`, if `false` the offer will be cancelled, but the funds will be kept in the contract until withdrawal
   */
  cancelOffer(
    senderAddress: IAddress,
    offerId: number,
    quantity: number,
    sendFundsBackToOwner = true
  ): Transaction {
    const cancelTx = new Transaction({
      value: 0,
      data: new ContractCallPayloadBuilder()
        .setFunction(new ContractFunction('cancelOffer'))
        .addArg(new U64Value(offerId))
        .addArg(new U64Value(quantity))
        .addArg(new BooleanValue(sendFundsBackToOwner))
        .build(),
      receiver: this.contract.getAddress(),
      gasLimit: 10000000,
      sender: senderAddress,
      chainID: this.chainID
    });

    return cancelTx;
  }

  /**
   * Creates a `changeOfferPrice` transaction
   * @param senderAddress the address of the sender
   * @param offerId the id of the offer to be changed
   * @param newPrice the new price of the offer
   * @param newMinimumPaymentTokenAmount the new minimum amount of which the `sender` is willing to receive (useful in case where an offer was added and the smart contract fee was changed afterwards)
   */
  changeOfferPrice(
    senderAddress: IAddress,
    offerId: number,
    newPrice: BigNumber.Value,
    newMinimumPaymentTokenAmount = 0
  ): Transaction {
    const changePriceTx = new Transaction({
      value: 0,
      data: new ContractCallPayloadBuilder()
        .setFunction(new ContractFunction('changeOfferPrice'))
        .addArg(new U64Value(offerId))
        .addArg(new U64Value(newPrice))
        .addArg(new U64Value(newMinimumPaymentTokenAmount))
        .build(),
      receiver: this.contract.getAddress(),
      gasLimit: 10000000,
      sender: senderAddress,
      chainID: this.chainID
    });

    return changePriceTx;
  }

  /**
   * Creates a `withdrawCancelledOffer` transaction
   * @param senderAddress the address of the sender
   * @param offerId the id of the offer from which the funds should be withdrawn
   *
   * `offerId` must be firstly cancelled. {@link cancelOffer}
   */
  withdrawCancelledOffer(
    senderAddress: IAddress,
    offerId: number
  ): Transaction {
    const withdrawTx = new Transaction({
      value: 0,
      data: new ContractCallPayloadBuilder()
        .setFunction(new ContractFunction('withdrawCancelledOffer'))
        .addArg(new U64Value(offerId))
        .build(),
      receiver: this.contract.getAddress(),
      gasLimit: 12000000,
      sender: senderAddress,
      chainID: this.chainID
    });

    return withdrawTx;
  }
}
