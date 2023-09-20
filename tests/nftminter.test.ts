import { Address, Transaction } from '@multiversx/sdk-core/out';
import { NftMinter } from '../src';

describe('Nft minter test', () => {
  test('#initialize minter', async () => {
    const factoryGeneratedContract = new Address(
      'erd1qqqqqqqqqqqqqpgqpd9qxrq5a03jrneafmlmckmlj5zgdj55fsxsqa7jsm'
    );
    const nftMinter = new NftMinter('devnet', factoryGeneratedContract);

    expect(nftMinter).toBeInstanceOf(NftMinter);
  });

  test('#initialize minter contract transaction', async () => {
    const factoryGeneratedContract = new Address(
      'erd1qqqqqqqqqqqqqpgqpd9qxrq5a03jrneafmlmckmlj5zgdj55fsxsqa7jsm'
    );
    const nftMinter = new NftMinter('devnet', factoryGeneratedContract);

    const adminOfContract = new Address(
      'erd1qqqqqqqqqqqqqpgqpd9qxrq5a03jrneafmlmckmlj5zgdj55fsxsqa7jsm'
    );

    const initTx = nftMinter.initializeContract(
      adminOfContract,
      'Collection-Name-To-Mint',
      'CollectionTicker',
      0,
      false,
      new Address(
        'erd1qqqqqqqqqqqqqpgqpd9qxrq5a03jrneafmlmckmlj5zgdj55fsxsqa7jsm'
      )
    );
    expect(initTx).toBeInstanceOf(Transaction);
  });

  test('#mint nft using itheum generated image', async () => {
    const factoryGeneratedContract = new Address(
      'erd1qqqqqqqqqqqqqpgqpd9qxrq5a03jrneafmlmckmlj5zgdj55fsxsqa7jsm'
    );
    const nftMinter = new NftMinter('devnet', factoryGeneratedContract);

    const senderAddress = new Address(
      'erd1qqqqqqqqqqqqqpgqpd9qxrq5a03jrneafmlmckmlj5zgdj55fsxsqa7jsm'
    );

    const mintTx = await nftMinter.mint(
      senderAddress,
      'TokenName',
      'https://d37x5igq4vw5mq.cloudfront.net/datamarshalapi/achilles/v1',
      'https://raw.githubusercontent.com/Itheum/data-assets/main/Health/H1__Signs_of_Anxiety_in_American_Households_due_to_Covid19/dataset.json',
      'https://itheumapi.com/programReadingPreview/70dc6bd0-59b0-11e8-8d54-2d562f6cba54',
      1000,
      'Title for token',
      'Description for token',
      {
        nftStorageToken:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDMzQjZGNzhmOTZmZjVmMGIwMUJFNzJmZTQ0NDRmMjBCYzhkOEQ0REUiLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTY5MTc0NDc5NDY5MCwibmFtZSI6InRlc3QifQ.lTjq16CgrDipiVClOrbWNt0A0zYkJ9YGVeDz1TlGqQ0'
      }
    );
    expect(mintTx).toBeInstanceOf(Transaction);
  }, 20000);

  test('#mint nft using your image and metadata', async () => {
    const factoryGeneratedContract = new Address(
      'erd1qqqqqqqqqqqqqpgqpd9qxrq5a03jrneafmlmckmlj5zgdj55fsxsqa7jsm'
    );
    const nftMinter = new NftMinter('devnet', factoryGeneratedContract);

    const senderAddress = new Address(
      'erd1qqqqqqqqqqqqqpgqpd9qxrq5a03jrneafmlmckmlj5zgdj55fsxsqa7jsm'
    );

    const mintTx = await nftMinter.mint(
      senderAddress,
      'TokenName',
      'https://d37x5igq4vw5mq.cloudfront.net/datamarshalapi/achilles/v1',
      'https://raw.githubusercontent.com/Itheum/data-assets/main/Health/H1__Signs_of_Anxiety_in_American_Households_due_to_Covid19/dataset.json',
      'https://itheumapi.com/programReadingPreview/70dc6bd0-59b0-11e8-8d54-2d562f6cba54',
      1000,
      'Title for token',
      'Description for token',
      {
        imageUrl:
          'https://ipfs.io/ipfs/bafybeih7bvpcfj42nawm7g4bkbu25cqxbhlzth5sxm6qjwis3tke23p7ty/image.png',
        traitsUrl:
          'https://ipfs.io/ipfs/bafybeih7bvpcfj42nawm7g4bkbu25cqxbhlzth5sxm6qjwis3tke23p7ty/metadata.json'
      }
    );
    expect(mintTx).toBeInstanceOf(Transaction);
  }, 20000);

  test('#mint nft using tax for minting', async () => {
    const factoryGeneratedContract = new Address(
      'erd1qqqqqqqqqqqqqpgqpd9qxrq5a03jrneafmlmckmlj5zgdj55fsxsqa7jsm'
    );
    const nftMinter = new NftMinter('devnet', factoryGeneratedContract);

    const senderAddress = new Address(
      'erd1qqqqqqqqqqqqqpgqpd9qxrq5a03jrneafmlmckmlj5zgdj55fsxsqa7jsm'
    );
    const mintTx = await nftMinter.mint(
      senderAddress,
      'TokenName',
      'https://d37x5igq4vw5mq.cloudfront.net/datamarshalapi/achilles/v1',
      'https://raw.githubusercontent.com/Itheum/data-assets/main/Health/H1__Signs_of_Anxiety_in_American_Households_due_to_Covid19/dataset.json',
      'https://itheumapi.com/programReadingPreview/70dc6bd0-59b0-11e8-8d54-2d562f6cba54',
      1000,
      'Title for token',
      'Description for token',
      {
        nftStorageToken:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDMzQjZGNzhmOTZmZjVmMGIwMUJFNzJmZTQ0NDRmMjBCYzhkOEQ0REUiLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTY5MTc0NDc5NDY5MCwibmFtZSI6InRlc3QifQ.lTjq16CgrDipiVClOrbWNt0A0zYkJ9YGVeDz1TlGqQ0',
        antiSpamTax: 1000000000000000000,
        antiSpamTokenIdentifier: 'EGLD'
      }
    );

    expect(mintTx).toBeInstanceOf(Transaction);
  });
});
