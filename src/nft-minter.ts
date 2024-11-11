import {
  AddressValue,
  BigUIntValue,
  BooleanValue,
  ContractCallPayloadBuilder,
  ContractFunction,
  IAddress,
  ResultsParser,
  StringValue,
  Token,
  TokenIdentifierValue,
  TokenTransfer,
  Transaction,
  U64Value
} from '@multiversx/sdk-core/out';
import dataNftLeaseAbi from './abis/data-nft-lease.abi.json';
import {
  createFileFromUrl,
  dataNFTDataStreamAdvertise,
  storeToIpfs
} from './common/mint-utils';
import { checkTraitsUrl, checkUrlIsUp } from './common/utils';
import { EnvironmentsEnum, itheumTokenIdentifier } from './config';
import { ErrArgumentNotSet, ErrContractQuery } from './errors';
import { ContractConfiguration, NftMinterRequirements } from './interfaces';
import { Minter } from './minter';
import BigNumber from 'bignumber.js';

export class NftMinter extends Minter {
  /**
   * Creates a new instance of the `NftMinter` class, which is used to interact with the factory generated smart contract.
   * @param env 'devnet' | 'mainnet' | 'testnet'
   * @param contractAddress The address of the factory generated smart contract
   * @param timeout Timeout for the network provider (DEFAULT = 20000ms)
   * @param customNetworkProviderUrl Custom network provider URL
   */
  constructor(
    env: string,
    contractAddress: IAddress,
    timeout: number = 20000,
    customNetworkProviderUrl?: string
  ) {
    super(
      env,
      contractAddress,
      dataNftLeaseAbi,
      timeout,
      customNetworkProviderUrl
    );
  }

  /**
   * Creates an initialize contract transaction for the contract
   * @param senderAddress The address of the sender, must be the admin of the contract
   * @param collectionName The name of the NFT collection
   * @param tokenTicker The ticker of the NFT collection
   * @param mintLimit(seconds)- The mint limit between mints
   * @param requireMintTax - A boolean value to set if the mint tax is required or not
   * @param options - If `requireMintTax` is true, the `options` object must contain the `taxTokenIdentifier` and `taxTokenAmount`
   */
  initializeContract(
    senderAddress: IAddress,
    collectionName: string,
    tokenTicker: string,
    mintLimit: number,
    requireMintTax: boolean,
    claimsAddress: IAddress,
    options?: {
      taxTokenIdentifier: string;
      taxTokenAmount: BigNumber.Value;
    }
  ): Transaction {
    let data;
    if (requireMintTax && options) {
      const initializeContractTx =
        this.transactionFactory.createTransactionForExecute({
          function: 'initializeContract',
          arguments: [
            collectionName,
            tokenTicker,
            mintLimit,
            requireMintTax,
            claimsAddress,
            options.taxTokenIdentifier,
            options.taxTokenAmount
          ],
          sender: senderAddress,
          contract: this.contract.getAddress(),
          gasLimit: 100000000n
        });

      return initializeContractTx;
    } else {
      const initializeContractTx =
        this.transactionFactory.createTransactionForExecute({
          function: 'initializeContract',
          arguments: [
            collectionName,
            tokenTicker,
            mintLimit,
            requireMintTax,
            claimsAddress
          ],
          sender: senderAddress,
          contract: this.contract.getAddress(),
          gasLimit: 100000000n
        });
      return initializeContractTx;
    }
  }

  /**
   * Creates a updateAttributes transaction for the contract
   * @param senderAddress The address of the sender, must be the admin of the contract
   * @param tokenIdentifier The token identifier of the data nft to update attributes
   * @param nonce The nonce of the token to update attributes
   * @param attributes The new attributes to update
   * @param quantity The quantity of the token to update attributes (default: 1)
   */
  updateAttributes(
    senderAddress: IAddress,
    tokenIdentifier: string,
    nonce: number,
    attributes: {
      dataMarshalUrl: string;
      dataStreamUrl: string;
      dataPreviewUrl: string;
      creator: IAddress;
      title: string;
      description: string;
    },
    quantity = 1
  ): Transaction {
    const updateAttributesTx =
      this.transactionFactory.createTransactionForExecute({
        function: 'updateAttributes',
        arguments: [
          attributes.dataMarshalUrl,
          attributes.dataStreamUrl,
          attributes.dataPreviewUrl,
          attributes.creator,
          attributes.title,
          attributes.description
        ],
        sender: senderAddress,
        contract: this.contract.getAddress(),
        gasLimit: 12000000n,
        tokenTransfers: [
          new TokenTransfer({
            token: new Token({
              identifier: tokenIdentifier,
              nonce: BigInt(nonce)
            }),
            amount: BigInt(quantity)
          })
        ]
      });

    return updateAttributesTx;
  }

