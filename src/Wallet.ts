import { Claim } from "./Claim";

interface CustomWindow extends Window {
  ethereum: any;
}
declare var window: CustomWindow;

export class Wallet {
  // private static provider = new ethers.providers.Web3Provider(window.ethereum);

  // private contract: ethers.Contract;
  private address: string;

  constructor(address: string) {
    this.address = address;
  }

  public getAddress(): string {
    return this.address;
  }

  // public async addClaim(claim: Claim): Promise<void> {
  //   const signer = await Identity.getSigner();

  //   const addClaimTx = await this.contract.connect(signer).addClaim(claim);

  //   await addClaimTx.wait();
  // }

  // public async removeClaim(claimIdentifier: string): Promise<void> {
  //   const signer = await Identity.getSigner();

  //   const addClaimTx = await this.contract.connect(signer).removeClaim(claimIdentifier);

  //   await addClaimTx.wait();
  // }

  // public getClaims(): Promise<string[]> {
  //   return this.contract.getClaimIdentifier();
  // }

  // public getClaimByIdentifier(claimIdentifier: string): Promise<Claim> {
  //   return this.contract.claims(claimIdentifier);
  // }

  // public getOwners(): Promise<string[]> {
  //   return this.contract.getOwners();
  // }

  // public async getOwnerRemovalConfirmations(): Promise<{ address: string, count: number }[]> {
  //   const confirmations = [];

  //   const owners = await this.getOwners();

  //   for (const owner of owners) {
  //     const count = await this.contract.removeOwnerConfirmationCount(owner);
  //     confirmations.push(count);
  //   }
  //   return confirmations;
  // }

  // public async addOwner(address: string): Promise<void> {
  //   const signer = await Identity.getSigner();

  //   const addOwnerTx = await this.contract.connect(signer).addOwner(address);

  //   await addOwnerTx.wait();
  // }

  // public async proposeOwnerRemoval(address: string): Promise<void> {
  //   const signer = await Identity.getSigner();

  //   const proposeOwnerRemovalTx = await this.contract.connect(signer).proposeOwnerRemoval(address);

  //   await proposeOwnerRemovalTx.wait();
  // }

  // public async removeOwner(address: string): Promise<void> {
  //   const signer = await Identity.getSigner();

  //   const removeOwnerTx = await this.contract.connect(signer).removeOwner(address);

  //   await removeOwnerTx.wait();
  // }

  // public async execute(functionSignature: string, targetAddress: string, amountInEtherString: string, gasLimit: number): Promise<void> {
  //   const signer = await Identity.getSigner();

  //   const functionSignatureHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(functionSignature)).substring(0, 10);

  //   const executeTx = await this.contract.connect(signer).execute(0, targetAddress, ethers.utils.parseEther(amountInEtherString), functionSignatureHash, { gasLimit });

  //   await executeTx.wait();
  // }

  // get address(): string {
  //   return this.contract.address;
  // }

  // private static async getSigner(): Promise<ethers.providers.JsonRpcSigner> {
  //   await this.provider.send("eth_requestAccounts", []);
  //   return this.provider.getSigner();
  // }

  // private static async getSignerAddress(): Promise<string> {
  //   const signer = await this.getSigner();
  //   return signer.getAddress();
  // }
}