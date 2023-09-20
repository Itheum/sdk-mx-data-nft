export enum EnvironmentsEnum {
  devnet = 'devnet',
  devnet2 = 'devnet2',
  testnet = 'testnet',
  mainnet = 'mainnet'
}

export interface Config {
  chainID: string;
  networkProvider: string;
}

const devnetNetworkConfig: Config = {
  chainID: 'D',
  networkProvider: 'https://devnet-api.multiversx.com'
};

const devnet2NetworkConfig: Config = {
  chainID: 'D',
  networkProvider: 'https://devnet2-api.multiversx.com'
};

const mainnetNetworkConfig: Config = {
  chainID: '1',
  networkProvider: 'https://api.multiversx.com'
};

const testnetNetworkConfig: Config = {
  chainID: 'T',
  networkProvider: 'https://testnet-api.multiversx.com'
};

export const itheumTokenIdentifier: { [key in EnvironmentsEnum]: string } = {
  devnet: 'ITHEUM-a61317',
  devnet2: '',
  mainnet: 'ITHEUM-df6f26',
  testnet: ''
};

export const dataNftTokenIdentifier: { [key in EnvironmentsEnum]: string } = {
  devnet: 'DATANFTFT4-3ba099',
  devnet2: '',
  mainnet: 'DATANFTFT-e936d4',
  testnet: ''
}; //[future] list of whitelisted tokens as Data NFTs

export const marketPlaceContractAddress: { [key in EnvironmentsEnum]: string } =
  {
    devnet: 'erd1qqqqqqqqqqqqqpgqrwtl03qdxjv2e52ta5ry4rg0z7l95neqfsxsp4y4xh',
    devnet2: '',
    mainnet: 'erd1qqqqqqqqqqqqqpgqay2r64l9nhhvmaqw4qanywfd0954w2m3c77qm7drxc',
    testnet: ''
  };

export const minterContractAddress: { [key in EnvironmentsEnum]: string } = {
  devnet: 'erd1qqqqqqqqqqqqqpgqpd9qxrq5a03jrneafmlmckmlj5zgdj55fsxsqa7jsm',
  devnet2: '',
  mainnet: 'erd1qqqqqqqqqqqqqpgqmuzgkurn657afd3r2aldqy2snsknwvrhc77q3lj8l6',
  testnet: ''
};

export const apiConfiguration: { [key in EnvironmentsEnum]: string } = {
  devnet: 'https://devnet-api.multiversx.com',
  devnet2: 'https://devnet2-api.multiversx.com',
  mainnet: 'https://api.multiversx.com',
  testnet: 'https://testnet-api.multiversx.com'
};

export const networkConfiguration: { [key in EnvironmentsEnum]: Config } = {
  devnet: devnetNetworkConfig,
  devnet2: devnet2NetworkConfig,
  mainnet: mainnetNetworkConfig,
  testnet: testnetNetworkConfig
};

export const imageService: { [key in EnvironmentsEnum]: string } = {
  devnet: 'https://api.itheumcloud-stg.com/datadexapi',
  devnet2: 'https://api.itheumcloud-stg.com/datadexapi',
  mainnet: 'https://api.itheumcloud.com/datadexapi',
  testnet: ''
};