  /**
   * Creates a `mint` transaction
   *
   * NOTE: The `dataStreamUrl` is being encrypted and the `media` and `metadata` urls are build and uploaded to IPFS
   *
   * NOTE: The `options.nftStorageToken` is required when not using custom image and traits, when using custom image and traits the traits should be compliant with the [Traits](https://github.com/Itheum/sdk-mx-data-nft#traits-structure) structure
   *
   * For more information, see the [README documentation](https://github.com/Itheum/sdk-mx-data-nft#create-a-mint-transaction).
   *
   * @param senderAddress the address of the user
   * @param tokenName the name of the DataNFT-FT. Between 3 and 20 alphanumeric characters, no spaces.
   * @param dataMarshalUrl the url of the data marshal. A live HTTPS URL that returns a 200 OK HTTP code.
   * @param dataStreamUrl the url of the data stream to be encrypted. A live HTTPS URL that returns a 200 OK HTTP code.
   * @param dataPreviewUrl the url of the data preview. A live HTTPS URL that returns a 200 OK HTTP code.
   * @param royalties the royalties to be set for the Data NFT-FT. A number between 0 and 50. This equates to a % value. e.g. 10%
   * @param datasetTitle the title of the dataset. Between 10 and 60 alphanumeric characters.
   * @param datasetDescription the description of the dataset. Between 10 and 400 alphanumeric characters.
   * @param options [optional] below parameters are optional or required based on use case
   *                 - imageUrl: the URL of the image for the Data NFT
   *                 - traitsUrl: the URL of the traits for the Data NFT
   *                 - nftStorageToken: the nft storage token to be used to upload the image and metadata to IPFS
   *                 - antiSpamTokenIdentifier: the anti spam token identifier to be used for the minting
   *                 - antiSpamTax: the anti spam tax to be set for the Data NFT-FT with decimals. Needs to be greater than 0 and should be obtained in real time via {@link viewMinterRequirements} prior to calling mint.
   *                 - extraAssets [optional] extra URIs to attached to the NFT. Can be media files, documents, etc. These URIs are public
   *                 - imgGenBg: [optional] the custom series bg to influence the image generation service
   *                 - imgGenSet: [optional] the custom series layer set to influence the image generation service
   */
  async mint(
    senderAddress: IAddress,
    tokenName: string,
    dataMarshalUrl: string,
    dataStreamUrl: string,
    dataPreviewUrl: string,
    royalties: number,
    datasetTitle: string,
    datasetDescription: string,
    options?: {
      imageUrl?: string;
      traitsUrl?: string;
      nftStorageToken?: string;
      antiSpamTokenIdentifier?: string;
      antiSpamTax?: BigNumber.Value;
      extraAssets?: string[];
      imgGenBg?: string;
      imgGenSet?: string;
    }
  ): Promise<Transaction> {
    const {
      imageUrl,
      traitsUrl,
      nftStorageToken,
      antiSpamTokenIdentifier,
      antiSpamTax,
      extraAssets,
      imgGenBg,
      imgGenSet
    } = options ?? {};

    // deep validate all mandatory URLs
    try {
      await checkUrlIsUp(dataPreviewUrl, [200]);
      await checkUrlIsUp(dataMarshalUrl + '/health-check', [200]);
    } catch (error) {
      throw error;
    }

    let imageOnIpfsUrl: string;
    let metadataOnIpfsUrl: string;

    const { dataNftHash, dataNftStreamUrlEncrypted } =
      await dataNFTDataStreamAdvertise(
        dataStreamUrl,
        dataMarshalUrl,
        this.getContractAddress().bech32() // the minter is the Creator
      );

    if (!imageUrl) {
      if (!nftStorageToken) {
        throw new ErrArgumentNotSet(
          'nftStorageToken',
          'NFT Storage token is required when not using custom image and traits'
        );
      }

      // create the img generative service API based on user options
      let imgGenServiceApi = `${this.imageServiceUrl}/v1/generateNFTArt?hash=${dataNftHash}`;

      if (imgGenBg && imgGenBg.trim() !== '') {
        imgGenServiceApi += `&bg=${imgGenBg.trim()}`;
      }

      if (imgGenSet && imgGenSet.trim() !== '') {
        imgGenServiceApi += `&set=${imgGenSet.trim()}`;
      }

      const { image, traits } = await createFileFromUrl(
        imgGenServiceApi,
        datasetTitle,
        datasetDescription,
        dataPreviewUrl,
        senderAddress.bech32(),
        extraAssets ?? []
      );

      const {
        imageOnIpfsUrl: imageIpfsUrl,
        metadataOnIpfsUrl: metadataIpfsUrl
      } = await storeToIpfs(nftStorageToken, traits, image);

      imageOnIpfsUrl = imageIpfsUrl;
      metadataOnIpfsUrl = metadataIpfsUrl;
    } else {
      if (!traitsUrl) {
        throw new ErrArgumentNotSet(
          'traitsUrl',
          'Traits URL is required when using custom image'
        );
      }

      await checkTraitsUrl(traitsUrl);

      imageOnIpfsUrl = imageUrl;
      metadataOnIpfsUrl = traitsUrl;
    }

    let tokenTransfers: TokenTransfer[] = [];
    if (
      antiSpamTax &&
      antiSpamTokenIdentifier &&
      antiSpamTokenIdentifier != 'EGLD' &&
      antiSpamTax > BigNumber(0)
    ) {
      tokenTransfers.push(
        new TokenTransfer({
          token: new Token({ identifier: antiSpamTokenIdentifier }),
          amount: BigInt(antiSpamTax.toString())
        })
      );
    }

    let args = [
      tokenName,
      imageOnIpfsUrl,
      metadataOnIpfsUrl,
      dataMarshalUrl,
      dataNftStreamUrlEncrypted,
      dataPreviewUrl,
      royalties,
      datasetTitle,
      datasetDescription
    ];

    if (extraAssets && extraAssets?.length > 0) {
      for (const asset of extraAssets) {
        args.push(asset);
      }
    }

    const mintTx = this.transactionFactory.createTransactionForExecute({
      function: 'mint',
      arguments: args,
      sender: senderAddress,
      contract: this.contract.getAddress(),
      gasLimit: 130_000_000n,
      tokenTransfers
    });

    return mintTx;
  }

