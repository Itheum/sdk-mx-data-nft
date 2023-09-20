import BigNumber from 'bignumber.js';
import { DataNft } from '../datanft';
import { NftEnumType, NftType, Offer } from '../interfaces';
import { ErrFetch, ErrMissingTrait, ErrMissingValueForTrait } from '../errors';

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

  checkStatus(traitsResponse);

  if (!traits.description) {
    throw new ErrMissingTrait(traits.description);
  }

  if (!Array.isArray(traits.attributes)) {
    throw new ErrMissingTrait(traits.attributes);
  }

  const requiredTraits = ['Creator', 'Data Preview URL'];
  const traitsAttributes = traits.attributes;

  for (const requiredTrait of requiredTraits) {
    if (
      !traitsAttributes.some(
        (attribute: any) => attribute.trait_type === requiredTrait
      )
    ) {
      throw new ErrMissingTrait(requiredTrait);
    }
  }

  for (const attribute of traitsAttributes) {
    if (!attribute.value) {
      throw new ErrMissingValueForTrait(attribute.trait_type);
    }
  }
}

export function validateSpecificParamsViewData(params: {
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
  nestedIdxToStream?: number | undefined;
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

    // nestedIdxToStream test
    let nestedIdxToStreamValid = true;

    if (
      params.nestedIdxToStream !== undefined ||
      params._mandatoryParamsList.includes('nestedIdxToStream')
    ) {
      nestedIdxToStreamValid = false;

      const nestedIdxToStreamToInt =
        params.nestedIdxToStream !== undefined
          ? parseInt(params.nestedIdxToStream.toString(), 10)
          : null;

      if (
        nestedIdxToStreamToInt !== null &&
        !isNaN(nestedIdxToStreamToInt) &&
        nestedIdxToStreamToInt >= 0
      ) {
        nestedIdxToStreamValid = true;
      } else {
        validationMessages +=
          '[nestedIdxToStream needs to be a number more than 0]';
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
      !mvxNativeAuthOriginsIsValid ||
      !nestedIdxToStreamValid
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

export function validateSpecificParamsMint(params: {
  senderAddress?: any;
  tokenName?: string | undefined;
  datasetTitle?: string | undefined;
  datasetDescription?: string | undefined;
  royalties?: number | undefined;
  supply?: number | undefined;
  antiSpamTax?: number | undefined;
  _mandatoryParamsList: string[]; // a pure JS fallback way to validate mandatory params, as typescript rules for mandatory can be bypassed by client app
}): {
  allPassed: boolean;
  validationMessages: string;
} {
  let allPassed = true;
  let validationMessages = '';

  try {
    // senderAddress test
    let senderAddressValid = true;

    if (
      params.senderAddress !== undefined ||
      params._mandatoryParamsList.includes('senderAddress')
    ) {
      senderAddressValid = false;

      if (params.senderAddress !== undefined) {
        senderAddressValid = true;
      } else {
        validationMessages += '[senderAddress needs to be a valid type]';
      }
    }

    // tokenName test
    let tokenNameValid = true;

    if (
      params.tokenName !== undefined ||
      params._mandatoryParamsList.includes('tokenName')
    ) {
      tokenNameValid = false; // it exists or needs to exist, so we need to validate

      if (
        params.tokenName !== undefined &&
        typeof params.tokenName === 'string' &&
        params.tokenName.trim() !== '' &&
        params.tokenName.trim().match(/^[a-zA-Z0-9]+$/) &&
        params.tokenName.trim().length >= 3 &&
        params.tokenName.trim().length <= 20
      ) {
        tokenNameValid = true;
      } else {
        validationMessages +=
          '[tokenName needs to be a string between 3 and 20 characters (Only alphanumeric characters allowed, no spaces allowed)]';
      }
    }

    // datasetTitle test
    let datasetTitleValid = true;

    if (
      params.datasetTitle !== undefined ||
      params._mandatoryParamsList.includes('datasetTitle')
    ) {
      datasetTitleValid = false; // it exists or needs to exist, so we need to validate

      if (
        params.datasetTitle !== undefined &&
        typeof params.datasetTitle === 'string' &&
        params.datasetTitle.trim() !== '' &&
        params.datasetTitle.trim().match(/^[a-zA-Z0-9\s]+$/) &&
        params.datasetTitle.trim().length >= 10 &&
        params.datasetTitle.trim().length <= 60
      ) {
        datasetTitleValid = true;
      } else {
        validationMessages +=
          '[datasetTitle needs to be a string between 10 and 60 characters (Only alphanumeric characters)]';
      }
    }

    // datasetDescription test
    let datasetDescriptionValid = true;

    if (
      params.datasetDescription !== undefined ||
      params._mandatoryParamsList.includes('datasetDescription')
    ) {
      datasetDescriptionValid = false; // it exists or needs to exist, so we need to validate

      if (
        params.datasetDescription !== undefined &&
        typeof params.datasetDescription === 'string' &&
        params.datasetDescription.trim() !== '' &&
        params.datasetDescription.trim().match(/^[a-zA-Z0-9\s]+$/) &&
        params.datasetDescription.trim().length >= 10 &&
        params.datasetDescription.trim().length <= 400
      ) {
        datasetDescriptionValid = true;
      } else {
        validationMessages +=
          '[datasetDescription needs to be a string between 10 and 400 characters (Only alphanumeric characters)]';
      }
    }

    // royalties test
    let royaltiesValid = true;

    if (
      params.royalties !== undefined ||
      params._mandatoryParamsList.includes('royalties')
    ) {
      royaltiesValid = false;

      if (
        params.royalties !== undefined &&
        typeof params.royalties === 'number' &&
        !(params.royalties % 1 != 0) && // modulus checking. (10 % 1 != 0) EQ false, (10.5 % 1 != 0) EQ true,
        params.royalties >= 0 &&
        params.royalties <= 5000
      ) {
        royaltiesValid = true;
      } else {
        validationMessages +=
          '[royalties needs to a whole number (not decimal) between 0 and 50]';
      }
    }

    // supply test
    let supplyValid = true;

    if (
      params.supply !== undefined ||
      params._mandatoryParamsList.includes('supply')
    ) {
      supplyValid = false;

      if (
        params.supply !== undefined &&
        typeof params.supply === 'number' &&
        params.supply >= 1 &&
        params.supply <= 1000
      ) {
        supplyValid = true;
      } else {
        validationMessages += '[supply needs to a number between 1 and 1000]';
      }
    }

    // antiSpamTax test
    let antiSpamTaxValid = true;

    if (
      params.antiSpamTax !== undefined ||
      params._mandatoryParamsList.includes('antiSpamTax')
    ) {
      antiSpamTaxValid = false;

      if (
        params.antiSpamTax !== undefined &&
        typeof params.antiSpamTax === 'number' &&
        params.antiSpamTax >= 0
      ) {
        antiSpamTaxValid = true;
      } else {
        validationMessages +=
          '[antiSpamTax needs to be a number greater than or equal to 0]';
      }
    }

    if (
      !senderAddressValid ||
      !tokenNameValid ||
      !datasetTitleValid ||
      !datasetDescriptionValid ||
      !royaltiesValid ||
      !supplyValid ||
      !antiSpamTaxValid
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

export async function checkUrlIsUp(url: string, expectedHttpCodes: number[]) {
  // also do an https check as well
  if (!url.trim().toLowerCase().includes('https://')) {
    throw new Error(
      `URLs need to be served via a 'https://' secure protocol : ${url}`
    );
  }

  const response = await fetch(url);

  if (!expectedHttpCodes.includes(response.status)) {
    throw new ErrFetch(response.status, response.statusText);
  }
}

export function checkStatus(response: Response) {
  if (!(response.status >= 200 && response.status <= 299)) {
    throw new ErrFetch(response.status, response.statusText);
  }
}
