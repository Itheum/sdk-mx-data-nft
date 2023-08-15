import { Address, Transaction } from '@multiversx/sdk-core/out';
import { DataNftMinter, MinterRequirements } from '../src';
import dotenv from 'dotenv';
dotenv.config();

describe('Data Nft Minter Test', () => {
  test('#getAddress', async () => {
    const dataNftMarket = new DataNftMinter('devnet');
    expect(dataNftMarket.getContractAddress()).toBeInstanceOf(Address);
    expect(dataNftMarket.getContractAddress().bech32()).toStrictEqual(
      'erd1qqqqqqqqqqqqqpgqpd9qxrq5a03jrneafmlmckmlj5zgdj55fsxsqa7jsm'
    );
  });

  test('#viewMinterRequirements', async () => {
    const dataNftMarket = new DataNftMinter('devnet');

    const result = await dataNftMarket.viewMinterRequirements(
      new Address(
        'erd10uavg8hd92620mfll2lt4jdmrg6xlf60awjp9ze5gthqjjhactvswfwuv8'
      )
    );
    expect(result).toBeInstanceOf(Object as unknown as MinterRequirements);
  });

  test('#burn', async () => {
    const dataNftMarket = new DataNftMinter('devnet');

    const result = await dataNftMarket.burn(
      new Address(
        'erd10uavg8hd92620mfll2lt4jdmrg6xlf60awjp9ze5gthqjjhactvswfwuv8'
      ),
      1,
      1
    );
    expect(result).toBeInstanceOf(Transaction);
  });

  test('#viewContractpauseState', async () => {
    const dataNftMarket = new DataNftMinter('devnet');

    const result = await dataNftMarket.viewContractPauseState();
    expect(typeof result).toBe('boolean');
  });

  test('mint throws an error when an invalid image URL is provided', async () => {
    const dataNftMarket = new DataNftMinter('devnet');

    const invalidImageUrl = 'invalid_url';

    const mintPromise = dataNftMarket.mint(
      new Address(
        'erd10uavg8hd92620mfll2lt4jdmrg6xlf60awjp9ze5gthqjjhactvswfwuv8'
      ),
      'TEST-TOKEN',
      'https://marshal.com',
      'https://streamdata.com',
      'https://previewdata',
      15,
      1000,
      'Test Title',
      'Test Description',
      10,
      {
        imageUrl: invalidImageUrl,
        imageDescription: 'Test Image Description'
      }
    );

    await expect(mintPromise).rejects.toThrowError('Invalid image url');
  }, 100000);
});