  /**
   * Creates a setTransferRoles transaction for the contract
   * @param senderAddress The address of the sender, must be the admin of the contract
   * @param address The address to set the transfer roles
   */
  setTransferRole(senderAddress: IAddress, address: IAddress): Transaction {
    const setTransferRoleTx =
      this.transactionFactory.createTransactionForExecute({
        function: 'setTransferRole',
        arguments: [address],
        sender: senderAddress,
        contract: this.contract.getAddress(),
        gasLimit: 10000000n
      });

    return setTransferRoleTx;
  }

  /**
   * Creates an unsetTransferRoles transaction for the contract
   * @param senderAddress The address of the sender, must be the admin of the contract
   * @param address The address to unset the transfer roles
   */
  unsetTransferRole(senderAddress: IAddress, address: IAddress): Transaction {
    const unsetTransferRoleTx =
      this.transactionFactory.createTransactionForExecute({
        function: 'unsetTransferRole',
        arguments: [address],
        sender: senderAddress,
        contract: this.contract.getAddress(),
        gasLimit: 10000000n
      });

    return unsetTransferRoleTx;
  }

  /** Creates a set mint tax transaction for the contract
   * @param senderAddress The address of the sender, must be the admin of the contract
   * @param is_required A boolean value to set if the mint tax is required or not
   */
  setMintTaxIsRequired(
    senderAddress: IAddress,
    is_required: boolean
  ): Transaction {
    const setMintTaxIsRequiredTx =
      this.transactionFactory.createTransactionForExecute({
        function: 'setTaxIsRequired',
        arguments: [is_required],
        sender: senderAddress,
        contract: this.contract.getAddress(),
        gasLimit: 10000000n
      });

    return setMintTaxIsRequiredTx;
  }

  /** Sets the claim address for the contract
   * @param senderAddress The address of the sender, must be the admin of the contract
   * @param claimsAddress The claims address
   */
  setClaimsAddress(
    senderAddress: IAddress,
    claimsAddress: IAddress
  ): Transaction {
    const setClaimAddressTx =
      this.transactionFactory.createTransactionForExecute({
        function: 'setClaimsAddress',
        arguments: [claimsAddress],
        sender: senderAddress,
        contract: this.contract.getAddress(),
        gasLimit: 10000000n
      });

    return setClaimAddressTx;
  }

  /** Creates a claim royalties transaction for the contract
   * @param senderAddress The address of the sender, must be the admin of the contract
   * @param tokenIdentifier The token identifier of the token to claim royalties
   * @param nonce The nonce of the token to claim royalties (default: 0 for ESDT)
   */
  claimRoyalties(
    senderAddress: IAddress,
    tokenIdentifier: string,
    nonce = 0
  ): Transaction {
    const claimRoyaltiesTx =
      this.transactionFactory.createTransactionForExecute({
        function: 'claimRoyalties',
        arguments: [tokenIdentifier, nonce],
        sender: senderAddress,
        contract: this.contract.getAddress(),
        gasLimit: 10000000n
      });

    return claimRoyaltiesTx;
  }

