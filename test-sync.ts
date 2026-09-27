import { setNetworkId, getNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { WalletFacade } from '@midnight-ntwrk/wallet-sdk-facade';
import { ShieldedWallet } from '@midnight-ntwrk/wallet-sdk-shielded';
import { UnshieldedWallet, createKeystore, PublicKey } from '@midnight-ntwrk/wallet-sdk-unshielded-wallet';
import { DustWallet } from '@midnight-ntwrk/wallet-sdk-dust-wallet';
import { HDWallet, Roles } from '@midnight-ntwrk/wallet-sdk-hd';
import { NoOpTransactionHistoryStorage } from '@midnight-ntwrk/wallet-sdk-abstractions';
import * as ledger from '@midnight-ntwrk/ledger-v8';
import { firstValueFrom } from 'rxjs';

setNetworkId('preprod');

async function main() {
  // Generate random seed to test sync
  const randomSeed = Buffer.alloc(32);
  for(let i=0; i<32; i++) randomSeed[i] = Math.floor(Math.random() * 256);

  const hdWalletResult = HDWallet.fromSeed(randomSeed);
  if (hdWalletResult.type !== 'seedOk') throw hdWalletResult.error;
  
  const hdWallet = hdWalletResult.hdWallet;
  const keysResult = hdWallet.selectAccount(0).selectRoles([Roles.Zswap, Roles.NightExternal, Roles.Dust]).deriveKeysAt(0);
  if (keysResult.type !== 'keysDerived') throw new Error("Could not derive keys");

  const zswapKeys = ledger.ZswapSecretKeys.fromSeed(keysResult.keys[Roles.Zswap]);
  const dustKey = ledger.DustSecretKey.fromSeed(keysResult.keys[Roles.Dust]);
  const networkId = getNetworkId();
  const unshieldedKeystore = createKeystore(keysResult.keys[Roles.NightExternal], networkId);
  const unshieldedPublicKey = PublicKey.fromKeyStore(unshieldedKeystore);
  
  const indexerUrl = 'https://indexer.preprod.midnight.network/api/v4/graphql';
  const indexerWsUrl = 'wss://indexer.preprod.midnight.network/api/v4/graphql/ws';
  const proverUrl = 'http://127.0.0.1:6300';
  const nodeUrl = 'https://rpc.preprod.midnight.network';

  console.log("Initializing test wallet (Facade API)...");
  const configuration = {
    indexerClientConnection: { indexerHttpUrl: indexerUrl, indexerWsUrl: indexerWsUrl },
    nodeClientConnection: { nodeUrl },
    proofServerConnection: { proverUrl },
    provingServerUrl: new URL(proverUrl),
    txHistoryStorage: new NoOpTransactionHistoryStorage(),
    costParameters: { feeBlocksMargin: 10 },
    networkId,
    relayURL: nodeUrl as any,
    batchUpdates: { size: 5000, spacing: 0 }
  };

  const wallet = await WalletFacade.init({
    configuration,
    shielded: (config) => ShieldedWallet(config).startWithSecretKeys(zswapKeys),
    unshielded: (config) => UnshieldedWallet(config).startWithPublicKey(unshieldedPublicKey),
    dust: (config) => DustWallet(config).startWithSecretKey(dustKey, ledger.LedgerParameters.initialParameters().dust),
  });

  await wallet.start(zswapKeys, dustKey);
  console.log("Waiting for wallet state to sync...");

  const syncDebug = setInterval(async () => {
    try {
      const state = await firstValueFrom(wallet.state());
      console.log("SYNC:", {
        shielded: state.shielded.progress,
        unshielded: state.unshielded.progress,
        dust: state.dust.progress,
      });
    } catch(e) {}
  }, 2000);

  let syncSuccess = false;
  try {
    // Timeout after 30 seconds if it hangs
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Sync timeout')), 30000));
    await Promise.race([wallet.waitForSyncedState(), timeout]);
    console.log("Wallet synced.");
    syncSuccess = true;
  } catch(e) {
    console.error("Sync failed:", e);
  } finally {
    clearInterval(syncDebug);
    await wallet.stop();
  }
  
  if(syncSuccess) process.exit(0);
  else process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
