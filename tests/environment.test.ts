import { ProxyNetworkProvider } from '@multiversx/sdk-network-providers/out';
import { DataNftMarket, DataNftMinter } from '../src/index';

describe('testing environment market', () => {
  test('#devnet-default', async () => {
    const datanft = new DataNftMarket('devnet');

    expect(datanft.chainID).toStrictEqual('D');
    expect(datanft.networkProvider).toStrictEqual(
      new ProxyNetworkProvider('https://devnet-gateway.multiversx.com', {
        timeout: 10000
      })
    );
  });

  test('#mainnet-default', async () => {
    const datanft = new DataNftMarket('mainnet');

    expect(datanft.chainID).toStrictEqual('1');
    expect(datanft.networkProvider).toStrictEqual(
      new ProxyNetworkProvider('https://gateway.multiversx.com', {
        timeout: 10000
      })
    );
  });

  test('#devnet-custom-timeout', async () => {
    const datanft = new DataNftMarket('devnet', 5000);

    expect(datanft.chainID).toStrictEqual('D');
    expect(datanft.networkProvider).toStrictEqual(
      new ProxyNetworkProvider('https://devnet-gateway.multiversx.com', {
        timeout: 5000
      })
    );
  });

  test('#mainnet-custom-timeout', async () => {
    const datanft = new DataNftMarket('mainnet', 5000);

    expect(datanft.chainID).toStrictEqual('1');
    expect(datanft.networkProvider).toStrictEqual(
      new ProxyNetworkProvider('https://gateway.multiversx.com', {
        timeout: 5000
      })
    );
  });
});

describe('testing environment minter', () => {
  test('#devnet-default', async () => {
    const datanft = new DataNftMinter('devnet');

    expect(datanft.chainID).toStrictEqual('D');
    expect(datanft.networkProvider).toStrictEqual(
      new ProxyNetworkProvider('https://devnet-gateway.multiversx.com', {
        timeout: 10000
      })
    );
  });

  test('#mainnet-default', async () => {
    const datanft = new DataNftMarket('mainnet');

    expect(datanft.chainID).toStrictEqual('1');
    expect(datanft.networkProvider).toStrictEqual(
      new ProxyNetworkProvider('https://gateway.multiversx.com', {
        timeout: 10000
      })
    );
  });

  test('#devnet-custom-timeout', async () => {
    const datanft = new DataNftMinter('devnet', 5000);

    expect(datanft.chainID).toStrictEqual('D');
    expect(datanft.networkProvider).toStrictEqual(
      new ProxyNetworkProvider('https://devnet-gateway.multiversx.com', {
        timeout: 5000
      })
    );
  });

  test('#mainnet-custom-timeout', async () => {
    const datanft = new DataNftMinter('mainnet', 5000);

    expect(datanft.chainID).toStrictEqual('1');
    expect(datanft.networkProvider).toStrictEqual(
      new ProxyNetworkProvider('https://gateway.multiversx.com', {
        timeout: 5000
      })
    );
  });
});
