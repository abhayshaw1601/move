import * as fs from "fs";
import * as path from "path";
import { SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { downloadShards, ShardInfo } from "./walrus";
import { ProvenanceConfig } from "./config";

export interface RepositoryInfo {
  id: string;
  name: string;
  owner: string;
  price: bigint;
  trustScore: number;
}

export interface PullOptions {
  repoId: string;
  outputDir: string;
  config: ProvenanceConfig;
  client: SuiClient;
  keypair: Ed25519Keypair;
  packageId: string;
}

export async function queryRepositoryInfo(
  client: SuiClient,
  repoId: string
): Promise<RepositoryInfo> {
  // Query repository object from Sui
  const repoObject = await client.getObject({
    id: repoId,
    options: { showContent: true }
  });

  if (!repoObject.data?.content || repoObject.data.content.dataType !== "moveObject") {
    throw new Error(`Repository ${repoId} not found or invalid`);
  }

  const fields = (repoObject.data.content as any).fields;
  
  return {
    id: repoId,
    name: fields.name || "unknown",
    owner: fields.owner || "0x0",
    price: BigInt(fields.price || "0"),
    trustScore: parseInt(fields.trust_score || "0")
  };
}

export function generatePaymentQRCode(repoInfo: RepositoryInfo): string {
  // Generate a simple text-based QR code representation
  // In a real implementation, this would generate an actual QR code image
  const paymentUrl = `sui://pay?to=${repoInfo.owner}&amount=${repoInfo.price}&memo=Access`;
  
  return `
╔══════════════════════════════════════╗
║              PAYMENT QR              ║
║                                      ║
║  ████ ██ ████ ██ ████ ██ ████ ██    ║
║  ██ ████ ██ ████ ██ ████ ██ ████    ║
║  ████ ██ ████ ██ ████ ██ ████ ██    ║
║  ██ ████ ██ ████ ██ ████ ██ ████    ║
║  ████ ██ ████ ██ ████ ██ ████ ██    ║
║                                      ║
║  Price: ${(Number(repoInfo.price) / 1_000_000_000).toFixed(2)} SUI                    ║
║  Repository: ${repoInfo.name.padEnd(20)}║
║                                      ║
║  Payment URL: ${paymentUrl}
║                                      ║
╚══════════════════════════════════════╝
`;
}

export async function submitBuyAccessTransaction(
  client: SuiClient,
  keypair: Ed25519Keypair,
  packageId: string,
  repoId: string,
  price: bigint
): Promise<string> {
  const tx = new Transaction();
  tx.setGasBudget(100_000_000n);

  // Create payment coin
  const [coin] = tx.splitCoins(tx.gas, [price]);

  // Call buy_access function
  tx.moveCall({
    target: `${packageId}::version_fs::buy_access`,
    arguments: [
      tx.object(repoId),
      coin
    ]
  });

  console.log("📤 Submitting buy_access transaction...");
  const result = await client.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    options: {
      showEffects: true,
      showEvents: true
    }
  });

  return result.digest;
}

export async function pollForAccessPurchasedEvent(
  client: SuiClient,
  transactionDigest: string,
  timeoutMs: number = 30000
): Promise<boolean> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    try {
      const txResult = await client.getTransactionBlock({
        digest: transactionDigest,
        options: { showEvents: true }
      });

      if (txResult.events) {
        for (const event of txResult.events) {
          if (event.type.includes("AccessPurchased")) {
            console.log("✅ AccessPurchased event detected!");
            return true;
          }
        }
      }
    } catch (error) {
      // Transaction might not be available yet, continue polling
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  throw new Error("Timeout waiting for AccessPurchased event");
}

export async function getLatestVersionShards(
  client: SuiClient,
  repoId: string
): Promise<ShardInfo[]> {
  // Query the repository to get the latest version
  const repoObject = await client.getObject({
    id: repoId,
    options: { showContent: true }
  });

  if (!repoObject.data?.content || repoObject.data.content.dataType !== "moveObject") {
    throw new Error(`Repository ${repoId} not found`);
  }

  const fields = (repoObject.data.content as any).fields;
  const branches = fields.branches || {};
  
  // Get main branch head (assuming it exists)
  const mainBranchHead = branches.main;
  if (!mainBranchHead) {
    throw new Error("No main branch found in repository");
  }

  // Query the version object to get shards
  const versionObject = await client.getObject({
    id: mainBranchHead,
    options: { showContent: true }
  });

  if (!versionObject.data?.content || versionObject.data.content.dataType !== "moveObject") {
    throw new Error(`Version ${mainBranchHead} not found`);
  }

  const versionFields = (versionObject.data.content as any).fields;
  const shardIds = versionFields.model_shards || [];
  const totalSize = parseInt(versionFields.total_size_bytes || "0");

  // Convert to ShardInfo format
  return shardIds.map((shardId: string, index: number) => ({
    index,
    blobId: shardId,
    sizeBytes: Math.floor(totalSize / shardIds.length), // Approximate size per shard
    sha256: "" // We don't have the hash stored, but download will verify
  }));
}

export async function pullRepository(options: PullOptions): Promise<void> {
  const { repoId, outputDir, config, client, keypair, packageId } = options;

  console.log(`🔍 Querying repository ${repoId}...`);
  const repoInfo = await queryRepositoryInfo(client, repoId);
  
  console.log(`📋 Repository: ${repoInfo.name}`);
  console.log(`👤 Owner: ${repoInfo.owner}`);
  console.log(`⭐ Trust Score: ${repoInfo.trustScore}`);
  console.log(`💰 Price: ${repoInfo.price === 0n ? "FREE" : `${Number(repoInfo.price) / 1_000_000_000} SUI`}`);

  // Check if payment is required
  if (repoInfo.price > 0n) {
    console.log("\n💳 This is a premium repository. Payment required.");
    console.log(generatePaymentQRCode(repoInfo));
    
    console.log("🔄 Processing payment...");
    const txDigest = await submitBuyAccessTransaction(
      client,
      keypair,
      packageId,
      repoId,
      repoInfo.price
    );
    
    console.log(`📄 Transaction: ${txDigest}`);
    console.log("⏳ Waiting for payment confirmation...");
    
    await pollForAccessPurchasedEvent(client, txDigest);
  } else {
    console.log("🆓 This repository is free to access.");
  }

  console.log("📦 Fetching model shards...");
  const shards = await getLatestVersionShards(client, repoId);
  
  console.log(`📥 Downloading ${shards.length} shard(s)...`);
  const outputPath = path.join(outputDir, `${repoInfo.name}.model`);
  
  await downloadShards(shards, outputPath, config);
  
  console.log(`✅ Model saved to: ${outputPath}`);
}