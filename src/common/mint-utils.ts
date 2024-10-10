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
  traits: object,
  image: Blob
): Promise<{ imageOnIpfsUrl: string; metadataOnIpfsUrl: string }> {
  try {
    const imageHash = await storeImageToIpfs(image, storageToken);
    const traitsHash = await storeTraitsToIpfs(traits, storageToken);

    if (imageHash && traitsHash) {
      return {
        imageOnIpfsUrl: `https://ipfs.io/ipfs/${imageHash}`,
        metadataOnIpfsUrl: `https://ipfs.io/ipfs/${traitsHash}`
      };
    } else {
      return {
        imageOnIpfsUrl: '',
        metadataOnIpfsUrl: ''
      };
    }
  } catch (error) {
    throw error;
  }
}

export async function storeToIpfsFullSolCNftMetadata(
  storageToken: string,
  metadataStructureSolCNft: object
): Promise<{ metadataIpfsUrl: string }> {
  try {
    const metadataIpfsHash = await storeTraitsToIpfs(
      metadataStructureSolCNft,
      storageToken
    );

    if (metadataIpfsHash) {
      return {
        metadataIpfsUrl: `https://ipfs.io/ipfs/${metadataIpfsHash}`
      };
    } else {
      return {
        metadataIpfsUrl: ''
      };
    }
  } catch (error) {
    throw error;
  }
}

export async function storeToIpfsOnlyImg(
  storageToken: string,
  image: Blob
): Promise<{ imageOnIpfsUrl: string }> {
  try {
    const imageHash = await storeImageToIpfs(image, storageToken);

    if (imageHash) {
      return {
        imageOnIpfsUrl: `https://ipfs.io/ipfs/${imageHash}`
      };
    } else {
      return {
        imageOnIpfsUrl: ''
      };
    }
  } catch (error) {
    throw error;
  }
}

async function storeImageToIpfs(image: Blob, storageToken: string) {
  const form = new FormData();
  form.append('file', image);
  form.append('pinataMetadata', '{\n  "name": "image"\n}');
  form.append('pinataOptions', '{\n  "cidVersion": 0\n}');

  const options = {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${storageToken}`
    },
    body: form
  };
  const response = await fetch(
    'https://api.pinata.cloud/pinning/pinFileToIPFS',
    options
  );
  const res = await response.json();
  const imageHash = res.IpfsHash;
  return imageHash;
}

async function storeTraitsToIpfs(traits: object, storageToken: string) {
  const options = {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${storageToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      pinataOptions: { cidVersion: 0 },
      pinataMetadata: { name: 'metadata' },
      pinataContent: traits
    })
  };

  const response = await fetch(
    'https://api.pinata.cloud/pinning/pinJSONToIPFS',
    options
  );
  const res = await response.json();
  const traitsHash = res.IpfsHash;
  return traitsHash;
}

export function createIpfsMetadata(
  traits: string,
  datasetTitle: string,
  datasetDescription: string,
  dataNFTStreamPreviewUrl: string,
  address: string,
  extraAssets: string[]
) {
  const metadata: Record<string, any> = {
    description: `${datasetTitle} : ${datasetDescription}`,
    data_preview_url: dataNFTStreamPreviewUrl,
    attributes: [] as object[]
  };
  if (extraAssets && extraAssets.length > 0) {
    metadata.extra_assets = extraAssets;
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
  metadataAttributes.push({ trait_type: 'Creator', value: address });
  metadata.attributes = metadataAttributes;
  return metadata;
}

export function createIpfsMetadataSolCNft(
  tokenName: string,
  datasetTitle: string,
  datasetDescription: string,
  imageOnIpfsUrl: string,
  creatorAddress: string,
  dataNFTStreamUrl: string,
  dataNFTStreamPreviewUrl: string,
  dataNFTDataMarshalUrl: string,
  traits: string,
  extraAssets: string[]
) {
  const metadata: Record<string, any> = {
    name: tokenName,
    description: `${datasetTitle} : ${datasetDescription}`,
    image: imageOnIpfsUrl,
    itheum_creator: creatorAddress,
    itheum_data_stream_url: dataNFTStreamUrl,
    itheum_data_preview_url: dataNFTStreamPreviewUrl,
    itheum_data_marshal_url: dataNFTDataMarshalUrl,
    attributes: [] as object[]
  };

  if (extraAssets && extraAssets.length > 0) {
    metadata.extra_assets = extraAssets;
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

  metadata.attributes = metadataAttributes;
  return metadata;
}

export async function createFileFromUrl(
  url: string,
  datasetTitle: string,
  datasetDescription: string,
  dataNFTStreamPreviewUrl: string,
  address: string,
  extraAssets: string[]
) {
  let res: any = '';
  let data: any = '';
  let _imageFile: Blob = new Blob();
  if (url) {
    res = await fetch(url);
    data = await res.blob();
    _imageFile = data;
  }
  const traits = createIpfsMetadata(
    res.headers.get('x-nft-traits') || '',
    datasetTitle,
    datasetDescription,
    dataNFTStreamPreviewUrl,
    address,
    extraAssets
  );
  const _traitsFile = traits;
  return { image: _imageFile, traits: _traitsFile };
}

export async function createFileFromUrlSolCNft(
  url: string,
  datasetTitle: string,
  datasetDescription: string,
  dataNFTStreamPreviewUrl: string,
  address: string,
  extraAssets: string[]
) {
  let res: any = '';
  let data: any = '';
  let _imageFile: Blob = new Blob();

  if (url) {
    res = await fetch(url);
    data = await res.blob();
    _imageFile = data;
  }

  const traits = createIpfsMetadata(
    res.headers.get('x-nft-traits') || '',
    datasetTitle,
    datasetDescription,
    dataNFTStreamPreviewUrl,
    address,
    extraAssets
  );
  const _traitsFile = traits;
  return { image: _imageFile, traits: _traitsFile };
}
