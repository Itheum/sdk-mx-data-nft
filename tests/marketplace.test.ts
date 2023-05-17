import { Address, BigUIntValue, Transaction } from '@multiversx/sdk-core/out';
import { DataNftMarket, MarketplaceRequirements, Offer } from '../src';

describe('Marketplace Sdk test', () => {
  test('#getAddress', async () => {
    const dataNftMarket = new DataNftMarket('devnet');
    expect(dataNftMarket.getContractAddress()).toBeInstanceOf(Address);
  });

  test('#viewAddressListedOffers', async () => {
    const dataNftMarket = new DataNftMarket('devnet');

    const result = await dataNftMarket.viewAddressListedOffers(new Address(''));

    expect(result).toBeInstanceOf(Array);
    for (const item of result) {
      expect(item).toBeInstanceOf(Object as unknown as Offer);
    }
  }, 10000);

  test('#viewAddressTotalOffers', async () => {
    const dataNftMarket = new DataNftMarket('devnet');

    const result = await dataNftMarket.viewAddressTotalOffers(new Address(''));

    expect(typeof result).toBe('number');
  });

  test('#viewRequirements', async () => {
    const dataNftMarket = new DataNftMarket('devnet');

    const result = await dataNftMarket.viewRequirements();

    expect(result).toBeInstanceOf(Object as unknown as MarketplaceRequirements);
  });

  test('#viewLastValidOfferId', async () => {
    const dataNftMarket = new DataNftMarket('devnet');

    const result = await dataNftMarket.viewLastValidOfferId();

    expect(typeof result).toBe('number');
  });

  test('#getPauseState', async () => {
    const dataNftMarket = new DataNftMarket('devnet');

    const result = await dataNftMarket.viewContractPauseState();

    expect(typeof result).toBe('boolean');
  });

  test('#addOffer', () => {
    const dataNftMarket = new DataNftMarket('devnet');

    const result = dataNftMarket.addOffer(
      new Address(''),
      '',
      0,
      0,
      '',
      0,
      0,
      0
    );

    expect(result).toBeInstanceOf(Transaction);
  });

  test('#acceptOffer', () => {
    const dataNftMarket = new DataNftMarket('devnet');

    const result = dataNftMarket.acceptOfferWithEGLD(
      new Address(''),
      0,
      0,
      '100'
    );
    const result2 = dataNftMarket.acceptOfferWithESDT(
      new Address(''),
      0,
      0,
      '1000'
    );

    const result3 = dataNftMarket.acceptOfferWithNoPayment(
      new Address(''),
      0,
      0
    );

    expect(result).toBeInstanceOf(Transaction);
    expect(result2).toBeInstanceOf(Transaction);
    expect(result3).toBeInstanceOf(Transaction);
  });

  test('#cancelOffer', () => {
    const dataNftMarket = new DataNftMarket('devnet');

    const result = dataNftMarket.cancelOffer(new Address(''), 0);

    const result2 = dataNftMarket.cancelOffer(new Address(''), 0, false);

    expect(result).toBeInstanceOf(Transaction);
    expect(result2).toBeInstanceOf(Transaction);
  });

  test('#changeOfferPrice', () => {
    const dataNftMarket = new DataNftMarket('devnet');

    const result = dataNftMarket.changeOfferPrice(new Address(''), 0, 0);

    expect(result).toBeInstanceOf(Transaction);
  });

  test('#withdrawCancelledOffer', () => {
    const dataNftMarket = new DataNftMarket('devnet');

    const result = dataNftMarket.withdrawCancelledOffer(new Address(''), 0);

    expect(result).toBeInstanceOf(Transaction);
  });

  test('#viewOffer', async () => {
    const dataNftMarket = new DataNftMarket('devnet');

    const result = await dataNftMarket.viewNumberOfOffers();

    expect(typeof result).toBe('number');
  });

  // test('#viewOffers', async () => {
  //   const dataNftMarket = new DataNftMarket('devnet');

  //   const result = await dataNftMarket.viewOffers();

  //   expect(result).toBeInstanceOf(Array);
  // }, 10000);
});
