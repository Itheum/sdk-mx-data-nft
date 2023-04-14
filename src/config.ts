export type Environment = 'DEVNET' | 'MAINNET';

export interface Config {
  chainID: string;
  networkProvider: string;
}

const devnetNetworkConfig: Config = {
  chainID: 'D',
  networkProvider: 'https://devnet-gateway.multiversx.com'
};

const mainnetNetworkConfig: Config = {
  chainID: '1',
  networkProvider: 'https://gateway.multiversx.com'
};

export const marketPlaceContractAddress: { [key in Environment]: string } = {
  DEVNET: 'erd1qqqqqqqqqqqqqpgqw29wx58pzm7zau2zcprfk93a60hw8vnvfsxs25rqjm',
  MAINNET: ''
};

export const minterContractAddress: { [key in Environment]: string } = {
  DEVNET: 'erd1qqqqqqqqqqqqqpgqthgd3esmd5eufhh9xcjjlf6aqxts4p5dfsxsrr0u3y',
  MAINNET: ''
};

export const apiConfiguration: { [key in Environment]: string } = {
  DEVNET: 'https://devnet-api.multiversx.com',
  MAINNET: 'https://api.multiversx.com'
};

export const networkConfiguration: { [key in Environment]: Config } = {
  DEVNET: devnetNetworkConfig,
  MAINNET: mainnetNetworkConfig
};
