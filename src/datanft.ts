import {
  AbiRegistry,
  BinaryCodec,
  SignableMessage
} from '@multiversx/sdk-core/out';
import {
  Config,
  EnvironmentsEnum,
  apiConfiguration,
  dataNftTokenIdentifier,
  networkConfiguration
} from './config';
import {
  createNftIdentifier,
  numberToPaddedHex,
  parseDataNft,
  validateSpecificParams
} from './utils';
import minterAbi from './abis/datanftmint.abi.json';
import { NftType, ViewDataReturnType } from './interfaces';

export class DataNft {
  readonly tokenIdentifier: string = '';
  readonly nftImgUrl: string = '';
  readonly dataPreview: string = '';
  readonly dataStream: string = '';
  readonly dataMarshal: string = '';
  readonly tokenName: string = '';
  readonly creator: string = '';
  readonly creationTime: Date = new Date();
  readonly supply: number = 0;
  readonly description: string = '';
  readonly title: string = '';
  readonly royalties: number = 0;
  readonly nonce: number = 0;
  readonly collection: string = '';
  readonly balance: number = 0;

  static networkConfiguration: Config;
  static apiConfiguration: string;
  static env: string;

  /**
   * Creates an instance of DataNft. Can be partially initialized.
   * @param init Partial<DataNft>
   */
  constructor(init?: Partial<DataNft>) {
    Object.assign(this, init);
  }

  /**
   * Sets the network configuration for the DataNft class.
   * @param env 'devnet' | 'mainnet' | 'testnet'
   */
  static setNetworkConfig(env: string) {
    this.env = env;
    this.networkConfiguration = networkConfiguration[env as EnvironmentsEnum];
    this.apiConfiguration = apiConfiguration[env as EnvironmentsEnum];
  }

  /**
   * Creates a DataNft calling the API and also decoding the attributes.
   *
   * Not useful for creating an array of DataNft, because it calls the API every single time.
   * @param nonce Token nonce
   * @param tokenIdentifier the Data NFT-FT token identifier (default = `DATA-NFT-FT` token identifier based on the {@link EnvironmentsEnum})
   */
  static async createFromApi(
    nonce: number,
    tokenIdentifier = dataNftTokenIdentifier[this.env as EnvironmentsEnum]
  ): Promise<DataNft> {
    const identifier = createNftIdentifier(tokenIdentifier, nonce);
    const response = await fetch(`${this.apiConfiguration}/nfts/${identifier}`);
    const data: NftType = await response.json();

    try {
      const dataNft = parseDataNft(data);

      return dataNft;
    } catch {
      throw new Error('Could not create DataNft from Api');
    }
  }

  /**
   * Creates DataNfts calling the API and also decoding the attributes.
   *
   * @param nonces an array of Token nonces
   * @param tokenIdentifier the Data NFT-FT token identifier (default = `DATA-NFT-FT` token identifier based on the {@link EnvironmentsEnum})
   */
  static async createManyFromApi(
    nonces: number[],
    tokenIdentifier = dataNftTokenIdentifier[this.env as EnvironmentsEnum]
  ): Promise<DataNft[]> {
    const identifiers = nonces.map((nonce) =>
      createNftIdentifier(tokenIdentifier, nonce)
    );
    const response = await fetch(
      `${this.apiConfiguration}/nfts?identifiers=${identifiers.join(
        ','
      )}&withSupply=true`
    );
    const data: NftType[] = await response.json();

    try {
      const dataNfts = data.map((value) => parseDataNft(value));

      return dataNfts;
    } catch {
      throw new Error('Could not create DataNft from Api');
    }
  }

  /**
   * Creates a DataNft or an array of DataNft from either a single NFT details API response or an array of NFT details API response.
   *
   * @param payload NFT details API response, can be a single item or an array of items
   */
  static createFromApiResponseOrBulk(payload: NftType | NftType[]): DataNft[] {
    const dataNfts: DataNft[] = [];

    const parseNft = (nft: NftType) => {
      const dataNft = parseDataNft(nft);
      dataNfts.push(dataNft);
    };

    if (Array.isArray(payload)) {
      payload.forEach(parseNft);
      return dataNfts;
    } else {
      parseNft(payload as NftType);
      return dataNfts;
    }
  }

