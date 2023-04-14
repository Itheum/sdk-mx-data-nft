import { ProxyNetworkProvider } from '@multiversx/sdk-network-providers/out';
import {
  DataNft,
  DataNftMarket,
  Environment,
  MarketplaceRequirements
} from '../src/index';
import { Offer } from '../src/index';
import {
  Address,
  BigUIntValue,
  BytesValue,
  SignableMessage,
  Transaction
} from '@multiversx/sdk-core/out';

describe('testing environment', () => {
  test('#devnet-default', async () => {
    const datanft = new DataNftMarket('DEVNET');

    expect(datanft.chainID).toStrictEqual('D');
    expect(datanft.networkProvider).toStrictEqual(
      new ProxyNetworkProvider('https://devnet-gateway.multiversx.com', {
        timeout: 10000
      })
    );
    expect(datanft.contract.getAddress().bech32()).toStrictEqual(
      'erd1qqqqqqqqqqqqqpgqw29wx58pzm7zau2zcprfk93a60hw8vnvfsxs25rqjm'
    );
  });

  test('#mainnet-default', async () => {
    const datanft = new DataNftMarket('MAINNET');

    expect(datanft.chainID).toStrictEqual('1');
    expect(datanft.networkProvider).toStrictEqual(
      new ProxyNetworkProvider('https://gateway.multiversx.com', {
        timeout: 10000
      })
    );
    expect(datanft.contract.getAddress().bech32()).toStrictEqual('');
  });

  test('#devnet-custom-timeout', async () => {
    const datanft = new DataNftMarket('DEVNET', 5000);

    expect(datanft.chainID).toStrictEqual('D');
    expect(datanft.networkProvider).toStrictEqual(
      new ProxyNetworkProvider('https://devnet-gateway.multiversx.com', {
        timeout: 5000
      })
    );
    expect(datanft.contract.getAddress().bech32()).toStrictEqual(
      'erd1qqqqqqqqqqqqqpgqw29wx58pzm7zau2zcprfk93a60hw8vnvfsxs25rqjm'
    );
  });

  test('#mainnet-custom-timeout', async () => {
    const datanft = new DataNftMarket('MAINNET', 5000);

    expect(datanft.chainID).toStrictEqual('1');
    expect(datanft.networkProvider).toStrictEqual(
      new ProxyNetworkProvider('https://gateway.multiversx.com', {
        timeout: 5000
      })
    );
    expect(datanft.contract.getAddress().bech32()).toStrictEqual('');
  });
});

describe('Marketplace Sdk test', () => {
  test('#viewAddressListedOffers', async () => {
    const dataNftMarket = new DataNftMarket('DEVNET');

    const result = await dataNftMarket.viewAddressListedOffers(new Address(''));

    expect(result).toBeInstanceOf(Array);
    for (const item of result) {
      expect(item).toBeInstanceOf(Object as unknown as Offer);
    }
  });

  test('#viewAddressTotalOffers', async () => {
    const dataNftMarket = new DataNftMarket('DEVNET');

    const result = await dataNftMarket.viewAddressTotalOffers(new Address(''));

    expect(result).toBeInstanceOf(BigUIntValue);
  });

  test('#viewRequirements', async () => {
    const dataNftMarket = new DataNftMarket('DEVNET');

    const result = await dataNftMarket.viewRequirements();

    expect(result).toBeInstanceOf(Object as unknown as MarketplaceRequirements);
  });

  test('#viewLastValidOfferId', async () => {
    const dataNftMarket = new DataNftMarket('DEVNET');

    const result = await dataNftMarket.viewLastValidOfferId();

    expect(typeof result).toBe('number');
  });

  test('#getPauseState', async () => {
    const dataNftMarket = new DataNftMarket('DEVNET');

    const result = await dataNftMarket.viewContractPauseState();

    expect(typeof result).toBe('boolean');
  });

  test('#addOffer', () => {
    const dataNftMarket = new DataNftMarket('DEVNET');

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
    const dataNftMarket = new DataNftMarket('DEVNET');

    const result = dataNftMarket.acceptOffer(new Address(''), 0, 0, 0);

    expect(result).toBeInstanceOf(Transaction);
  });

  test('#cancelOffer', () => {
    const dataNftMarket = new DataNftMarket('DEVNET');

    const result = dataNftMarket.cancelOffer(new Address(''), 0);

    const result2 = dataNftMarket.cancelOffer(new Address(''), 0, false);

    expect(result).toBeInstanceOf(Transaction);
    expect(result2).toBeInstanceOf(Transaction);
  });

  test('#changeOfferPrice', () => {
    const dataNftMarket = new DataNftMarket('DEVNET');

    const result = dataNftMarket.changeOfferPrice(new Address(''), 0, 0);

    expect(result).toBeInstanceOf(Transaction);
  });

  test('#withdrawCancelledOffer', () => {
    const dataNftMarket = new DataNftMarket('DEVNET');

    const result = dataNftMarket.withdrawCancelledOffer(new Address(''), 0);

    expect(result).toBeInstanceOf(Transaction);
  });
});

describe('Data NFT test', () => {
  test('#getMessageToSign', async () => {
    DataNft.setNetworkConfig('DEVNET');
    const dataNft = new DataNft({
      dataMarshal:
        'https://d37x5igq4vw5mq.cloudfront.net/datamarshalapi/achilles/v1'
    });

    const nonceToSign = await dataNft.getMessageToSign();

    expect(typeof nonceToSign).toBe('string');

    const nft = await DataNft.fromApi('DATANFTFT3-d0978e', 62);

    expect(nft).toBeInstanceOf(DataNft);
  });
});
