# SDK MX - Data NFT
This SDK is currently focused on interacting with the EVM contracts here: https://github.com/Itheum/datametaverse-evm

## Dev
- `npm install`
- work on typescript code in the `/src` folder
- If you deploy new `identityFactory` (https://github.com/Itheum/datametaverse-evm/blob/main/contracts/identity/IdentityFactory.sol) or `identity` (https://github.com/Itheum/datametaverse-evm/blob/main/contracts/identity/Identity.sol) contracts then you need to update `constants.ts` with new ABI and code. This also applies if you deploy new a identityFactory SubGraph (i.e. https://github.com/Itheum/poc-identity-factory-subgraph)

## UI Integration Dev
- Download and run this POC app: (https://github.com/Itheum/poc-identity-subsystem-dapp-ui-tests)

## Testing
- Not Done yet

## Build
- `npm run build`
- New build is sent to `dist` folder

## NPM Deploy
- The working POC is deployed here temporary - https://www.npmjs.com/package/poc-itheum-identity-sdk