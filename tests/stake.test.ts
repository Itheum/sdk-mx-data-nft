import { ContractConfiguration, LivelinessStake, State } from '../src';

describe('Bond test', () => {
  test('#test liveliness', async () => {
    const livelinessStake = new LivelinessStake('devnet');

    const response = await livelinessStake.viewContractConfiguration();

    expect(response).toBeInstanceOf(Object as unknown as ContractConfiguration);
  });
});
