import test from 'node:test';
import assert from 'node:assert';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { Contract } from '../managed/proofpool/contract/index.js';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { WalletBuilder } from '@midnight-ntwrk/wallet';
import * as zswap from '@midnight-ntwrk/zswap';
import { CompiledContract } from '@midnight-ntwrk/compact-js';
import { pipe } from 'effect';
import path from 'path';
import { firstValueFrom } from 'rxjs';

function toBytes32(str: string): Uint8Array {
  const buf = Buffer.alloc(32);
  buf.write(str, 0, 'utf8');
  return new Uint8Array(buf);
}

test('Integration Test', async () => {
  if (process.env.MIDNIGHT_NETWORK !== 'preprod' || !process.env.MIDNIGHT_WALLET_SEED || !process.env.VITE_PROOFPOOL_CONTRACT_ADDRESS) {
      console.log("Skipping integration test due to missing env variables");
      return;
  }

  setNetworkId('preprod');

  const seed = process.env.MIDNIGHT_WALLET_SEED;
  const contractAddress = process.env.VITE_PROOFPOOL_CONTRACT_ADDRESS;

  const indexerUrl = 'https://indexer.preprod.midnight.network/api/v3/graphql';
  const indexerWsUrl = 'wss://indexer.preprod.midnight.network/api/v3/graphql/ws';
  const proverUrl = 'http://127.0.0.1:6300';
  const nodeUrl = 'https://rpc.preprod.midnight.network';

  const publicDataProvider = indexerPublicDataProvider(indexerUrl, indexerWsUrl);
  const zkConfigProvider = new NodeZkConfigProvider(path.resolve('./managed/proofpool'));
  const proofProvider = httpClientProofProvider(proverUrl, zkConfigProvider as any);

  const wallet = await WalletBuilder.build(
    indexerUrl,
    indexerWsUrl,
    proverUrl,
    nodeUrl,
    seed,
    zswap.NetworkId.TestNet,
    'warn'
  );

  wallet.start();
  
  const walletState = await firstValueFrom(wallet.state());

  const patchedWallet = Object.create(wallet);
  patchedWallet.balanceTx = async (tx: any, _ttl?: Date) => {
    return await wallet.balanceTransaction(tx, []);
  };
  patchedWallet.getCoinPublicKey = () => walletState.coinPublicKey;
  patchedWallet.getEncryptionPublicKey = () => walletState.encryptionPublicKey;
  patchedWallet.submitTx = async (tx: any) => {
    const txHash = await wallet.submitTransaction(tx);
    return txHash;
  };

  const providers = {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: 'integration-test-wallet-state',
      privateStoragePasswordProvider: async () => process.env.MIDNIGHT_WALLET_PASSWORD || 'integration_password',
      accountId: 'integration-tester'
    }),
    publicDataProvider,
    zkConfigProvider,
    proofProvider,
    walletProvider: patchedWallet, 
  };

  try {
    const contract = await findDeployedContract(providers as any, {
      contractAddress,
      compiledContract: pipe(CompiledContract.make('proofpool', Contract as any), CompiledContract.withVacantWitnesses) as any
    });

    const stateBefore = await publicDataProvider.queryContractState(contractAddress);
    const aggBefore = stateBefore?.data?.total_contributors ? BigInt(stateBefore.data.total_contributors) : 0n;

    console.log("Calling contribute()...");
    const cid = toBytes32(Date.now().toString());
    const secret = toBytes32("integration_secret");
    const result = await contract.callTx.contribute(cid, 500n, secret);
    console.log("Tx Hash:", result.public.txHash);
    
    assert.ok(result.public.txHash, "Transaction hash must exist");

    let stateAfter;
    let attempts = 0;
    while (attempts < 10) {
      await new Promise(r => setTimeout(r, 5000));
      stateAfter = await publicDataProvider.queryContractState(contractAddress);
      const aggAfter = stateAfter?.data?.total_contributors ? BigInt(stateAfter.data.total_contributors) : 0n;
      if (aggAfter > aggBefore) {
        break;
      }
      attempts++;
    }

    const aggAfter = stateAfter?.data?.total_contributors ? BigInt(stateAfter.data.total_contributors) : 0n;
    assert.ok(aggAfter > aggBefore, "ProofPool total_contributors must have increased");

  } finally {
    await wallet.close();
  }
});
