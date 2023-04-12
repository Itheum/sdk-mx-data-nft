import { SignableMessage } from "@multiversx/sdk-core/out";
import { Config, Environment, networkConfiguration } from "./config";




export class DataNft {
    tokenIdentifier: string = "";
    tokenNonce: number = 0;
    nftImgUrl?: string = "";
    dataPreview: string = "";
    dataStream: string = "";
    dataMarshal: string = "";
    tokenName: string = "";
    creator: string = "";
    creationTime: Date = new Date();
    supply: number = 0;
    balance: number = 0;
    description: string = "";
    title: string = "";
    royalties: number = 0;
    nonce: number = 0;
    collection: string = "";


    static networkConfiguration: Config;


    static setNetworkConfig(env: Environment) {
        this.networkConfiguration = networkConfiguration[env];
    }


    constructor(init?: Partial<DataNft>) {
        Object.assign(this, init);
    }

    async getMessageToSign(): Promise<string> {

        const res = await fetch(`${this.dataMarshal}/preaccess?chainId=E${DataNft.networkConfiguration.chainID}`);
        const data = await res.json();

        if (data && data.nonce) {
            return data.nonce;
        }
        throw new Error("Could not get nonce from data marshal");
    }

    async viewData(signedNonce: string, signableMessage: SignableMessage): Promise<any> {
        const signResult = {
            signature: "",
            addrInHex: "",
            success: false,
            exception: "",
        };
        try {
            if (signableMessage?.signature && signableMessage?.address) {
                signResult.signature = signableMessage.signature.toString("hex");
                signResult.addrInHex = signableMessage.address.hex();
                signResult.success = true;
            } else {
                signResult.exception = "Some Error";
            }
        } catch (e: any) {
            signResult.success = false;
            signResult.exception = e.toString();
        }

        const response = await fetch(`${this.dataMarshal}/access?nonce=${signedNonce}&NFTId=${this.tokenIdentifier}&signature=${signResult.signature}&chainId=${DataNft.networkConfiguration.chainID}&accessRequesterAddr=${signResult.addrInHex}`);

        return response;
    }





}


