#!/bin/bash
echo "Patching indexer-client queries to remove type: alias..."
find node_modules/@midnight-ntwrk/wallet-sdk-indexer-client/dist/graphql -type f -name "*.js" -exec sed -i '' 's/type: __typename/__typename/g' {} +
find node_modules/@midnight-ntwrk/wallet-sdk-indexer-client/dist/graphql -type f -name "*.d.ts" -exec sed -i '' 's/type: __typename/__typename/g' {} +

echo "Patching Subscription.js to map __typename to type..."
sed -i '' 's/return SubscriptionClient.pipe(Stream.flatMap((client) => client.subscribe(this.document, variables)));/return SubscriptionClient.pipe(Stream.flatMap((client) => client.subscribe(this.document, variables)), Stream.map((data) => JSON.parse(JSON.stringify(data).replace(\/\\"__typename\\":\/g, \\'"type":\\'))));/' node_modules/@midnight-ntwrk/wallet-sdk-indexer-client/dist/effect/Subscription.js

echo "Done."