  /**
   * Static method to decode the attributes of a DataNft
   * @param attributes Attributes of the DataNft
   */
  static decodeAttributes(attributes: any): Partial<DataNft> {
    const codec = new BinaryCodec();
    const abiRegistry = AbiRegistry.create(minterAbi);
    const dataNftAttributes = abiRegistry.getStruct('DataNftAttributes');

    try {
      const decodedAttributes = codec
        .decodeTopLevel(Buffer.from(attributes, 'base64'), dataNftAttributes)
        .valueOf();

      return {
        dataPreview: decodedAttributes['data_preview_url'].toString(),
        dataStream: decodedAttributes['data_stream_url'].toString(),
        dataMarshal: decodedAttributes['data_marshal_url'].toString(),
        creator: decodedAttributes['creator'].toString(),
        creationTime: new Date(
          Number(decodedAttributes['creation_time']) * 1000
        ),
        description: decodedAttributes['description'].toString(),
        title: decodedAttributes['title'].toString()
      };
    } catch {
      throw new Error('Could not decode attributes');
    }
  }

  /**
   *  Returns an array of `DataNft` owned by the address
   * @param address the address to query
   * @param identifier the Data NFT-FT token identifier (default = `DATA-NFT-FT` token identifier based on the {@link EnvironmentsEnum})
   */
  static async ownedByAddress(
    address: string,
    identifier = dataNftTokenIdentifier[this.env as EnvironmentsEnum]
  ): Promise<DataNft[]> {
    const res = await fetch(
      `${this.apiConfiguration}/accounts/${address}/nfts?size=10000&collections=${identifier}&withSupply=true`
    );
    const data = await res.json();
    const dataNfts: DataNft[] = this.createFromApiResponseOrBulk(data);

    return dataNfts;
  }

  /**
   * Gets the message to sign from the data marshal of the DataNft
   */
  async getMessageToSign(): Promise<string> {
    if (!this.dataMarshal) {
      throw new Error('Data marshal not set');
    }
    const res = await fetch(
      `${this.dataMarshal}/preaccess?chainId=${
        DataNft.networkConfiguration.chainID == 'D'
          ? 'ED'
          : DataNft.networkConfiguration.chainID
      }`
    );
    const data = await res.json();

    if (data && data.nonce) {
      return data.nonce;
    }
    throw new Error('Could not get nonce from data marshal');
  }

