import { ProxyNetworkProvider } from '@multiversx/sdk-network-providers/out';
import { DataNftMarket, DataNftMinter } from '../src/index';

describe('testing environment market', () => {
  test('#devnet-default', async () => {
    const datanft = new DataNftMarket('DEVNET');

    expect(datanft.chainID).toStrictEqual('D');
    expect(datanft.networkProvider).toStrictEqual(
      new ProxyNetworkProvider('https://devnet-gateway.multiversx.com', {
        timeout: 10000
      })
    );
    expect(datanft.contract.getAddress().bech32()).toStrictEqual(
      'erd1qqqqqqqqqqqqqpgqw29wx58pzm7zau2zcprfk93a60hw8vnvfsxs25rqjm'
    );
  });

  test('#mainnet-default', async () => {
    const datanft = new DataNftMarket('MAINNET');

    expect(datanft.chainID).toStrictEqual('1');
    expect(datanft.networkProvider).toStrictEqual(
      new ProxyNetworkProvider('https://gateway.multiversx.com', {
        timeout: 10000
      })
    );
    expect(datanft.contract.getAddress().bech32()).toStrictEqual('');
  });

  test('#devnet-custom-timeout', async () => {
    const datanft = new DataNftMarket('DEVNET', 5000);

    expect(datanft.chainID).toStrictEqual('D');
    expect(datanft.networkProvider).toStrictEqual(
      new ProxyNetworkProvider('https://devnet-gateway.multiversx.com', {
        timeout: 5000
      })
    );
    expect(datanft.contract.getAddress().bech32()).toStrictEqual(
      'erd1qqqqqqqqqqqqqpgqw29wx58pzm7zau2zcprfk93a60hw8vnvfsxs25rqjm'
    );
  });

  test('#mainnet-custom-timeout', async () => {
    const datanft = new DataNftMarket('MAINNET', 5000);

    expect(datanft.chainID).toStrictEqual('1');
    expect(datanft.networkProvider).toStrictEqual(
      new ProxyNetworkProvider('https://gateway.multiversx.com', {
        timeout: 5000
      })
    );
    expect(datanft.contract.getAddress().bech32()).toStrictEqual('');
  });
});

describe('testing environment minter', () => {
  test('#devnet-default', async () => {
    const datanft = new DataNftMinter('DEVNET');

    expect(datanft.chainID).toStrictEqual('D');
    expect(datanft.networkProvider).toStrictEqual(
      new ProxyNetworkProvider('https://devnet-gateway.multiversx.com', {
        timeout: 10000
      })
    );
    expect(datanft.contract.getAddress().bech32()).toStrictEqual(
      'erd1qqqqqqqqqqqqqpgqthgd3esmd5eufhh9xcjjlf6aqxts4p5dfsxsrr0u3y'
    );
  });

  test('#mainnet-default', async () => {
    const datanft = new DataNftMarket('MAINNET');

    expect(datanft.chainID).toStrictEqual('1');
    expect(datanft.networkProvider).toStrictEqual(
      new ProxyNetworkProvider('https://gateway.multiversx.com', {
        timeout: 10000
      })
    );
    expect(datanft.contract.getAddress().bech32()).toStrictEqual('');
  });

  test('#devnet-custom-timeout', async () => {
    const datanft = new DataNftMinter('DEVNET', 5000);

    expect(datanft.chainID).toStrictEqual('D');
    expect(datanft.networkProvider).toStrictEqual(
      new ProxyNetworkProvider('https://devnet-gateway.multiversx.com', {
        timeout: 5000
      })
    );
    expect(datanft.contract.getAddress().bech32()).toStrictEqual(
      'erd1qqqqqqqqqqqqqpgqthgd3esmd5eufhh9xcjjlf6aqxts4p5dfsxsrr0u3y'
    );
  });

  test('#mainnet-custom-timeout', async () => {
    const datanft = new DataNftMinter('MAINNET', 5000);

    expect(datanft.chainID).toStrictEqual('1');
    expect(datanft.networkProvider).toStrictEqual(
      new ProxyNetworkProvider('https://gateway.multiversx.com', {
        timeout: 5000
      })
    );
    expect(datanft.contract.getAddress().bech32()).toStrictEqual('');
  });
});
