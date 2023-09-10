import { checkTraitsUrl } from '../src';

describe('Traits strucutre test', () => {
  // test('#json traits strucutre check', async () => {
  //   try {
  //     await checkTraitsUrl(
  //       'https://ipfs.io/ipfs/bafybeih7bvpcfj42nawm7g4bkbu25cqxbhlzth5sxm6qjwis3tke23p7ty/metadata.json'
  //     );
  //     expect(true).toBe(true);
  //   } catch (error) {}
  // }, 100000);

  test('#json traits strucutre check', async () => {
    try {
      await checkTraitsUrl(
        'https://ipfs.io/ipfs/bafybeicbmpiehja5rjk425ol4rmrorrg5xh62vcbeqigv3zjcrfk4rtggm/metadata.json'
      );
    } catch (error) {
      expect(error).toStrictEqual(Error('Missing required trait: Creator'));
    }
  }, 100000);
});