  /**
   * Method to get the data from the data marshal.
   * @param signedMessage Signed message from the data marshal
   * @param signableMessage Signable message from the wallet
   * @param stream [optional] Instead of auto-downloading if possible, request if data should always be streamed or not. i.e. true=stream, false/undefined=default behavior
   * @param fwdAllHeaders [optional] Forward all request headers to the Origin Data Stream server.
   * @param fwdHeaderKeys [optional] Forward only selected headers to the Origin Data Stream server. Has priority over fwdAllHeaders param. A comma separated lowercase string with less than 5 items. e.g. cookie,authorization
   * @param fwdHeaderMapLookup [optional] Used with fwdHeaderKeys to set a front-end client side lookup map of headers the SDK uses to setup the forward. e.g. { cookie : "xyz", authorization : "Bearer zxy" }. Note that these are case-sensitive and need to match fwdHeaderKeys exactly.
   */
  async viewData(p: {
    signedMessage: string;
    signableMessage: SignableMessage;
    stream?: boolean;
    fwdAllHeaders?: boolean;
    fwdHeaderKeys?: string;
    fwdHeaderMapLookup?: {
      [key: string]: any;
    };
  }): Promise<ViewDataReturnType> {
    const signResult = {
      signature: '',
      addrInHex: '',
      success: false,
      exception: ''
    };
    // S: run any format specific validation
    const { allPassed, validationMessages } = validateSpecificParams({
      signedMessage: p.signedMessage,
      signableMessage: p.signableMessage,
      stream: p.stream,
      fwdAllHeaders: p.fwdAllHeaders,
      fwdHeaderKeys: p.fwdHeaderKeys,
      fwdHeaderMapLookup: p.fwdHeaderMapLookup,
      _mandatoryParamsList: ['signedMessage', 'signableMessage']
    });

    if (!allPassed) {
      throw new Error(`params have validation issues = ${validationMessages}`);
    }
    // E: run any format specific validation...

    try {
      if (p.signableMessage?.signature && p.signableMessage?.address) {
        if (p.signableMessage.signature instanceof Buffer) {
          signResult.signature = p.signableMessage.signature.toString('hex');
        } else if (
          typeof (p.signableMessage.signature as any).hex === 'function'
        ) {
          signResult.signature = (p.signableMessage.signature as any).hex();
        }

        signResult.addrInHex = p.signableMessage.address.hex();
        signResult.success = true;
      } else {
        signResult.exception = 'Some Error';
      }
    } catch (e: any) {
      signResult.success = false;
      signResult.exception = e.toString();
    }

    try {
      // let url = `${this.dataMarshal}/access?nonce=${p.signedMessage}&NFTId=${
      let url = `http://localhost:4000/datamarshalapi/achilles/v1/access?nonce=${
        p.signedMessage
      }&NFTId=${this.collection}-${numberToPaddedHex(this.nonce)}&signature=${
        signResult.signature
      }&chainId=${
        DataNft.networkConfiguration.chainID == 'D'
          ? 'ED'
          : DataNft.networkConfiguration.chainID
      }&accessRequesterAddr=${signResult.addrInHex}`;

      type FetchConfig = {
        [key: string]: any;
      };

      const fetchConfig: FetchConfig = {
        method: 'GET'
      };

      // S: append optional params if found
      if (typeof p.stream !== 'undefined') {
        url += p.stream ? '&streamInLine=1' : '';
      }

      if (typeof p.fwdAllHeaders !== 'undefined') {
        url += p.fwdAllHeaders ? '&fwdAllHeaders=1' : '';
      }

      if (typeof p.fwdHeaderKeys !== 'undefined') {
        url += `&fwdHeaderKeys=${p.fwdHeaderKeys}`;

        // if fwdHeaderMapLookup exists, send these headers and values to the data marshal for forwarding
        if (
          typeof p.fwdHeaderMapLookup !== 'undefined' &&
          Object.keys(p.fwdHeaderMapLookup).length > 0
        ) {
          fetchConfig.headers = {};

          Object.keys(p.fwdHeaderMapLookup).forEach((headerKey: string) => {
            fetchConfig.headers[headerKey] = p.fwdHeaderMapLookup?.[headerKey];
          });
        }
      }
      // E: append optional params...

      const response = await fetch(url, fetchConfig);
      const contentType = response.headers.get('content-type');
      const data = await response.blob();

      return {
        data: data,
        contentType: contentType || ''
      };
    } catch (err) {
      return {
        data: undefined,
        contentType: '',
        error: (err as Error).message
      };
    }
  }

