import { SuiClient } from "@mysten/sui/client";

const client = new SuiClient({ url: 'https://fullnode.testnet.sui.io:443' });
const repoId = '0xcca7201e5c22e0c4f8f3686e634e26e1f0638d51168410a35622653ea7f269a4';

async function checkRepo() {
  const repo = await client.getObject({
    id: repoId,
    options: { showContent: true }
  });

  console.log(JSON.stringify(repo, null, 2));
}

checkRepo().catch(console.error);
