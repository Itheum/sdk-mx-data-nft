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