  /**
   * Method to get the data from the data marshal by authenticating and authorizing via MultiversX Native Auth. This has a better UX as it does not need a manually signed signableMessage
   * @param mvxNativeAuthOrigins An string array of domains that the access token is validated against. e.g. ["http://localhost:3000", "https://mycoolsite.com"]
   * @param mvxNativeAuthMaxExpirySeconds An number of that represents the "max expiry seconds" of your access token. e.g. if your client side access token is set fr 5 mins then send in 300
   * @param fwdHeaderMapLookup Used with fwdHeaderKeys to set a front-end client side lookup map of headers the SDK uses to setup the forward. e.g. { cookie : "xyz", authorization : "Bearer zxy" }. As it's Native Auth, you must sent in the authorization : "Bearer zxy" entry. Note that these are case-sensitive and need to match fwdHeaderKeys exactly for other entries.
   * @param fwdHeaderKeys [optional] Forward only selected headers to the Origin Data Stream server. Has priority over fwdAllHeaders param. A comma separated lowercase string with less than 5 items. e.g. cookie,authorization
   * @param fwdAllHeaders [optional] Forward all request headers to the Origin Data Stream server.
   * @param stream [optional] Instead of auto-downloading if possible, request if data should always be streamed or not.i.e true=stream, false/undefined=default behavior
   */
  async viewDataViaMVXNativeAuth(p: {
    mvxNativeAuthOrigins: string[];
    mvxNativeAuthMaxExpirySeconds: number;
    fwdHeaderMapLookup: {
      [key: string]: any;
    };
    fwdHeaderKeys?: string;
    fwdAllHeaders?: boolean;
    stream?: boolean;
  }): Promise<ViewDataReturnType> {
    try {
      // S: run any format specific validation
      const { allPassed, validationMessages } = validateSpecificParams({
        mvxNativeAuthOrigins: p.mvxNativeAuthOrigins,
        mvxNativeAuthMaxExpirySeconds: p.mvxNativeAuthMaxExpirySeconds,
        fwdHeaderKeys: p.fwdHeaderKeys,
        fwdHeaderMapLookup: p.fwdHeaderMapLookup,
        fwdAllHeaders: p.fwdAllHeaders,
        stream: p.stream,
        _fwdHeaderMapLookupMustContainBearerAuthHeader: true,
        _mandatoryParamsList: [
          'mvxNativeAuthOrigins',
          'mvxNativeAuthMaxExpirySeconds',
          'fwdHeaderMapLookup'
        ]
      });

      if (!allPassed) {
        throw new Error(
          `params have validation issues = ${validationMessages}`
        );
      }
      // E: run any format specific validation...

      // convert mvxNativeAuthOrigins from a string array to API required base64 format
      let mvxNativeAuthOriginsToBase64 = p.mvxNativeAuthOrigins.join(','); // convert the array to a string
      mvxNativeAuthOriginsToBase64 = mvxNativeAuthOriginsToBase64
        .trim()
        .replaceAll(' ', ''); // remove all spaces
      mvxNativeAuthOriginsToBase64 = window.btoa(mvxNativeAuthOriginsToBase64); // convert to base64

      // construct the api url
      // let url = `${this.dataMarshal}/access?NFTId=${
      let url = `http://localhost:4000/datamarshalapi/achilles/v1/access?NFTId=${
        this.collection
      }-${numberToPaddedHex(this.nonce)}&chainId=${
        DataNft.networkConfiguration.chainID == 'D'
          ? 'ED'
          : DataNft.networkConfiguration.chainID
      }&mvxNativeAuthEnable=1&mvxNativeAuthMaxExpirySeconds=${
        p.mvxNativeAuthMaxExpirySeconds
      }&mvxNativeAuthOrigins=${mvxNativeAuthOriginsToBase64}`;

      type FetchConfig = {
        [key: string]: any;
      };

      const fetchConfig: FetchConfig = {
        method: 'GET'
      };

      // S: append optional params if found
      if (typeof p.stream !== 'undefined') {
        url += p.stream ? '&streamInLine=1' : '';
      }

      if (typeof p.fwdAllHeaders !== 'undefined') {
        url += p.fwdAllHeaders ? '&fwdAllHeaders=1' : '';
      }

      // if fwdHeaderMapLookup exists, send these headers and values to the data marshal for forwarding
      if (
        typeof p.fwdHeaderMapLookup !== 'undefined' &&
        Object.keys(p.fwdHeaderMapLookup).length > 0
      ) {
        // authorization WILL be present based on validation, so let's fwd this as a request header param
        fetchConfig.headers = {};
        fetchConfig.headers['authorization'] =
          p.fwdHeaderMapLookup['authorization'];

        // ... and forward any OTHER params user wanted to forward to the origin server via the marshal
        if (typeof p.fwdHeaderKeys !== 'undefined') {
          url += `&fwdHeaderKeys=${p.fwdHeaderKeys}`;

          Object.keys(p.fwdHeaderMapLookup).forEach((headerKey: string) => {
            // already appended above so skip it...
            if (headerKey !== 'authorization') {
              fetchConfig.headers[headerKey] =
                p.fwdHeaderMapLookup?.[headerKey];
            }
          });
        }
      }
      // E: append optional params...

      const response = await fetch(url, fetchConfig);
      const contentType = response.headers.get('content-type');
      const data = await response.blob();

      return {
        data: data,
        contentType: contentType || ''
      };
    } catch (err) {
      return {
        data: undefined,
        contentType: '',
        error: (err as Error).message
      };
    }
  }
}
