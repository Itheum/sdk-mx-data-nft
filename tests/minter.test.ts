import { Address, Transaction } from '@multiversx/sdk-core/out';
import { DataNftMinter, MinterRequirements } from '../src';
import dotenv from 'dotenv';
dotenv.config();

describe('Data Nft Minter Test', () => {
  test('#getAddress', async () => {
    const dataNftMarket = new DataNftMinter('DEVNET');
    expect(dataNftMarket.getContractAddress()).toBeInstanceOf(Address);
    expect(dataNftMarket.getContractAddress().bech32()).toStrictEqual(
      'erd1qqqqqqqqqqqqqpgqthgd3esmd5eufhh9xcjjlf6aqxts4p5dfsxsrr0u3y'
    );
  });

  test('#viewMinterRequirements', async () => {
    const dataNftMarket = new DataNftMinter('DEVNET');

    const result = await dataNftMarket.viewMinterRequirements(
      new Address(
        'erd10uavg8hd92620mfll2lt4jdmrg6xlf60awjp9ze5gthqjjhactvswfwuv8'
      )
    );
    expect(result).toBeInstanceOf(Object as unknown as MinterRequirements);
  });

  test('#burn', async () => {
    const dataNftMarket = new DataNftMinter('DEVNET');

    const result = await dataNftMarket.burn(
      new Address(
        'erd10uavg8hd92620mfll2lt4jdmrg6xlf60awjp9ze5gthqjjhactvswfwuv8'
      ),
      1,
      1
    );
    expect(result).toBeInstanceOf(Transaction);
  });

  test('#mint', async () => {
    const dataNftMarket = new DataNftMinter('DEVNET');

    const result = await dataNftMarket.mint(
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
      10
    );
    expect(result).toBeInstanceOf(Transaction);
  }, 20000);
});
