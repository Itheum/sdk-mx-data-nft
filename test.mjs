import { Wallet as SDKWallet } from "./dist/index.js";
console.log('hello');

const wallet = new SDKWallet('erd01212121212____');

console.log(wallet.getAddress());
