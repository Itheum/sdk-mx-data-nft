import { SignableMessage } from '@multiversx/sdk-core/out';
import { DataNft } from '../src';

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
  });
});
