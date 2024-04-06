import { File, NFTStorage } from 'nft.storage';

export async function dataNFTDataStreamAdvertise(
  dataNFTStreamUrl: string,
  dataMarshalUrl: string,
  dataCreatorAddress: string
): Promise<{ dataNftHash: string; dataNftStreamUrlEncrypted: string }> {
  const myHeaders = new Headers();
  myHeaders.append('cache-control', 'no-cache');
  myHeaders.append('Content-Type', 'application/json');

  const requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: JSON.stringify({
      dataNFTStreamUrl,
      dataCreatorERDAddress: dataCreatorAddress
    })
  };

  try {
    const res = await fetch(`${dataMarshalUrl}/generate_V2`, requestOptions);
    const data = await res.json();

    if (data && data.encryptedMessage && data.messageHash) {
      return {
        dataNftHash: data.messageHash,
        dataNftStreamUrlEncrypted: data.encryptedMessage
      };
    } else {
      throw new Error('Issue with data marshal generating payload');
    }
  } catch (error) {
    throw error;
  }
}

export async function storeToIpfs(
  storageToken: string,
  traits: File,
  image: File
): Promise<{ imageOnIpfsUrl: string; metadataOnIpfsUrl: string }> {
  let res;
  try {
    const nftstorage = new NFTStorage({
      token: storageToken
    });
    const dir = [image, traits];
    res = await nftstorage.storeDirectory(dir);
  } catch (error) {
    throw error;
  }
  return {
    imageOnIpfsUrl: `https://ipfs.io/ipfs/${res}/image.png`,
    metadataOnIpfsUrl: `https://ipfs.io/ipfs/${res}/metadata.json`
  };
}

export function createIpfsMetadata(
  traits: string,
  datasetTitle: string,
  datasetDescription: string,
  dataNFTStreamPreviewUrl: string,
  address: string,
  bonusNFTMediaImgUrl?: string
) {
  const metadata: Record<string, any> = {
    description: `${datasetTitle} : ${datasetDescription}`,
    data_preview_url: dataNFTStreamPreviewUrl,
    attributes: [] as object[]
  };
  // if we have bonusNFTMediaImgUrl, we put that as a top level attribute as well
  if (bonusNFTMediaImgUrl && bonusNFTMediaImgUrl.trim() !== '') {
    metadata['bonus_media_img'] = bonusNFTMediaImgUrl.trim().toLowerCase();
  }
  const attributes = traits
    .split(',')
    .filter((element) => element.trim() !== '');
  const metadataAttributes = [];
  for (const attribute of attributes) {
    const [key, value] = attribute.split(':');
    const trait = { trait_type: key.trim(), value: value.trim() };
    metadataAttributes.push(trait);
  }
  //// This should not be a trait as it will pollute the trait filters on NFT marketplaces
  // metadataAttributes.push({
  //   trait_type: 'Data Preview URL',
  //   value: dataNFTStreamPreviewUrl
  // });
  metadataAttributes.push({ trait_type: 'Creator', value: address });
  metadata.attributes = metadataAttributes;
  return metadata;
}

export async function createFileFromUrl(
  url: string,
  datasetTitle: string,
  datasetDescription: string,
  dataNFTStreamPreviewUrl: string,
  address: string,
  bonusNFTMediaImgUrl?: string
) {
  let res: any = '';
  let data: any = '';
  let _imageFile: File = new File([], '');
  if (url) {
    res = await fetch(url);
    data = await res.blob();
    _imageFile = new File([data], 'image.png', { type: 'image/png' });
  }
  const traits = createIpfsMetadata(
    res.headers.get('x-nft-traits') || '',
    datasetTitle,
    datasetDescription,
    dataNFTStreamPreviewUrl,
    address,
    bonusNFTMediaImgUrl
  );
  const _traitsFile = new File([JSON.stringify(traits)], 'metadata.json', {
    type: 'application/json'
  });
  return { image: _imageFile, traits: _traitsFile };
}
