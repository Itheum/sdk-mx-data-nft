import { BondContract, Compensation, State } from '../src';
import { Bond } from '../src';

describe('Bond test', () => {
  test('#test view methods', async () => {
    const bondContract = new BondContract('devnet');

    const bondPaymentToken = await bondContract.viewBondPaymentToken();

    expect(typeof bondPaymentToken).toBe('string');

    const lockPeriodsWithBonds = await bondContract.viewLockPeriodsWithBonds();

    expect(typeof lockPeriodsWithBonds).toBe('object');

    const contractState = await bondContract.viewContractState();

    expect(Object.values(State).includes(contractState)).toBe(true);

    const acceptedCallers = await bondContract.viewAcceptedCallers();

    expect(typeof acceptedCallers).toBe('object');

    const bond: Bond[] = await bondContract.viewBonds([1]);

    expect(bond).toMatchObject<Bond>;

    const sameBond: Bond[] = await bondContract.viewBonds(
      ['NEWDNFT-3a8caa'],
      [8]
    );

    expect(sameBond).toMatchObject<Bond[]>;

    const sameBond2: Bond[] = await bondContract.viewBonds([
      'NEWDNFT-3a8caa-08'
    ]);
    expect(sameBond2).toMatchObject<Bond[]>;

    const compensation: Compensation = await bondContract.viewCompensation(
      'NEWDNFT-3a8caa',
      8
    );

    expect(compensation).toMatchObject<Compensation>;
  });
});
