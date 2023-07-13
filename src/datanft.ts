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
import { createNftIdentifier, numberToPaddedHex, parseDataNft } from './utils';
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
   * @param env 'devent' | 'mainnet' | 'testnet'
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
      `${this.apiConfiguration}/nfts?identifiers=${identifiers.join(',')}`
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
   * Creates a DataNft from a API response containing the NFT details.
   *
   * Useful for creating an array of DataNft.
   * @param payload NFT details API response
   */
  static createFromApiResponse(payload: NftType): DataNft {
    const dataNft = parseDataNft(payload);

    return dataNft;
  }

  /**
   * Creates an array of DataNft from an array of NFT details API response.
   *
   * @param payload NFT details API response
   */
  static createFromApiResponseBulk(payload: NftType[]): DataNft[] {
    const dataNfts: DataNft[] = [];
    payload.forEach((nft: NftType) => {
      dataNfts.push(this.createFromApiResponse(nft));
    });

    return dataNfts;
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
    const dataNfts: DataNft[] = [];
    data.forEach((nft: NftType) => {
      dataNfts.push(this.createFromApiResponse(nft));
    });
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
   * @param stream If the data should be streamed or not
   */
  async viewData(
    signedMessage: string,
    signableMessage: SignableMessage,
    stream?: boolean
  ): Promise<ViewDataReturnType> {
    const signResult = {
      signature: '',
      addrInHex: '',
      success: false,
      exception: ''
    };
    try {
      if (signableMessage?.signature && signableMessage?.address) {
        if (signableMessage.signature instanceof Buffer) {
          signResult.signature = signableMessage.signature.toString('hex');
        } else if (
          typeof (signableMessage.signature as any).hex === 'function'
        ) {
          signResult.signature = (signableMessage.signature as any).hex();
        }

        signResult.addrInHex = signableMessage.address.hex();
        signResult.success = true;
      } else {
        signResult.exception = 'Some Error';
      }
    } catch (e: any) {
      signResult.success = false;
      signResult.exception = e.toString();
    }

    try {
      const url = `${this.dataMarshal}/access?nonce=${signedMessage}&NFTId=${
        this.collection
      }-${numberToPaddedHex(this.nonce)}&signature=${
        signResult.signature
      }&chainId=${
        DataNft.networkConfiguration.chainID == 'D'
          ? 'ED'
          : DataNft.networkConfiguration.chainID
      }&accessRequesterAddr=${signResult.addrInHex}&${
        stream ? 'streamInLine=1' : ''
      }`;
      const response = await fetch(url);
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
