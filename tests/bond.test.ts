import {
  BondConfiguration,
  BondContract,
  Compensation,
  State,
  createTokenIdentifier,
  dataNftTokenIdentifier
} from '../src';
import { Bond } from '../src';

describe('Bond test', () => {
  const tokenIdentifier = dataNftTokenIdentifier.devnet;
  test('#test no deploy', () => {
    try {
      const bondContract = new BondContract('testnet');
    } catch (e: any) {
      expect(e.message).toBe('Contract address is not deployed on testnet');
    }
  });

  test('#view bond configuration', async () => {
    const bondContract = new BondContract('devnet');
    const bondConfiguration = await bondContract.viewContractConfiguration();

    expect(bondConfiguration).toMatchObject<BondConfiguration>;
  });
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
      [tokenIdentifier],
      [172]
    );
    expect(sameBond).toMatchObject<Bond[]>;
    const sameBond2: Bond[] = await bondContract.viewBonds([
      createTokenIdentifier(tokenIdentifier, 172)
    ]);
    expect(sameBond2).toMatchObject<Bond[]>;
    expect(sameBond).toStrictEqual(sameBond2);

    const singleBond: Bond = await bondContract.viewBond(1);
    expect(singleBond).toMatchObject<Bond>;
    expect(singleBond).toStrictEqual(sameBond2[0]);

    const pagedBonds: Bond[] = await bondContract.viewPagedBonds(0, 2);
    expect(pagedBonds).toMatchObject<Bond[]>;
    expect(pagedBonds.length).toBe(3);
    expect(pagedBonds[0]).toStrictEqual(singleBond);

    const compensation: Compensation = await bondContract.viewCompensation(1);
    expect(compensation).toMatchObject<Compensation>;

    const compensations: Compensation[] = await bondContract.viewCompensations([
      { tokenIdentifier: tokenIdentifier, nonce: 172 }
    ]);
    expect(compensations).toMatchObject<Compensation[]>;
    expect(compensations[0]).toStrictEqual(compensation);

    const pagedCompensations: Compensation[] =
      await bondContract.viewPagedCompensations(0, 2);
    expect(pagedCompensations).toMatchObject<Compensation[]>;
    expect(pagedCompensations.length).toBe(3);
    expect(pagedCompensations[0]).toStrictEqual(compensation);
  }, 20000);
});
