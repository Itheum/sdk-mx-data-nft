# SDK MX - Data NFT

This SDK is currently focused on interacting with the Itheum's Data NFT technology that's deployed to the MultiversX blockchain.

## DO NOT USE -- IN ACTIVE DEV --

You should not be using this yet, if you **really really** want to use it, the come over to our discord at https://itheum.io/discord and speak to us for assistance.

## Dev

- requires `node@19.7X`
- `npm install`
- work on typescript code in the `/src` folder

## Dev Testing

- Only simple dev testing added. First **Build** as below and then run `npm run devtest` and work on the test.mjs file for live reload

## Build

- `npm run build`
- New build is sent to `dist` folder

## NPM Deploy

- Not yet

## How to use

- 3rd party app installs this SDK 'npm i @itheum/sdk-mx-data-nft'
- 3rd party app runs commands like

## DataNft

```

import { DataNft } from '@itheum/sdk-mx-data-nft';

DataNft.setNetworkConfig('devnet'|'testnet'|'mainnet');

// Can build a new DataNft object partially
const dataNft = new DataNft({
    tokenIdentifier: 'tokenIdentifier',
    tokenName: 'tokenName',
  });

// Create a new DataNft object from API
const nonce = 1;
const nft = await DataNft.createFromApi(nonce);

// Create a new DataNft object from API Response
const response = await fetch ('https://devnet-api.multiversx.com/address/nfts');
const dataNfts = [];
  response.forEach((nft) => {
    dataNfts = await DataNft.createFromApiResponse(nft);
  });


// Retrives the DataNfts owned by a address
const address = 'address';
const dataNfts=[];
dataNfts = await DataNft.ownedByAddress(address);


// Retrives the DataNft message from marshal to sign

const dataNft= DataNft.createFromApi(nonce);
const message = await dataNft.messageToSign();

// Sign the message with a wallet
const signature = 'signature';

// Unlock the data inside the dataNft
dataNft.viewData(message,signature);

```

## Minter smart contract

```
import { DataNftMinter } from '@itheum/sdk-mx-data-nft';

const dataNftMinter = new DataNftMinter('devnet'|'testnet'|'mainnet');

// View minter smart contract rewquirements
const requirements = await dataNftMinter.viewMinterRequirements('address');

// View contract pause state
const result = await dataNftMarket.viewContractPauseState();


// Create a mint transaction
const transaction = await dataNftMarket.mint(
     new Address(
       'erd1'
     ),
     'TEST-TOKEN',
     'https://marshal.com',
     'https://streamdata.com',
     'https://previewdata',
     15,
     1000,
     'Test Title',
     'Test Description',
     10
   );


// Create a burn transaction
const transaction = await dataNftMarket.burn(
      new Address(
        'erd1'
      ),
      dataNftNonce,
      quantityToBurn,
    );

```

## Marketplace smart contract

```
import { DataNftMarket } from '@itheum/sdk-mx-data-nft';

const dataNftMarket = new DataNftMarket('devnet'|'testnet'|'mainnet');

// View requirements
const result = await dataNftMarket.viewRequirements();

// View address listed offers
const result = await dataNftMarket.viewAddressListedOffers(new Address(''));

// View address paged offers
const result = await dataNftMarket.viewAddressPagedOffers(1, 10,new Address(''));

// View address total offers
const result = await dataNftMarket.viewAddressTotalOffers(new Address(''));

// View address cancelled offers
const result =  await dataNftMarket.viewAddressCancelledOffers(new Address(''));

// View offers paged
const result = await dataNftMarket.viewPagedOffers(1, 10);

// View offers
const result = await dataNftMarket.viewOffers();

// View number of offers listed
const result = await dataNftMarket.viewNumberOfOffers();

// View contract pause state
const result = await dataNftMarket.viewContractPauseState();

// View last valid offer id
const result = await dataNftMarket.viewLastValidOfferId();

// Create addOffer transaction
const result = dataNftMarket.addOffer(
      new Address(''),
      '',
      0,
      0,
      '',
      0,
      0,
      0
    );

// Create acceptOffer transaction
const result = dataNftMarket.acceptOffer(new Address(''), 0, 0, 0);

// Create cancelOffer transaction
const result = dataNftMarket.cancelOffer(new Address(''), 0);

// Create cancelOffer transaction without sending the funds back to the owner
const result = dataNftMarket.cancelOffer(new Address(''), 0, false);

// Create withdrawFromCancelledOffer transaction
  const result = dataNftMarket.withdrawCancelledOffer(new Address(''), 0);

// Create changeOfferPrice transaction
const result = dataNftMarket.changeOfferPrice(new Address(''), 0, 0);
```
