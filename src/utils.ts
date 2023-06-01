import BigNumber from "bignumber.js";
import { DataNft } from "./datanft";
import { NftType, Offer } from "./interfaces";

export function numberToPaddedHex(value: BigNumber.Value) {
  let hex = new BigNumber(value).toString(16);
  return zeroPadStringIfOddLength(hex);
}

export function createNftIdentifier(collection: string, nonce: number) {
  return `${collection}-${numberToPaddedHex(nonce)}`;
}

export function isPaddedHex(input: string) {
  input = input || "";
  let decodedThenEncoded = Buffer.from(input, "hex").toString("hex");
  return input.toUpperCase() == decodedThenEncoded.toUpperCase();
}

export function zeroPadStringIfOddLength(input: string): string {
  input = input || "";
  
  if (input.length % 2 == 1) {
    return "0" + input;
  }
  
  return input;
}

export function parseOffer(value: any): Offer {
  return {
    index: value.offer_id.toNumber(),
    owner: value.owner.toString(),
    offeredTokenIdentifier: value.offered_token_identifier.toString(),
    offeredTokenNonce: value.offered_token_nonce.toString(),
    offeredTokenAmount: value.offered_token_amount.toFixed(0),
    wantedTokenIdentifier: value.wanted_token_identifier.toString(),
    wantedTokenNonce: value.wanted_token_nonce.toString(),
    wantedTokenAmount: value.wanted_token_amount.toFixed(0),
    quantity: value.quantity.toNumber(),
  };
}

export function parseDataNft(value: NftType): DataNft {
  return new DataNft({
    tokenIdentifier: value.identifier,
    nftImgUrl: value.url ?? '',
    tokenName: value.name,
    supply: Number(value.supply),
    royalties: value.royalties / 100,
    nonce: value.nonce,
    collection: value.collection,
    ...DataNft.decodeAttributes(value.attributes),
  });
}
