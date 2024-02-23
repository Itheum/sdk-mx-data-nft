import { Address, Transaction } from '@multiversx/sdk-core/out';
import { SftMinter, Minter, SftMinterRequirements } from '../src';

describe('Data Nft Minter Test', () => {
  // test('#viewMinterRequirements', async () => {
  //   const dataNftMarket = new SftMinter('devnet');

  //   const result = await dataNftMarket.viewMinterRequirements(
  //     new Address(
  //       'erd10uavg8hd92620mfll2lt4jdmrg6xlf60awjp9ze5gthqjjhactvswfwuv8'
  //     )
  //   );
  //   expect(result).toBeInstanceOf(Object as unknown as SftMinterRequirements);
  // });

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
