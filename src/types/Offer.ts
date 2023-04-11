export interface Offer {
  index: number;
  owner: string;
  offeredTokenIdentifier: string;
  offeredTokenNonce: number;
  offeredTokenAmount: string;
  wantedTokenIdentifier: string;
  wantedTokenNonce: number;
  wantedTokenAmount: string;
  quantity: number;
}
