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
  networkProvider: 'https://devnet-api.multiversx.com'
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
  devnet: 'ITHEUM-fce905',
  mainnet: 'ITHEUM-df6f26',
  testnet: ''
};

export const dataNftTokenIdentifier: { [key in EnvironmentsEnum]: string } = {
  devnet: 'DATANFTFT-e0b917',
  mainnet: 'DATANFTFT-e936d4',
  testnet: ''
}; //[future] list of whitelisted tokens as Data NFTs

export const marketPlaceContractAddress: { [key in EnvironmentsEnum]: string } =
  {
    devnet: 'erd1qqqqqqqqqqqqqpgqlhewm06p4c9qhq32p239hs45dvry948tfsxshx3e0l',
    mainnet: 'erd1qqqqqqqqqqqqqpgqay2r64l9nhhvmaqw4qanywfd0954w2m3c77qm7drxc',
    testnet: ''
  };

export const minterContractAddress: { [key in EnvironmentsEnum]: string } = {
  devnet: 'erd1qqqqqqqqqqqqqpgq7thwlde9hvc5ty7lx2j3l9tvy3wgkwu7fsxsvz9rat',
  mainnet: 'erd1qqqqqqqqqqqqqpgqmuzgkurn657afd3r2aldqy2snsknwvrhc77q3lj8l6',
  testnet: ''
};

export const bondContractAddress: { [key in EnvironmentsEnum]: string } = {
  devnet: 'erd1qqqqqqqqqqqqqpgqhlyaj872kyh620zsfew64l2k4djerw2tfsxsmrxlan',
  mainnet: 'erd1qqqqqqqqqqqqqpgq9yfa4vcmtmn55z0e5n84zphf2uuuxxw9c77qgqqwkn',
  testnet: ''
};

export const livelinessStakeContractAddress: {
  [key in EnvironmentsEnum]: string;
} = {
  devnet: 'erd1qqqqqqqqqqqqqpgq9j3dj650amzz8lyvek6uq0w0yvgtgggjfsxsf489hq',
  mainnet: 'erd1qqqqqqqqqqqqqpgq65rn8zmf2tckftpu5lvxg2pzlg0dhfrwc77qcuynw7',
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

export const imageService: { [key in EnvironmentsEnum]: string } = {
  devnet: 'https://api.itheumcloud-stg.com/datadexapi',
  mainnet: 'https://api.itheumcloud.com/datadexapi',
  testnet: ''
};

export const marshalUrls = {
  devnet: 'https://api.itheumcloud-stg.com/datamarshalapi/router/v1',
  mainnet: 'https://api.itheumcloud.com/datamarshalapi/router/v1',
  testnet: ''
};

export const dataMarshalUrlOverride: {
  [key in EnvironmentsEnum]: {
    tokenIdentifier: string;
    nonce: number;
    url: string;
    chainId: string;
  }[];
} = {
  devnet: [],
  mainnet: [
    {
      tokenIdentifier: dataNftTokenIdentifier[EnvironmentsEnum.mainnet],
      nonce: 5,
      url: marshalUrls.mainnet,
      chainId: '1'
    }
  ],
  testnet: []
};

export const MAX_ITEMS = 50;
