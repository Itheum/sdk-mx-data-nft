import {
  AddressValue,
  IAddress,
  ResultsParser,
  TokenIdentifierValue
} from '@multiversx/sdk-core/out';
import { Minter } from './minter';
import {
  EnvironmentsEnum,
  itheumTokenIdentifier,
  minterContractAddress
} from './config';
import { MinterRequirements } from './interfaces';

export class SftMinter extends Minter {
  constructor(env: string, timeout: number = 10000) {
    super(env, minterContractAddress[env as EnvironmentsEnum], timeout);
  }

  /**
   * Retrieves the minter smart contract requirements for the given user
   * @param address the address of the user
   * @param taxToken the tax token to be used for the minting (default = `ITHEUM` token identifier based on the  {@link EnvironmentsEnum})
   */
  async viewMinterRequirements(
    address: IAddress,
    taxToken = itheumTokenIdentifier[this.env as EnvironmentsEnum]
  ): Promise<MinterRequirements> {
    const interaction = this.contract.methodsExplicit.getUserDataOut([
      new AddressValue(address),
      new TokenIdentifierValue(taxToken)
    ]);
    const query = interaction.buildQuery();
    const queryResponse = await this.networkProvider.queryContract(query);
    const endpointDefinition = interaction.getEndpoint();
    const { firstValue, returnCode } = new ResultsParser().parseQueryResponse(
      queryResponse,
      endpointDefinition
    );
    if (returnCode.isSuccess()) {
      const returnValue = firstValue?.valueOf();
      const requirements: MinterRequirements = {
        antiSpamTaxValue: returnValue.anti_spam_tax_value.toNumber(),
        contractPaused: returnValue.is_paused,
        maxRoyalties: returnValue.max_royalties.toNumber(),
        minRoyalties: returnValue.min_royalties.toNumber(),
        maxSupply: returnValue.max_supply.toNumber(),
        mintTimeLimit: returnValue.mint_time_limit.toNumber(),
        lastUserMintTime: returnValue.last_mint_time,
        userWhitelistedForMint: returnValue.is_whitelisted,
        contractWhitelistEnabled: returnValue.whitelist_enabled,
        numberOfMintsForUser: returnValue.minted_per_user.toNumber(),
        totalNumberOfMints: returnValue.total_minted.toNumber(),
        addressFrozen: returnValue.frozen,
        frozenNonces: returnValue.frozen_nonces.map((v: any) => v.toNumber())
      };
      return requirements;
    } else {
      throw new Error('Could not retrieve minter contract requirements');
      // throw new ErrContractQuery('Could not retrieve requirements');
    }
  }
}
