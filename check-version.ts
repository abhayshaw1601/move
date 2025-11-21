import { SuiClient } from "@mysten/sui/client";

const client = new SuiClient({ url: 'https://fullnode.testnet.sui.io:443' });
const tableId = '0x82c8084a077a818d2f184a7dabe364bd11f7313c40777b3643c4f665660df362';

async function checkVersions() {
  const dynamicFields = await client.getDynamicFields({
    parentId: tableId
  });

  console.log(`Found ${dynamicFields.data.length} versions\n`);

  for (const field of dynamicFields.data.slice(0, 1)) {
    console.log('Field:', JSON.stringify(field, null, 2));
    
    const versionObj = await client.getDynamicFieldObject({
      parentId: tableId,
      name: field.name
    });
    
    console.log('\nVersion Object:', JSON.stringify(versionObj, null, 2));
  }
}

checkVersions().catch(console.error);
