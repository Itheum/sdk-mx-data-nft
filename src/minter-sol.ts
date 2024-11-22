import {
  EnvironmentsEnum,
  imageService,
  solCNftNfMeIdMinterService,
  solCNftMiscMinterService
} from './config';
import { ContractSol } from './contract-sol';

export abstract class MinterSol extends ContractSol {
  readonly imageServiceUrl: string;
  readonly solCNftNfMeIdMinterServiceUrl: string;
  readonly solCNftMiscMinterServiceUrl: string;

  protected constructor(env: string) {
    super(env);
    this.imageServiceUrl = imageService[env as EnvironmentsEnum];
    this.solCNftNfMeIdMinterServiceUrl =
      solCNftNfMeIdMinterService[env as EnvironmentsEnum];
    this.solCNftMiscMinterServiceUrl =
      solCNftMiscMinterService[env as EnvironmentsEnum];
  }
}
