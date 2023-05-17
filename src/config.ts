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
  devnet: 'DATANFTFT4-3ba099',
  mainnet: 'DATANFTFT-e6fb09',
  testnet: ''
};

export const marketPlaceContractAddress: { [key in EnvironmentsEnum]: string } =
  {
    devnet: 'erd1qqqqqqqqqqqqqpgqrwtl03qdxjv2e52ta5ry4rg0z7l95neqfsxsp4y4xh',
    mainnet: 'erd1qqqqqqqqqqqqqpgqxytuyt0p2c67nucvahk5y5s2ry3mjdrmc77q6ew3xc',
    testnet: ''
  };

export const minterContractAddress: { [key in EnvironmentsEnum]: string } = {
  devnet: 'erd1qqqqqqqqqqqqqpgqpd9qxrq5a03jrneafmlmckmlj5zgdj55fsxsqa7jsm',
  mainnet: 'erd1qqqqqqqqqqqqqpgq44muq3nqezx0ma9vu82rs6x3sycwjzrcc77qze5uju',
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
