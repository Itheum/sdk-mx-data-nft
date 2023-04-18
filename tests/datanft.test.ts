import { DataNft } from '../src';

describe('Data NFT test', () => {
  test('#getMessageToSign', async () => {
    DataNft.setNetworkConfig('DEVNET');
    const dataNft = new DataNft({
      dataMarshal:
        'https://d37x5igq4vw5mq.cloudfront.net/datamarshalapi/achilles/v1'
    });

    const nonceToSign = await dataNft.getMessageToSign();

    expect(typeof nonceToSign).toBe('string');

    const nft = await DataNft.createFromApi('DATANFTFT3-d0978e', 62);

    expect(nft).toBeInstanceOf(DataNft);
  });
});
