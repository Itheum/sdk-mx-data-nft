import { SignableMessage } from '@multiversx/sdk-core/out';
import {
  DataNft,
  EnvironmentsEnum,
  marshalUrls,
  parseTokenIdentifier
} from '../src';
import { ErrInvalidTokenIdentifier } from '../src/errors';

describe('Data NFT test', () => {
  test('#test not setting network config', async () => {
    try {
      await DataNft.createFromApi({ nonce: 62 });
    } catch (error: any) {
      expect(error.message).toBe(
        'Network configuration is not set. Call setNetworkConfig static method before calling any method that requires network configuration.'
      );
    }
  });

  test('#test not setting network config', async () => {
    try {
      const dataNft = new DataNft({
        dataMarshal: 'https://api.itheumcloud-stg.com/datamarshalapi/router/v1'
      });

      await dataNft.viewData({
        signedMessage: 'x',
        signableMessage: new SignableMessage({ message: Buffer.from('test') }),
        stream: true
      });
    } catch (error: any) {
      expect(error.message).toBe(
        'Network configuration is not set. Call setNetworkConfig static method before calling any method that requires network configuration.'
      );
    }
  });

  test('#test bad input on createFromApi', async () => {
    try {
      DataNft.setNetworkConfig('devnet');
      await DataNft.createFromApi({
        nonce: 62,
        tokenIdentifier: 'DATANFTFT3-d0978a'
      });
    } catch (error: any) {
      expect(error.message).toBe(
        'Fetch error with status code: 404 and message: Not Found'
      );
    }
  });

  test('#getMessageToSign', async () => {
    DataNft.setNetworkConfig('devnet');
    const dataNft = new DataNft({
      dataMarshal: 'https://api.itheumcloud-stg.com/datamarshalapi/router/v1'
    });

    const nonceToSign = await dataNft.getMessageToSign();

    expect(typeof nonceToSign).toBe('string');
  }, 10000);

  test('#getOwnedByAddress', async () => {
    DataNft.setNetworkConfig('devnet');
    const dataNfts = await DataNft.ownedByAddress(
      'erd1w6ffeexmumd5qzme78grrvp33qngcgqk2prjyuuyawpc955gvcxqqrsrtw'
    );

    expect(dataNfts).toBeInstanceOf(Array);
    for (const item of dataNfts) {
      expect(item).toBeInstanceOf(Object as unknown as DataNft);
    }
  }, 10000);

  test('#Create nft from payload', async () => {
    DataNft.setNetworkConfig('mainnet');
    const query =
      'https://api.multiversx.com/nfts?identifiers=DATANFTFT-e936d4-02&withSupply=true';

    const response = await fetch(query);
    const data = await response.json();

    const dataNfts: DataNft[] = DataNft.createFromApiResponseOrBulk(data);

    for (const item of dataNfts) {
      expect(item).toBeInstanceOf(Object as unknown as DataNft);
    }
  });

  test('#create many data NFTs different token identifiers', async () => {
    DataNft.setNetworkConfig('devnet');

    const dataNfts = await DataNft.createManyFromApi([
      { nonce: 1, tokenIdentifier: 'DATANFTFT-e0b917' },
      { nonce: 2, tokenIdentifier: 'DATANFTFT-e0b917' },
      { nonce: 3 }
    ]);

    for (const item of dataNfts) {
      expect(item).toBeInstanceOf(Object as unknown as DataNft);
    }
  }, 12000);

  test('#get owners of data Nft', async () => {
    DataNft.setNetworkConfig('devnet');

    let dataNft = new DataNft({
      nonce: 2,
      tokenIdentifier: 'DATANFTFT-e0b917'
    });

    const owners = await dataNft.getOwners();
  }, 200000);

  test('#parse token identifier', () => {
    const tokenIdentifier = 'DATANFTFT3-d0978a';

    expect(() => parseTokenIdentifier(tokenIdentifier)).toThrow(
      ErrInvalidTokenIdentifier
    );

    const tokenIdentifier2 = 'DATANFTFT-e0b917-02';

    const parsed = parseTokenIdentifier(tokenIdentifier2);

    expect(parsed).toBeInstanceOf(
      Object as unknown as { collection: string; nonce: String }
    );
  }, 20000);

  test('#override marhsal url', async () => {
    DataNft.setNetworkConfig('mainnet');

    const dataNft = await DataNft.createFromApi({ nonce: 5 });

    expect(dataNft.overrideDataMarshal).toBe(
      marshalUrls[EnvironmentsEnum.mainnet]
    );
    expect(dataNft.dataMarshal).toBe(marshalUrls[EnvironmentsEnum.devnet]);
    expect(dataNft.overrideDataMarshalChainId).toBe('1');
  }, 20000);

  test('#override marshal url should be empty', async () => {
    DataNft.setNetworkConfig('mainnet');

    const dataNft = await DataNft.createFromApi({ nonce: 1 });

    expect(dataNft.overrideDataMarshal).toBe('');
    expect(dataNft.overrideDataMarshalChainId).toBe('');

    dataNft.updateDataNft({
      overrideDataMarshal: 'overrideUrl',
      overrideDataMarshalChainId: 'D'
    });

    expect(dataNft.overrideDataMarshal).toBe('overrideUrl');
    expect(dataNft.overrideDataMarshalChainId).toBe('D');
  }, 20000);
});
