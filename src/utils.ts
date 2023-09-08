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

export function validateSpecificParams(params: {
  signedMessage?: string | undefined;
  signableMessage?: any;
  stream?: boolean | undefined;
  fwdAllHeaders?: boolean | undefined;
  fwdHeaderKeys?: string | undefined;
  mvxNativeAuthEnable?: number | undefined;
  mvxNativeAuthAccessToken?: string | undefined;
  mvxNativeAuthMaxExpirySeconds?: number | undefined;
  mvxNativeAuthOrigins?: string[] | undefined;
  fwdHeaderMapLookup?: any;
  _fwdHeaderMapLookupMustContainBearerAuthHeader?: boolean | undefined;
  _mandatoryParamsList: string[]; // a pure JS fallback way to validate mandatory params, as typescript rules for mandatory can be bypassed by client app
}): {
  allPassed: boolean;
  validationMessages: string;
} {
  let allPassed = true;
  let validationMessages = '';

  try {
    // signedMessage test
    let signedMessageValid = true;

    if (
      params.signedMessage !== undefined ||
      params._mandatoryParamsList.includes('signedMessage')
    ) {
      signedMessageValid = false; // it exists or needs to exist, so we need to validate

      if (
        params.signedMessage !== undefined &&
        typeof params.signedMessage === 'string' &&
        params.signedMessage.trim() !== '' &&
        params.signedMessage.trim().length > 5
      ) {
        signedMessageValid = true;
      } else {
        validationMessages +=
          '[signedMessage needs to be a valid signature type string]';
      }
    }

    // signableMessage test
    let signableMessageValid = true;

    if (
      params.signableMessage !== undefined ||
      params._mandatoryParamsList.includes('signableMessage')
    ) {
      signableMessageValid = false;

      if (params.signableMessage !== undefined) {
        signableMessageValid = true;
      } else {
        validationMessages += '[signableMessage needs to be a valid type]';
      }
    }

    // stream test
    let streamValid = true;

    if (
      params.stream !== undefined ||
      params._mandatoryParamsList.includes('stream')
    ) {
      streamValid = false;

      if (
        params.stream !== undefined &&
        (params.stream === true || params.stream === false)
      ) {
        streamValid = true;
      } else {
        validationMessages += '[stream needs to be true or false]';
      }
    }

    // fwdAllHeaders test
    let fwdAllHeadersValid = true;

    if (
      params.fwdAllHeaders !== undefined ||
      params._mandatoryParamsList.includes('fwdAllHeaders')
    ) {
      fwdAllHeadersValid = false;

      if (
        params.fwdAllHeaders !== undefined &&
        (params.fwdAllHeaders === true || params.fwdAllHeaders === false)
      ) {
        fwdAllHeadersValid = true;
      } else {
        validationMessages += '[fwdAllHeaders needs to be true or false]';
      }
    }

    // fwdHeaderKeys test
    let fwdHeaderKeysIsValid = true;

    if (
      params.fwdHeaderKeys !== undefined ||
      params._mandatoryParamsList.includes('fwdHeaderKeys')
    ) {
      fwdHeaderKeysIsValid = false;

      if (
        params.fwdHeaderKeys !== undefined &&
        typeof params.fwdHeaderKeys === 'string' &&
        params.fwdHeaderKeys.trim() !== '' &&
        params.fwdHeaderKeys.split(',').length > 0 &&
        params.fwdHeaderKeys.split(',').length < 5
      ) {
        fwdHeaderKeysIsValid = true;
      } else {
        validationMessages +=
          '[fwdHeaderKeys needs to be a comma separated lowercase string with less than 5 items]';
      }
    }

    // fwdHeaderMapLookup test
    let fwdHeaderMapLookupIsValid = true;

    if (
      params.fwdHeaderMapLookup !== undefined ||
      params._mandatoryParamsList.includes('fwdHeaderMapLookup')
    ) {
      fwdHeaderMapLookupIsValid = false;

      if (
        params.fwdHeaderMapLookup !== undefined &&
        Object.prototype.toString
          .call(params.fwdHeaderMapLookup)
          .includes('Object') &&
        Object.keys(params.fwdHeaderMapLookup).length > 0 &&
        Object.keys(params.fwdHeaderMapLookup).length < 5
      ) {
        if (!params._fwdHeaderMapLookupMustContainBearerAuthHeader) {
          fwdHeaderMapLookupIsValid = true;
        } else {
          const bearerKeyValEntryFound = Object.keys(
            params.fwdHeaderMapLookup
          ).find(
            (key) =>
              key === 'authorization' &&
              params.fwdHeaderMapLookup[key].includes('Bearer ')
          );

          if (bearerKeyValEntryFound) {
            fwdHeaderMapLookupIsValid = true;
          } else {
            validationMessages +=
              '[fwdHeaderMapLookup in a native auth use case you must to have an case-sensitive entry for `authorization: Bearer XXX` - Where XXX is your native auth token]';
          }
        }
      } else {
        validationMessages +=
          '[fwdHeaderMapLookup needs to be a object map with maximum 5 items]';
      }
    }

    // mvxNativeAuthMaxExpirySeconds test
    let mvxNativeAuthMaxExpirySecondsValid = true;

    if (
      params.mvxNativeAuthMaxExpirySeconds !== undefined ||
      params._mandatoryParamsList.includes('mvxNativeAuthMaxExpirySeconds')
    ) {
      mvxNativeAuthMaxExpirySecondsValid = false;

      const maxExpirySeconds =
        params.mvxNativeAuthMaxExpirySeconds !== undefined
          ? parseInt(params.mvxNativeAuthMaxExpirySeconds.toString(), 10)
          : null;

      if (
        maxExpirySeconds !== null &&
        !isNaN(maxExpirySeconds) &&
        maxExpirySeconds >= 300 &&
        maxExpirySeconds <= 259200
      ) {
        mvxNativeAuthMaxExpirySecondsValid = true;
      } else {
        validationMessages +=
          '[mvxNativeAuthMaxExpirySeconds needs to between min 5 mins (300) and max 3 days (259200)]';
      }
    }

    // mvxNativeAuthOrigins test
    let mvxNativeAuthOriginsIsValid = true;

    if (
      params.mvxNativeAuthOrigins !== undefined ||
      params._mandatoryParamsList.includes('mvxNativeAuthOrigins')
    ) {
      mvxNativeAuthOriginsIsValid = false;

      if (
        params.mvxNativeAuthOrigins !== undefined &&
        Array.isArray(params.mvxNativeAuthOrigins) &&
        params.mvxNativeAuthOrigins.length > 0 &&
        params.mvxNativeAuthOrigins.length < 5
      ) {
        mvxNativeAuthOriginsIsValid = true;
      } else {
        validationMessages +=
          '[mvxNativeAuthOrigins needs to be a string array of domains with less than 5 items]';
      }
    }

    if (
      !signedMessageValid ||
      !signableMessageValid ||
      !streamValid ||
      !fwdAllHeadersValid ||
      !fwdHeaderKeysIsValid ||
      !fwdHeaderMapLookupIsValid ||
      !mvxNativeAuthMaxExpirySecondsValid ||
      !mvxNativeAuthOriginsIsValid
    ) {
      allPassed = false;
    }
  } catch (e: any) {
    allPassed = false;
    validationMessages = e.toString();
  }

  return {
    allPassed,
    validationMessages
  };
}

export async function checkUrlIsUp(url: string) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`URL is not up: ${url}`);
  }
}
