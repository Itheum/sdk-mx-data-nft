import BigNumber from 'bignumber.js';
import { DataNft } from './datanft';
import { NftEnumType, NftType, Offer } from './interfaces';

export function numberToPaddedHex(value: BigNumber.Value) {
  let hex = new BigNumber(value).toString(16);
  return zeroPadStringIfOddLength(hex);
}

export function createNftIdentifier(collection: string, nonce: number) {
  return `${collection}-${numberToPaddedHex(nonce)}`;
}

export function isPaddedHex(input: string) {
  input = input || '';
  let decodedThenEncoded = Buffer.from(input, 'hex').toString('hex');
  return input.toUpperCase() == decodedThenEncoded.toUpperCase();
}

export function zeroPadStringIfOddLength(input: string): string {
  input = input || '';

  if (input.length % 2 == 1) {
    return '0' + input;
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
    quantity: value.quantity.toNumber()
  };
}

export function parseDataNft(value: NftType): DataNft {
  return new DataNft({
    tokenIdentifier: value.identifier,
    nftImgUrl: value.url ?? '',
    tokenName: value.name,
    supply: value.supply
      ? Number(value.supply)
      : value.type === NftEnumType.NonFungibleESDT
      ? 1
      : 0,
    royalties: value.royalties !== null ? value.royalties / 100 : 0,
    nonce: value.nonce,
    collection: value.collection,
    balance: value.balance ? Number(value.balance) : 0,
    ...DataNft.decodeAttributes(value.attributes)
  });
}

export async function checkTraitsUrl(traitsUrl: string) {
  const traitsResponse = await fetch(traitsUrl);
  const traits = await traitsResponse.json();

  if (!traits.description) {
    throw new Error('Traits description is empty');
  }

  if (!Array.isArray(traits.attributes)) {
    throw new Error('Traits attributes must be an array');
  }

  const requiredTraits = ['Creator', 'Data Preview URL'];
  const traitsAttributes = traits.attributes;

  for (const requiredTrait of requiredTraits) {
    if (
      !traitsAttributes.some(
        (attribute: any) => attribute.trait_type === requiredTrait
      )
    ) {
      throw new Error(`Missing required trait: ${requiredTrait}`);
    }
  }

  for (const attribute of traitsAttributes) {
    if (!attribute.value) {
      throw new Error(`Empty value for trait: ${attribute.trait_type}`);
    }
  }
}
