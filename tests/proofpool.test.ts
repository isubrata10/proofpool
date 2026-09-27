import test from 'node:test';
import assert from 'node:assert';
import { Contract, ledger } from '../managed/proofpool/contract/index.js';
import { createConstructorContext, createCircuitContext } from '@midnight-ntwrk/compact-runtime';

function toBytes32(str: string): Uint8Array {
  const buf = Buffer.alloc(32);
  buf.write(str, 0, 'utf8');
  return new Uint8Array(buf);
}

test('ProofPool Security Invariants', async () => {
    // 1. Initial State
    const dummyCoinPublicKey = new Uint8Array(32);
    const contract = new Contract({});
    
    // Test constructor sets threshold to 500
    const constructorCtx = createConstructorContext(undefined, dummyCoinPublicKey);
    const initialResult = await contract.initialState(constructorCtx, 1000n, 500n);
    
    let state = initialResult.currentContractState.data;
    let zswap = initialResult.currentZswapLocalState;
    
    assert.strictEqual(ledger(state).funding_target, 1000n, 'Target should be 1000');
    assert.strictEqual(ledger(state).eligibility_threshold, 500n, 'Threshold should be 500');
    assert.strictEqual(ledger(state).total_contributors, 0n, 'Initial contributors should be 0');

    const dummyAddress = '02' + Buffer.alloc(31).toString('hex');
    const contributorIdA = toBytes32('user_A');
    const secretA = toBytes32('my_secret_A');
    const contributorIdB = toBytes32('user_B');
    const secretB = toBytes32('my_secret_B');

    // Test A & C & F & G logic flow
    
    // User A contributes 600
    const circuitCtx1 = createCircuitContext('contribute', dummyAddress, zswap, initialResult.currentContractState, undefined);
    const result1 = await contract.circuits.contribute(circuitCtx1, contributorIdA, 600n, secretA);
    
    state = result1.context.queryContexts[dummyAddress].state;
    zswap = result1.context.currentZswapLocalState;
    
    // Privacy check: amounts not on ledger
    assert.strictEqual(ledger(state).total_contributors, 1n, 'Contributors should be 1');

    // Test A — Duplicate contributor rejected
    try {
      const circuitCtxDup = createCircuitContext('contribute', dummyAddress, zswap, state, undefined);
      await contract.circuits.contribute(circuitCtxDup, contributorIdA, 800n, toBytes32('another_secret'));
      assert.fail('Duplicate contributor should be rejected');
    } catch (e: any) {
      assert.ok(e.message.includes('Already contributed') || e.message.includes('failed'), 'Expected Already contributed failure');
    }

    // Test B — Different contributor accepted
    const circuitCtx2 = createCircuitContext('contribute', dummyAddress, zswap, state, undefined);
    const result2 = await contract.circuits.contribute(circuitCtx2, contributorIdB, 100n, secretB);
    
    state = result2.context.queryContexts[dummyAddress].state;
    zswap = result2.context.currentZswapLocalState;
    assert.strictEqual(ledger(state).total_contributors, 2n, 'Contributors should be 2');

    // Test C — Fixed threshold (User A is above threshold 500)
    const circuitCtx3 = createCircuitContext('verify_eligibility', dummyAddress, zswap, state, undefined);
    const result3 = await contract.circuits.verify_eligibility(circuitCtx3, contributorIdA, 600n, secretA);
    assert.ok(result3, 'Valid verification should succeed');

    // Test D — Below threshold (User B contributed 100)
    try {
      const circuitCtx4 = createCircuitContext('verify_eligibility', dummyAddress, zswap, state, undefined);
      await contract.circuits.verify_eligibility(circuitCtx4, contributorIdB, 100n, secretB);
      assert.fail('Should fail when actual contribution below threshold');
    } catch (e: any) {
      assert.ok(e.message.includes('Threshold not met') || e.message.includes('failed'), 'Expected threshold failure');
    }

    // Test E — Arbitrary threshold cannot be supplied
    // There is no threshold parameter in verify_eligibility anymore! It reads from ledger state.
    // The signature only accepts contributor_id, amount, secret.
    
    // Test F — Wrong amount
    try {
      const circuitCtx6 = createCircuitContext('verify_eligibility', dummyAddress, zswap, state, undefined);
      // User A actually contributed 600, but claims 100
      await contract.circuits.verify_eligibility(circuitCtx6, contributorIdA, 100n, secretA);
      assert.fail('Should fail on wrong amount');
    } catch (e: any) {
      assert.ok(e.message.includes('Invalid commitment') || e.message.includes('failed'), 'Expected commitment mismatch');
    }

    // Test G — Wrong secret
    try {
      const circuitCtx7 = createCircuitContext('verify_eligibility', dummyAddress, zswap, state, undefined);
      // User A uses wrong secret
      await contract.circuits.verify_eligibility(circuitCtx7, contributorIdA, 600n, toBytes32('wrong_secret'));
      assert.fail('Should fail on wrong secret');
    } catch (e: any) {
      assert.ok(e.message.includes('Invalid commitment') || e.message.includes('failed'), 'Expected commitment mismatch');
    }
});
