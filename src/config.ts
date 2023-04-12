export enum Environment {
    DEVNET,
    MAINNET
}

interface Config {
    chainID: string;
    networkProvider: string;
}

const devnetNetworkConfig: Config = {
    chainID: 'D',
    networkProvider: 'https://devnet-gateway.multiversx.com',
};

const mainnetNetworkConfig: Config = {
    chainID: '1',
    networkProvider: 'https://gateway.multiversx.com',
};


export const marketPlaceContractAddress: { [key in Environment]: string } = {
    [Environment.DEVNET]: 'erd1qqqqqqqqqqqqqpgqw29wx58pzm7zau2zcprfk93a60hw8vnvfsxs25rqjm',
    [Environment.MAINNET]: '',
};


export const minterContractAddress: { [key in Environment]: string } = {
    [Environment.DEVNET]: 'erd1qqqqqqqqqqqqqpgqthgd3esmd5eufhh9xcjjlf6aqxts4p5dfsxsrr0u3y',
    [Environment.MAINNET]: '',
}

export const getNetworkConfig = (env: Environment): Config => {
    switch (env) {
        case Environment.DEVNET:
            return devnetNetworkConfig;
        case Environment.MAINNET:
            return mainnetNetworkConfig;
        default:
            throw new Error(`Invalid environment: ${env}`);
    }
};