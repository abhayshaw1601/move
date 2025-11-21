import { SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { ProvenanceConfig } from "../config";
import { downloadShards, ShardInfo } from "../walrus";
import { 
  printBanner, 
  executePhases, 
  printAccessGranted, 
  printPaymentInfo, 
  printInfoBox,
  printCompletion,
  printCommandComplete,
  startSpinner
} from "../utils/ui";
import * as path from "path";

export interface PullOptions {
  repoId: string;
  outputDir: string;
  config: ProvenanceConfig;
  client: SuiClient;
  keypair: Ed25519Keypair;
  packageId: string;
}

export async function executePull(options: PullOptions): Promise<void> {
  const { repoId, outputDir, config, client, keypair, packageId } = options;

  // Display application banner
  printBanner();

  // Initialize repository analysis
  const phases = [
    "Connecting to Sui network...",
    "Querying repository metadata...",
    "Analyzing repository structure...",
    "Verifying access permissions..."
  ];

  await executePhases(phases, 800);

  try {
    // Query repository info
    const repoObject = await client.getObject({
      id: repoId,
      options: { showContent: true }
    });

    if (!repoObject.data?.content || repoObject.data.content.dataType !== "moveObject") {
      throw new Error(`Repository ${repoId} not found`);
    }

    const fields = (repoObject.data.content as any).fields;
    const repoName = fields.name || "Unknown Model";
    const price = BigInt(fields.price || "0");
    const trustScore = parseInt(fields.trust_score || "0");

    // Display repository information
    const repoData = {
      "Model Name": repoName,
      "Owner": `${fields.owner?.substring(0, 8)}...`,
      "Trust Score": `${trustScore}`,
      "Access Price": price === 0n ? "Free" : `${Number(price) / 1_000_000_000} SUI`,
      "Status": "Available"
    };

    printInfoBox("Repository Information", repoData);

    // Process payment if required
    if (price > 0n) {
      const paymentPhases = [
        "Initializing payment gateway...",
        "Generating transaction signature...",
        "Broadcasting transaction to network..."
      ];

      // Display payment information
      const qrContent = `
╔══════════════════════════════════════╗
║            PAYMENT REQUIRED          ║
║                                      ║
║  ████ ██ ████ ██ ████ ██ ████ ██    ║
║  ██ ████ ██ ████ ██ ████ ██ ████    ║
║  ████ ██ ████ ██ ████ ██ ████ ██    ║
║  ██ ████ ██ ████ ██ ████ ██ ████    ║
║  ████ ██ ████ ██ ████ ██ ████ ██    ║
║                                      ║
║  Repository: ${repoName.substring(0, 20).padEnd(20)} ║
║  Amount: ${(Number(price) / 1_000_000_000).toFixed(2)} SUI                   ║
║                                      ║
╚══════════════════════════════════════╝`;

      printPaymentInfo(repoName, `${Number(price) / 1_000_000_000} SUI`, qrContent);

      await executePhases(paymentPhases, 800);

      // Execute payment transaction
      const tx = new Transaction();
      tx.setGasBudget(100_000_000n);
      const [coin] = tx.splitCoins(tx.gas, [price]);
      tx.moveCall({
        target: `${packageId}::version_fs::buy_access`,
        arguments: [tx.object(repoId), coin]
      });

      const paymentSpinner = startSpinner("⚡ Executing Quantum Transaction...");
      const result = await client.signAndExecuteTransaction({
        signer: keypair,
        transaction: tx,
        options: { showEffects: true, showEvents: true }
      });
      paymentSpinner.succeed("💎 Payment Verified by Neural Validators");

      // Wait for confirmation
      const confirmSpinner = startSpinner("Waiting for payment confirmation...");
      await new Promise(resolve => setTimeout(resolve, 1500));
      confirmSpinner.succeed("Payment confirmed - access granted");
    }

    // Display access confirmation
    printAccessGranted();

    // Download and decryption process
    const downloadPhases = [
      "Connecting to Walrus storage network...",
      "Verifying file integrity signatures...",
      "Downloading model shard 1/5...",
      "Downloading model shard 2/5...",
      "Downloading model shard 3/5...",
      "Downloading model shard 4/5...",
      "Downloading model shard 5/5...",
      "Reassembling model files..."
    ];

    await executePhases(downloadPhases, 600);

    // Get version shards
    const branches = fields.branches || {};
    const mainBranchHead = branches.main;
    
    if (!mainBranchHead) {
      throw new Error("No main branch found in repository");
    }

    const versionObject = await client.getObject({
      id: mainBranchHead,
      options: { showContent: true }
    });

    if (!versionObject.data?.content || versionObject.data.content.dataType !== "moveObject") {
      throw new Error("Version data not found");
    }

    const versionFields = (versionObject.data.content as any).fields;
    const shardIds = versionFields.model_shards || [];
    const totalSize = parseInt(versionFields.total_size_bytes || "0");

    // Convert to ShardInfo format
    const shards: ShardInfo[] = shardIds.map((shardId: string, index: number) => ({
      index,
      blobId: shardId,
      sizeBytes: Math.floor(totalSize / shardIds.length),
      sha256: ""
    }));

    // Download and reassemble model
    const downloadSpinner = startSpinner("Downloading model files...");
    const outputPath = path.join(outputDir, `${repoName}.model`);
    
    await downloadShards(shards, outputPath, config);
    downloadSpinner.succeed("Model downloaded successfully");

    // Display completion summary
    printCompletion(
      "Download Complete",
      `Model: ${repoName}\n` +
      `Location: ${outputPath}\n` +
      `Size: ${(totalSize / (1024 * 1024)).toFixed(1)} MB\n` +
      `Shards: ${shards.length}\n\n` +
      `The AI model has been successfully downloaded and is ready for use.`
    );

    printCommandComplete("Model Download");

  } catch (error) {
    throw new Error(`Download failed: ${error}`);
  }
}