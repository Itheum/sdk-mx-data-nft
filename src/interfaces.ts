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
}

export interface Bond {
  bondId: number;
  address: string;
  tokenIdentifier: string;
  nonce: number;
  lockPeriod: number; // days
  bond_timestamp: number;
  unbound_timestamp: number;
  bond_amount: BigNumber.Value;
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

export interface Compensation {
  tokenIdentifier: string;
  nonce: number;
  totalCompensationAmount: string;
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
