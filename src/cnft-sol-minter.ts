import {
  dataNFTDataStreamAdvertise,
  storeToIpfsOnlyImg,
  createIpfsMetadataSolCNft,
  storeToIpfsFullSolCNftMetadata
} from './common/mint-utils';
import { checkTraitsUrl, checkUrlIsUp } from './common/utils';
import { ErrArgumentNotSet } from './errors';
import { MinterSol } from './minter-sol';
import { StringValidator, validateResults } from './common/validator';
import { CNftSolPostMintMetaType } from './interfaces';

export class CNftSolMinter extends MinterSol {
  /**
   * Creates a new instance of the `SftMinter` class, which can be used to interact with the Data NFT-FT minter smart contract
   * @param env 'devnet' | 'mainnet' | 'testnet'
   */
  constructor(env: string) {
    super(env);
  }

  /**
   * Creates a `mint` transaction
   *
   * NOTE: The `dataStreamUrl` is being encrypted and the `media` and `metadata` urls are build and uploaded to IPFS
   *
   * NOTE: The `options.nftStorageToken` is required when not using custom image and traits, when using custom image and traits the traits should be compliant with the `traits` structure
   *
   * @param creatorAddress the address of the creator who we mint a CNft for
   * @param tokenName the name of the DataNFT-FT. Between 3 and 20 alphanumeric characters, no spaces.
   * @param dataMarshalUrl the url of the data marshal. A live HTTPS URL that returns a 200 OK HTTP code.
   * @param dataStreamUrl the url of the data stream to be encrypted. A live HTTPS URL that returns a 200 OK HTTP code.
   * @param dataPreviewUrl the url of the data preview. A live HTTPS URL that returns a 200 OK HTTP code.
   * @param datasetTitle the title of the dataset. Between 10 and 60 alphanumeric characters.
   * @param datasetDescription the description of the dataset. Between 10 and 400 alphanumeric characters.
   * @param options [optional] below parameters are optional or required based on use case
   *                 - imageUrl: the URL of the image for the Data NFT
   *                 - traitsUrl: the URL of the traits for the Data NFT
   *                 - nftStorageToken: the nft storage token to be used to upload the image and metadata to IPFS
   *                 - extraAssets: [optional] extra URIs to attached to the NFT. Can be media files, documents, etc. These URIs are public
   *                 - imgGenBg: [optional] the custom series bg to influence the image generation service
   *                 - imgGenSet: [optional] the custom series layer set to influence the image generation service
   *
   */
  async mint(
    creatorAddress: string,
    tokenName: string,
    dataMarshalUrl: string,
    dataStreamUrl: string,
    dataPreviewUrl: string,
    datasetTitle: string,
    datasetDescription: string,
    options?: {
      imageUrl?: string;
      traitsUrl?: string;
      nftStorageToken?: string;
      extraAssets?: string[];
      imgGenBg?: string;
      imgGenSet?: string;
    }
  ): Promise<{
    imageUrl: string;
    metadataUrl: string;
    mintMeta: CNftSolPostMintMetaType;
  }> {
    const {
      imageUrl,
      traitsUrl,
      nftStorageToken,
      extraAssets,
      imgGenBg,
      imgGenSet
    } = options ?? {};

    const tokenNameValidator = new StringValidator()
      .notEmpty()
      .alphanumeric()
      .minLength(3)
      .maxLength(20)
      .validate(tokenName);

    const datasetTitleValidator = new StringValidator()
      .notEmpty()
      .minLength(10)
      .maxLength(60)
      .validate(datasetTitle.trim());

    const datasetDescriptionValidator = new StringValidator()
      .notEmpty()
      .minLength(10)
      .maxLength(400)
      .validate(datasetDescription);

    validateResults([
      tokenNameValidator,
      datasetTitleValidator,
      datasetDescriptionValidator
    ]);

    // deep validate all mandatory URLs
    try {
      await checkUrlIsUp(dataPreviewUrl, [200]);
      await checkUrlIsUp(dataMarshalUrl + '/health-check', [200]);
    } catch (error) {
      throw error;
    }

    let imageOnIpfsUrl: string;
    let metadataOnIpfsUrl: string;

    // handle all logic related to data stream and ipfs gen of img,traits etc
    let allDataStreamAndIPFSLogicDone = false;

    try {
      const { dataNftHash, dataNftStreamUrlEncrypted } =
        await dataNFTDataStreamAdvertise(
          dataStreamUrl,
          dataMarshalUrl,
          creatorAddress // the caller is the Creator
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

        let resImgCall: any = '';
        let dataImgCall: any = '';
        let _imageFile: Blob = new Blob();

        resImgCall = await fetch(imgGenServiceApi);
        dataImgCall = await resImgCall.blob();
        _imageFile = dataImgCall;

        const traitsFromImgHeader =
          resImgCall.headers.get('x-nft-traits') || '';

        const { imageOnIpfsUrl: imgOnIpfsUrl } = await storeToIpfsOnlyImg(
          nftStorageToken,
          _imageFile
        );

        const cNftMetadataContent = createIpfsMetadataSolCNft(
          tokenName,
          datasetTitle,
          datasetDescription,
          imgOnIpfsUrl,
          creatorAddress,
          dataNftStreamUrlEncrypted,
          dataPreviewUrl,
          dataMarshalUrl,
          traitsFromImgHeader,
          extraAssets ?? []
        );

        const { metadataIpfsUrl } = await storeToIpfsFullSolCNftMetadata(
          nftStorageToken,
          cNftMetadataContent
        );

        imageOnIpfsUrl = imgOnIpfsUrl;
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

      allDataStreamAndIPFSLogicDone = true;
    } catch (e: any) {
      throw e;
    }

    // we not make a call to our private cNFt minter API
    let mintMeta: CNftSolPostMintMetaType = {};

    if (allDataStreamAndIPFSLogicDone) {
      try {
        const postHeaders = new Headers();
        postHeaders.append('Content-Type', 'application/json');

        const raw = JSON.stringify({
          metadataOnIpfsUrl,
          tokenName,
          mintForSolAddr: creatorAddress,
          solSignature: 'solSignature',
          signatureNonce: 'signatureNonce'
        });

        const requestOptions = {
          method: 'POST',
          headers: postHeaders,
          body: raw
        };

        let resMintCall: any = '';
        let dataMintCall: any = '';

        resMintCall = await fetch(this.solCNftMinterServiceUrl, requestOptions);
        dataMintCall = await resMintCall.text();
        mintMeta = dataMintCall;
      } catch (e: any) {
        mintMeta = { error: true, errMsg: e.toString() };
        throw e;
      }
    }

    return {
      imageUrl: imageOnIpfsUrl,
      metadataUrl: metadataOnIpfsUrl,
      mintMeta
    };
  }
}
