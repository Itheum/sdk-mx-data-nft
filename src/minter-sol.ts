import { EnvironmentsEnum, imageService, solCNftMinterService } from './config';
import { ContractSol } from './contract-sol';

export abstract class MinterSol extends ContractSol {
  readonly imageServiceUrl: string;
  readonly solCNftMinterServiceUrl: string;

  protected constructor(env: string) {
    super(env);
    this.imageServiceUrl = imageService[env as EnvironmentsEnum];
    this.solCNftMinterServiceUrl =
      solCNftMinterService[env as EnvironmentsEnum];
  }
}
