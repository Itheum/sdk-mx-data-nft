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
- 3rd party app inits it..  `new dataNftSDK()`
- 3rd party app runs commands like
```
const _dataNftSDK =  new dataNftSDK({
  walletProvider? (myLoggedInMXIdentity),
});

// these methods dont need user to be logged in (public)
_dataNftSDK.marketplace.getAllOffer();
_dataNftSDK.marketplace.getPagedOffersOffers();
_dataNftSDK.view.getDataNFTs();

// these methods need user to be "logged into a MX wallet"
_dataNftSDK.marketplace.getMyListedDataNFTs(myLoggedInIdentity);
_dataNftSDK.wallet.getMyDataNFTs(myLoggedInMXIdentity); // mayve we dont need to login
_dataNftSDK.marketplace.procure(dataNFTID, myLoggedInMXIdentity) -- return a TX object that's general purpose;
--- callback? event?

_dataNftSDK.wallet.viewData(dataNFTID, myLoggedInMXIdentity);
-- SDK talks to data marshal (preAccess (promot for signature) + access (send sig))
-- SDK get async response from data marshal with a stream of data



```
