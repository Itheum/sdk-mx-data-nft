import BigNumber from 'bignumber.js';

export interface NftType {
  identifier: string;
  collection: string;
  ticker?: string;
  timestamp: number;
  attributes: string;
  nonce: number;
  type: NftEnumType;
  name: string;
  creator: string;
  royalties: number;
  balance: string;
  uris?: string[];
  url?: string;
  thumbnailUrl?: string;
  tags?: string[];
  decimals?: number;
  owner?: string;
  supply?: string;
  isWhitelistedStorage?: boolean;
  owners?: {
    address: string;
    balance: string;
  }[];
  assets?: {
    website?: string;
    description?: string;
    status?: string;
    pngUrl?: string;
    svgUrl?: string;
  };
  metadata?: {
    description?: string;
    fileType?: string;
    fileUri?: string;
    fileName?: string;
    itheum_data_preview_url?: string;
    itheum_data_stream_url?: string;
    itheum_data_marshal_url?: string;
    itheum_creator?: string;
  };
  media?: {
    url: string;
    originalUrl: string;
    thumbnailUrl: string;
    fileType: string;
    fileSize: number;
  }[];
}

export interface DataNftType {
  readonly tokenIdentifier: string;
  readonly nftImgUrl: string;
  readonly type: NftEnumType;
  readonly dataPreview: string;
  readonly dataStream: string;
  readonly dataMarshal: string;
  readonly tokenName: string;
  readonly creator: string;
  readonly creationTime: Date;
  readonly supply: number | BigNumber.Value;
  readonly description: string;
  readonly title: string;
  readonly royalties: number;
  readonly nonce: number;
  readonly collection: string;
  readonly balance: number | BigNumber.Value;
  readonly owner: string;
  readonly overrideDataMarshal: string;
  readonly overrideDataMarshalChainId: string;
  readonly isDataNFTPH: boolean;
  readonly extraAssets: string[];
  readonly media: {
    url: string;
    originalUrl: string;
    thumbnailUrl: string;
    fileType: string;
    fileSize: number;
  }[];
}

export enum NftEnumType {
  NonFungibleESDT = 'NonFungibleESDT',
  SemiFungibleESDT = 'SemiFungibleESDT',
  MetaESDT = 'MetaESDT'
}
export interface MarketplaceRequirements {
  acceptedTokens: string[];
  acceptedPayments: string[];
  maximumPaymentFees: string[];
  buyerTaxPercentageDiscount: number;
  sellerTaxPercentageDiscount: number;
  buyerTaxPercentage: number;
  sellerTaxPercentage: number;
  maxDefaultQuantity: number;
}

export interface SftMinterRequirements {
  antiSpamTaxValue: number;
  addressFrozen: boolean;
  frozenNonces: number[];
  contractPaused: boolean;
  userWhitelistedForMint: boolean;
  lastUserMintTime: number;
  maxRoyalties: number;
  maxSupply: number;
  minRoyalties: number;
  mintTimeLimit: number;
  numberOfMintsForUser: number;
  totalNumberOfMints: number;
  contractWhitelistEnabled: boolean;
  maxDonationPecentage: number;
}

export interface NftMinterRequirements {
  antiSpamTaxValue: number;
  addressFrozen: boolean;
  frozenNonces: number[];
  contractPaused: boolean;
  userWhitelistedForMint: boolean;
  lastUserMintTime: number;
  maxRoyalties: number;
  minRoyalties: number;
  mintTimeLimit: number;
  numberOfMintsForUser: number;
  totalNumberOfMints: number;
  contractWhitelistEnabled: boolean;
}

export interface Offer {
  index: number;
  owner: string;
  offeredTokenIdentifier: string;
  offeredTokenNonce: number;
  offeredTokenAmount: BigNumber.Value;
  wantedTokenIdentifier: string;
  wantedTokenNonce: number;
  wantedTokenAmount: BigNumber.Value;
  quantity: number;
  maxQuantityPerAddress: number;
}

export interface Bond {
  bondId: number;
  address: string;
  tokenIdentifier: string;
  nonce: number;
  lockPeriod: number; // seconds
  bondTimestamp: number;
  unbondTimestamp: number;
  bondAmount: BigNumber.Value;
  remainingAmount: BigNumber.Value;
}

export interface BondConfiguration {
  contractState: State;
  bondPaymentTokenIdentifier: string;
  lockPeriodsWithBonds: { lockPeriod: number; amount: BigNumber.Value }[];
  minimumPenalty: number;
  maximumPenalty: number;
  withdrawPenalty: number;
  acceptedCallers: string[];
}

export interface Refund {
  compensationId: number;
  address: string;
  proofOfRefund: {
    tokenIdentifier: string;
    nonce: number;
    amount: BigNumber.Value;
  };
}

export interface Compensation {
  compensationId: number;
  tokenIdentifier: string;
  nonce: number;
  accumulatedAmount: BigNumber.Value;
  proofAmount: BigNumber.Value;
  endDate: number;
}

export enum State {
  Inactive = 0,
  Active = 1
}

export enum PenaltyType {
  Minimum = 0,
  Custom = 1,
  Maximum = 2
}

export interface ViewDataReturnType {
  data: any;
  contentType: string;
  error?: string;
}

export interface ContractConfiguration {
  tokenIdentifier: string;
  mintedTokens: number;
  isTaxRequired: boolean;
  isContractPaused: boolean;
  maxRoyalties: number;
  minRoyalties: number;
  mintTimeLimit: number;
  isWhitelistEnabled: boolean;
  rolesAreSet: boolean;
  claimsAddress: string;
  administratorAddress: string;
  taxToken: string;
}