  /**
   * Retrieves the smart contract configuration
   */
  async viewContractConfiguration(): Promise<ContractConfiguration> {
    const interaction =
      this.contract.methodsExplicit.getContractConfiguration();
    const query = interaction.buildQuery();
    const queryResponse = await this.networkProvider.queryContract(query);
    const endpointDefinition = interaction.getEndpoint();
    const { firstValue, returnCode } = new ResultsParser().parseQueryResponse(
      queryResponse,
      endpointDefinition
    );
    if (returnCode.isSuccess()) {
      const returnValue = firstValue?.valueOf();
      const contractConfiguration: ContractConfiguration = {
        tokenIdentifier: returnValue?.token_identifier.toString(),
        mintedTokens: returnValue?.minted_tokens.toNumber(),
        isTaxRequired: returnValue?.tax_required as boolean,
        maxRoyalties: returnValue?.max_royalties.toNumber(),
        minRoyalties: returnValue?.min_royalties.toNumber(),
        mintTimeLimit: returnValue?.mint_time_limit.toNumber(),
        isWhitelistEnabled: returnValue?.is_whitelist_enabled as boolean,
        isContractPaused: returnValue?.is_paused as boolean,
        rolesAreSet: returnValue?.roles_are_set as boolean,
        claimsAddress: returnValue?.claims_address.toString(),
        administratorAddress: returnValue?.administrator_address.toString(),
        taxToken: returnValue?.tax_token.toString()
      };
      return contractConfiguration;
    } else {
      throw new ErrContractQuery(
        'viewContractConfiguration',
        returnCode.toString()
      );
    }
  }

  /**
   * Retrieves the addresses with transfer roles for contract collection
   */
  async viewTransferRoles(): Promise<string[]> {
    const interaction =
      this.contract.methodsExplicit.getAddressesWithTransferRole();
    const query = interaction.buildQuery();
    const queryResponse = await this.networkProvider.queryContract(query);
    const endpointDefinition = interaction.getEndpoint();
    const { firstValue, returnCode } = new ResultsParser().parseQueryResponse(
      queryResponse,
      endpointDefinition
    );
    if (returnCode.isSuccess()) {
      const returnValue = firstValue?.valueOf();
      const addressesWithTransferRole: string[] = returnValue?.map(
        (address: any) => address.toString()
      );
      return addressesWithTransferRole;
    } else {
      throw new ErrContractQuery('viewTransferRoles', returnCode.toString());
    }
  }

  /**
   * Retrieves a list of nonces that are frozen
   */
  async viewFrozenNonces(): Promise<number[]> {
    const interaction = this.contract.methodsExplicit.getFrozenNonces();
    const query = interaction.buildQuery();
    const queryResponse = await this.networkProvider.queryContract(query);
    const endpointDefinition = interaction.getEndpoint();
    const { firstValue, returnCode } = new ResultsParser().parseQueryResponse(
      queryResponse,
      endpointDefinition
    );
    if (returnCode.isSuccess()) {
      const returnValue = firstValue?.valueOf();
      const frozenNonces: number[] = returnValue.map((nonce: any) =>
        nonce.toNumber()
      );
      return frozenNonces;
    } else {
      throw new ErrContractQuery('viewFrozenNonces', returnCode.toString());
    }
  }

  /**
   * Retrieves the address with update attributes roles for contract collection
   */
  async viewUpdateAttributesRoles(): Promise<string[]> {
    const interaction =
      this.contract.methodsExplicit.getAddressesWithUpdateAttributesRole();
    const query = interaction.buildQuery();
    const queryResponse = await this.networkProvider.queryContract(query);
    const endpointDefinition = interaction.getEndpoint();
    const { firstValue, returnCode } = new ResultsParser().parseQueryResponse(
      queryResponse,
      endpointDefinition
    );
    if (returnCode.isSuccess()) {
      const returnValue = firstValue?.valueOf();
      const addressesWithUpdateAttributesRole: string[] = returnValue?.map(
        (address: any) => address.toString()
      );
      return addressesWithUpdateAttributesRole;
    } else {
      throw new ErrContractQuery(
        'viewUpdateAttributesRoles',
        returnCode.toString()
      );
    }
  }

  /**
   * Retrieves the minter smart contract requirements for the given user
   * @param address the address of the user
   * @param taxToken the tax token to be used for the minting (default = `ITHEUM` token identifier based on the  {@link EnvironmentsEnum})
   */
  async viewMinterRequirements(
    address: IAddress,
    taxToken = itheumTokenIdentifier[this.env as EnvironmentsEnum]
  ): Promise<NftMinterRequirements> {
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
      const requirements: NftMinterRequirements = {
        antiSpamTaxValue: returnValue.anti_spam_tax_value.toNumber(),
        contractPaused: returnValue.is_paused,
        maxRoyalties: returnValue.max_royalties.toNumber(),
        minRoyalties: returnValue.min_royalties.toNumber(),
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
      throw new ErrContractQuery(
        'viewMinterRequirements',
        returnCode.toString()
      );
    }
  }
}
