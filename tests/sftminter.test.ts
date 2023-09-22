import { Address, Transaction } from '@multiversx/sdk-core/out';
import { SftMinter, Minter, MinterRequirements } from '../src';

describe('Data Nft Minter Test', () => {
  test('#getAddress', async () => {
    const dataNftMarket = new SftMinter('devnet');
    expect(dataNftMarket.getContractAddress()).toBeInstanceOf(Address);
    expect(dataNftMarket.getContractAddress().bech32()).toStrictEqual(
      'erd1qqqqqqqqqqqqqpgqpd9qxrq5a03jrneafmlmckmlj5zgdj55fsxsqa7jsm'
    );
  });

  test('#viewMinterRequirements', async () => {
    const dataNftMarket = new SftMinter('devnet');

    const result = await dataNftMarket.viewMinterRequirements(
      new Address(
        'erd10uavg8hd92620mfll2lt4jdmrg6xlf60awjp9ze5gthqjjhactvswfwuv8'
      )
    );
    expect(result).toBeInstanceOf(Object as unknown as MinterRequirements);
  });

  test('#burn', async () => {
    const dataNftMarket = new SftMinter('devnet');

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
    const dataNftMarket = new SftMinter('devnet');

    const result = await dataNftMarket.viewContractPauseState();
    expect(typeof result).toBe('boolean');
  });
});
