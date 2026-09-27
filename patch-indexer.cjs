const fs = require('fs');

const subJsPath = 'node_modules/@midnight-ntwrk/wallet-sdk-indexer-client/dist/effect/Subscription.js';
let subJs = fs.readFileSync(subJsPath, 'utf8');

subJs = subJs.replace(
  /return SubscriptionClient\.pipe\(Stream\.flatMap\(\(client\) => client\.subscribe\(this\.document, variables\)\).*/,
  'return SubscriptionClient.pipe(Stream.flatMap((client) => client.subscribe(this.document, variables)), Stream.map((data) => JSON.parse(JSON.stringify(data).replace(/"__typename":/g, "\\"type\\":"))));'
);

fs.writeFileSync(subJsPath, subJs);
console.log('Fixed Subscription.js');
