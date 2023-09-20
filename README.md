# SDK MX - Data NFT

[![npm (scoped)](https://img.shields.io/npm/v/@itheum/sdk-mx-data-nft?style=for-the-badge)](https://www.npmjs.com/package/@itheum/sdk-mx-data-nft)

This SDK is currently focused on interacting with the Itheum's Data NFT technology that's deployed to the MultiversX blockchain.

## Contributing

- requires `node@19.7X`
- `npm install`
- work on typescript code in the `/src` folder

### Dev Testing

- Only simple dev testing added. First **Build** as below and then run `npm run devtest` and work on the test.mjs file for live reload

### Build

- `npm run build`
- New build is sent to `dist` folder

## Usage in 3rd party dApps

- Install this SDK via `npm i @itheum/sdk-mx-data-nft`
- Methods supported are given below is `SDK Docs`

## SDK DOCS

Note that all param requirements and method docs are marked up in the typescript code, so if you use typescript in your project your development tool (e.g. Visual Studio Code) will provide intellisense for all methods and functions.

### 1. Interacting with Data NFTs

```typescript
import { DataNft } from '@itheum/sdk-mx-data-nft';

DataNft.setNetworkConfig('devnet' | 'testnet' | 'mainnet');

// Can build a new DataNft object partially
const dataNft = new DataNft({
  tokenIdentifier: 'tokenIdentifier',
  tokenName: 'tokenName'
});

// Create a new DataNft object from API
const nonce = 1;
const nft = await DataNft.createFromApi({ nonce });

// Create a new DataNft object from API Response
const response = await fetch('https://devnet-api.multiversx.com/address/nfts');
const dataNfts = [];

response.forEach(async (nft) => {
  const data = await DataNft.createFromApiResponse(nft);
  dataNfts.push(data);
});

// Retrieves the DataNfts owned by a address
const address = 'address';
const dataNfts = [];
dataNfts = await DataNft.ownedByAddress(address);

// Retrieves the specific DataNft
const dataNft = DataNft.createFromApi({ nonce });

// (A) Get a message from the Data Marshal node for your to sign to prove ownership
const message = await dataNft.messageToSign();

// (B) Sign the message with a wallet and obtain a signature
const signature = 'signature';

// There are 2 methods to open a data NFT and view the content -->

// Method 1) Unlock the data inside the Data NFT via signature verification
dataNft.viewData({
  message,
  signature
}); // optional params "stream" (stream out data instead of downloading file), "fwdAllHeaders"/"fwdHeaderKeys", "fwdHeaderMapLookup" can be used to pass headers like Authorization to origin Data Stream servers


// Method 2) OR, you can use a MultiversX Native Auth access token to unlock the data inside the Data NFT without the need for the the signature steps above (A)(B). This has a much better UX
dataNft.viewDataViaMVXNativeAuth({
  mvxNativeAuthOrigins: "http://localhost:3000", "https://mycoolsite.com"], // same whitelist domains your client app used when generating native auth token
  mvxNativeAuthMaxExpirySeconds: 300, // same expiry seconds your client app used when generating native auth token
  fwdHeaderMapLookup: {
    authorization : "Bearer myNativeAuthToken"
  }
}); // optional params "stream" (stream out data instead of downloading file), "fwdAllHeaders"/"fwdHeaderKeys" can be used to pass on the headers like Authorization to origin Data Stream servers
```

### Traits structure

Items below marked "required" are the "minimum" required for it to be compatible with the Itheum protocol. You can add any additional traits you may need for your own reasons.

```json
{
  "description": "Data NFT description", // required
  "attributes": [
    {
      "trait_type": "Creator", // required
      "value": "creator address"
    },
    {
      "trait_type": "Data Preview URL", // required
      "value": "https://previewdata.com"
    },
    {
      "trait_type": "extra trait",
      "value": "extra trait value"
    },
    ...
  ]
}
```
