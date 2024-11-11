declare const window: {
  ITH_GLOBAL_MVX_RPC_API_SESSION: string;
} & Window;

import { ApiNetworkProvider } from '@multiversx/sdk-core/out';
import { DataNftMarket, SftMinter } from '../src/index';

describe('testing environment market', () => {
  test('#devnet-default', async () => {
    const datanft = new DataNftMarket('devnet');

    expect(datanft.chainID).toStrictEqual('D');
    expect(datanft.networkProvider).toStrictEqual(
      new ApiNetworkProvider('https://devnet-api.multiversx.com', {
        timeout: 20000,
        clientName: 'ithuemDataNftSDK'
      })
    );
  });

  test('#mainnet-default', async () => {
    const datanft = new DataNftMarket('mainnet');

    expect(datanft.chainID).toStrictEqual('1');
    expect(datanft.networkProvider).toStrictEqual(
      new ApiNetworkProvider('https://api.multiversx.com', {
        timeout: 20000,
        clientName: 'ithuemDataNftSDK'
      })
    );
  });

  test('#devnet-custom-timeout', async () => {
    const datanft = new DataNftMarket('devnet', 20000);

    expect(datanft.chainID).toStrictEqual('D');
    expect(datanft.networkProvider).toStrictEqual(
      new ApiNetworkProvider('https://devnet-api.multiversx.com', {
        timeout: 20000,
        clientName: 'ithuemDataNftSDK'
      })
    );
  });

  test('#mainnet-custom-timeout', async () => {
    const datanft = new DataNftMarket('mainnet', 20000);

    expect(datanft.chainID).toStrictEqual('1');
    expect(datanft.networkProvider).toStrictEqual(
      new ApiNetworkProvider('https://api.multiversx.com', {
        timeout: 20000,
        clientName: 'ithuemDataNftSDK'
      })
    );
  });
});

describe('testing environment minter', () => {
  test('#devnet-default', async () => {
    const datanft = new SftMinter('devnet');

    expect(datanft.chainID).toStrictEqual('D');
    expect(datanft.networkProvider).toStrictEqual(
      new ApiNetworkProvider('https://devnet-api.multiversx.com', {
        timeout: 20000,
        clientName: 'ithuemDataNftSDK'
      })
    );
  });

  test('#mainnet-default', async () => {
    const datanft = new DataNftMarket('mainnet');

    expect(datanft.chainID).toStrictEqual('1');
    expect(datanft.networkProvider).toStrictEqual(
      new ApiNetworkProvider('https://api.multiversx.com', {
        timeout: 20000,
        clientName: 'ithuemDataNftSDK'
      })
    );
  });

  test('#devnet-custom-timeout', async () => {
    const datanft = new SftMinter('devnet', 20000);

    expect(datanft.chainID).toStrictEqual('D');
    expect(datanft.networkProvider).toStrictEqual(
      new ApiNetworkProvider('https://devnet-api.multiversx.com', {
        timeout: 20000,
        clientName: 'ithuemDataNftSDK'
      })
    );
  });

  test('#mainnet-custom-timeout', async () => {
    const datanft = new SftMinter('mainnet', 20000);

    expect(datanft.chainID).toStrictEqual('1');
    expect(datanft.networkProvider).toStrictEqual(
      new ApiNetworkProvider('https://api.multiversx.com', {
        timeout: 20000,
        clientName: 'ithuemDataNftSDK'
      })
    );
  });
});
