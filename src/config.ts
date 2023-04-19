export enum EnvironmentsEnum {
  devnet = 'devnet',
  testnet = 'testnet',
  mainnet = 'mainnet'
}

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

const testnetNetworkConfig: Config = {
  chainID: 'T',
  networkProvider: 'https://testnet-gateway.multiversx.com'
};

export const itheumTokenIdentifier: { [key in EnvironmentsEnum]: string } = {
  devnet: 'ITHEUM-a61317',
  mainnet: 'ITHEUM-df6f26',
  testnet: ''
};

export const dataNftTokenIdentifier: { [key in EnvironmentsEnum]: string } = {
  devnet: 'DATANFTFT3-d0978e',
  mainnet: '',
  testnet: ''
};

export const marketPlaceContractAddress: { [key in EnvironmentsEnum]: string } =
  {
    devnet: 'erd1qqqqqqqqqqqqqpgqw29wx58pzm7zau2zcprfk93a60hw8vnvfsxs25rqjm',
    mainnet: '',
    testnet: ''
  };

export const minterContractAddress: { [key in EnvironmentsEnum]: string } = {
  devnet: 'erd1qqqqqqqqqqqqqpgqthgd3esmd5eufhh9xcjjlf6aqxts4p5dfsxsrr0u3y',
  mainnet: '',
  testnet: ''
};

export const apiConfiguration: { [key in EnvironmentsEnum]: string } = {
  devnet: 'https://devnet-api.multiversx.com',
  mainnet: 'https://api.multiversx.com',
  testnet: 'https://testnet-api.multiversx.com'
};

export const networkConfiguration: { [key in EnvironmentsEnum]: Config } = {
  devnet: devnetNetworkConfig,
  mainnet: mainnetNetworkConfig,
  testnet: testnetNetworkConfig
};
