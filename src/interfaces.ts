// export interface DataNft {
//     nftImgUrl?: string;
//     dataPreview: string;
//     dataStream: string;
//     dataMarshal: string;
//     tokenName: string;
//     creator: string;
//     creationTime: Date;
//     supply: number;
//     balance: number;
//     description: string;
//     title: string;
//     royalties: number;
//     nonce: number;
//     collection: string;
// }

export interface MarketplaceRequirements {
  acceptedTokens: string[];
  acceptedPayments: string[];
  maximumPaymentFees: number[];
  buyerTaxPercentageDiscount: number;
  sellerTaxPercentageDiscount: number;
  buyerTaxPercentage: number;
  sellerTaxPercentage: number;
}

export interface MinterRequirements {
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

export interface Offer {
  index: number;
  owner: string;
  offeredTokenIdentifier: string;
  offeredTokenNonce: number;
  offeredTokenAmount: number;
  wantedTokenIdentifier: string;
  wantedTokenNonce: number;
  wantedTokenAmount: number;
  quantity: number;
}
