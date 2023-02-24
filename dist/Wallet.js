"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Wallet = void 0;
class Wallet {
    constructor(address) {
        this.address = address;
    }
    getAddress() {
        return this.address;
    }
}
exports.Wallet = Wallet;
