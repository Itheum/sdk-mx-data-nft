import {
  SmartContract,
  Address,
  AbiRegistry,
  IAddress,
  TokenIdentifierValue,
  AddressValue,
  ResultsParser,
  Transaction,
  ContractCallPayloadBuilder,
  ContractFunction,
  U64Value,
  BigUIntValue,
  StringValue,
  BooleanValue
} from '@multiversx/sdk-core/out';
import { ApiNetworkProvider } from '@multiversx/sdk-network-providers/out';
import {
  EnvironmentsEnum,
  dataNftTokenIdentifier,
  imageService,
  itheumTokenIdentifier,
  networkConfiguration
} from './config';
import { NFTStorage, File } from 'nft.storage';
import {
  checkTraitsUrl,
  checkUrlIsUp,
  validateSpecificParamsMint
} from './common/utils';
// import {
//   ErrArgumentNotSet,
//   ErrContractQuery,
//   ErrFailedOperation
// } from './errors';

export abstract class Minter {
  readonly contract: SmartContract;
  readonly chainID: string;
  readonly networkProvider: ApiNetworkProvider;
  readonly env: string;
  readonly imageServiceUrl: string;

  /**
   * Creates a new instance of the `DataNftMinter` which can be used to interact with the Data NFT-FT minter smart contract
   * @param env 'devnet' | 'mainnet' | 'testnet'
   * @param timeout Timeout for the network provider (DEFAULT = 10000ms)
   */
  protected constructor(
    env: string,
    contractAddress: string,
    abiFile: any,
    timeout: number = 10000
  ) {
    this.env = env;
    const networkConfig = networkConfiguration[env as EnvironmentsEnum];
    this.imageServiceUrl = imageService[env as EnvironmentsEnum];
    this.chainID = networkConfig.chainID;
    this.networkProvider = new ApiNetworkProvider(
      networkConfig.networkProvider,
      {
        timeout: timeout
      }
    );
    this.contract = new SmartContract({
      address: new Address(contractAddress),
      abi: AbiRegistry.create(abiFile)
    });
  }

  /**
   * Retrives the address of the minter smart contract based on the environment
   */
  getContractAddress(): IAddress {
    return this.contract.getAddress();
  }

  /**
   * Retrieves the smart contract pause state
   */
  async viewContractPauseState(): Promise<boolean> {
    const interaction = this.contract.methodsExplicit.getIsPaused();
    const query = interaction.buildQuery();
    const queryResponse = await this.networkProvider.queryContract(query);
    const endpointDefinition = interaction.getEndpoint();
    const { firstValue, returnCode } = new ResultsParser().parseQueryResponse(
      queryResponse,
      endpointDefinition
    );
    if (returnCode.isSuccess()) {
      const returnValue = firstValue?.valueOf();
      return new BooleanValue(returnValue).valueOf();
    } else {
      throw new Error('Error while retrieving the contract pause state');
      // throw new ErrContractQuery(
      //   'Error while retrieving the contract pause state'
      // );
    }
  }

  /**
   *  Creates a `burn` transaction
   * @param senderAddress the address of the user
   * @param dataNftNonce the nonce of the DataNFT-FT
   * @param quantityToBurn the quantity to burn
   * @param dataNftIdentifier the DataNFT-FT token identifier (default = `DATA-NFT-FT` token identifier based on the {@link EnvironmentsEnum})
   */
  burn(
    senderAddress: IAddress,
    dataNftNonce: number,
    quantityToBurn: number,
    dataNftIdentifier = dataNftTokenIdentifier[this.env as EnvironmentsEnum]
  ): Transaction {
    const burnTx = new Transaction({
      value: 0,
      data: new ContractCallPayloadBuilder()
        .setFunction(new ContractFunction('ESDTNFTTransfer'))
        .addArg(new TokenIdentifierValue(dataNftIdentifier))
        .addArg(new U64Value(dataNftNonce))
        .addArg(new BigUIntValue(quantityToBurn))
        .addArg(new AddressValue(this.contract.getAddress()))
        .addArg(new StringValue('burn'))
        .build(),
      receiver: senderAddress,
      sender: senderAddress,
      gasLimit: 12000000,
      chainID: this.chainID
    });
    return burnTx;
  }
}
