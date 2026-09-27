import { Contract, ledger } from './managed/proofpool/contract/index.js';
import { createConstructorContext, createCircuitContext } from '@midnight-ntwrk/compact-runtime';

async function run() {
  const contract = new Contract({});
  const initialResult = await contract.initialState(createConstructorContext(undefined, new Uint8Array(32)), 1000n);
  const dummyAddress = '02' + Buffer.alloc(31).toString('hex');
  const circuitCtx1 = createCircuitContext('contribute', dummyAddress, initialResult.currentZswapLocalState, initialResult.currentContractState, undefined);
  const result1 = await contract.circuits.contribute(circuitCtx1, new Uint8Array(32), 500n, new Uint8Array(32));
  
  const ctx = result1.context.queryContexts[dummyAddress];
  const l = ledger(ctx.state);
  console.log('ledger total_contributors:', l.total_contributors);
}
run().catch(console.error);
