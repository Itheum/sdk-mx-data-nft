import {
  AbiRegistry,
  BinaryCodec,
  SignableMessage
} from '@multiversx/sdk-core/out';
import {
  Config,
  Environment,
  apiConfiguration,
  dataNftTokenIdentifier,
  networkConfiguration
} from './config';
import { numberToPaddedHex } from './utils';
import minterAbi from './abis/datanftmint.abi.json';
import { NftType } from './interfaces';

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
   * @param env 'DEVNET' | 'MAINNET'
   */
  static setNetworkConfig(env: string) {
    this.env = env;
    this.networkConfiguration = networkConfiguration[env as Environment];
    this.apiConfiguration = apiConfiguration[env as Environment];
  }

  /**
   * Creates a DataNft calling the API and also decoding the attributes.
   *
   * Not useful for creating an array of DataNft, because it calls the API every single time.
   * @param nonce Token nonce
   * @param tokenIdentifier the Data NFT-FT token identifier (default = `DATA-NFT-FT` token identifier based on the {@link Environment})
   */
  static async createFromApi(
    nonce: number,
    tokenIdentifier = dataNftTokenIdentifier[this.env as Environment]
  ): Promise<DataNft> {
    const identifier = `${tokenIdentifier}-${numberToPaddedHex(nonce)}`;
    const nftQuery = await fetch(`${this.apiConfiguration}/nfts/${identifier}`);
    const dataNftOnNetwork = await nftQuery.json();

    try {
      const dataNft = new DataNft({
        tokenIdentifier: dataNftOnNetwork['identifier'],
        nftImgUrl: dataNftOnNetwork['url'] ? dataNftOnNetwork['url'] : '',
        tokenName: dataNftOnNetwork['name'],
        supply: dataNftOnNetwork['supply'] as number,
        royalties: (dataNftOnNetwork['royalties'] / 100) as number,
        nonce: dataNftOnNetwork['nonce'] as number,
        collection: dataNftOnNetwork['collection'] as string,
        ...DataNft.decodeAttributes(dataNftOnNetwork['attributes'])
      });

      return dataNft;
    } catch {
      throw new Error('Could not create DataNft from Api');
    }
  }

  /**
   * Creates a DataNft from a API response containing
   *
   * Useful for creating an array of DataNft.
   * @param payload NFT details API response
   */
  static createFromApiResponse(payload: NftType): DataNft {
    const dataNft = new DataNft({
      tokenIdentifier: payload['identifier'],
      nftImgUrl: payload['url'] ? payload['url'] : '',
      tokenName: payload['name'],
      supply: Number(payload['supply']),
      royalties: (payload['royalties'] / 100) as number,
      nonce: payload['nonce'] as number,
      collection: payload['collection'] as string,
      ...DataNft.decodeAttributes(payload['attributes'])
    });

    return dataNft;
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
   * @param identifier the Data NFT-FT token identifier (default = `DATA-NFT-FT` token identifier based on the {@link Environment})
   */
  static async ownedByAddress(
    address: string,
    identifier = dataNftTokenIdentifier[this.env as Environment]
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
  ): Promise<any> {
    const signResult = {
      signature: '',
      addrInHex: '',
      success: false,
      exception: ''
    };
    try {
      if (signableMessage?.signature && signableMessage?.address) {
        signResult.signature = signableMessage.signature.toString('hex');
        signResult.addrInHex = signableMessage.address.hex();
        signResult.success = true;
      } else {
        signResult.exception = 'Some Error';
      }
    } catch (e: any) {
      signResult.success = false;
      signResult.exception = e.toString();
    }

    const response = await fetch(
      `${this.dataMarshal}/access?nonce=${signedMessage}&NFTId=${
        this.collection
      }-${numberToPaddedHex(this.nonce)}&signature=${
        signResult.signature
      }&chainId=${
        DataNft.networkConfiguration.chainID == 'D'
          ? 'ED'
          : DataNft.networkConfiguration.chainID
      }&accessRequesterAddr=${signResult.addrInHex}&${
        stream ? 'streamInLine=1' : ''
      }`
    );

    const data = await response.json();

    return data;
  }
}
