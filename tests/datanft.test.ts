import { DataNft } from '../src';

describe('Data NFT test', () => {
  test('#getMessageToSign', async () => {
    DataNft.setNetworkConfig('devnet');
    const dataNft = new DataNft({
      dataMarshal:
        'https://d37x5igq4vw5mq.cloudfront.net/datamarshalapi/achilles/v1'
    });

    const nonceToSign = await dataNft.getMessageToSign();

    expect(typeof nonceToSign).toBe('string');

    const nft = await DataNft.createFromApi(62, 'DATANFTFT3-d0978e');

    expect(nft).toBeInstanceOf(DataNft);
  });

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
});
