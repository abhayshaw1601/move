"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryRepositoryInfo = queryRepositoryInfo;
exports.generatePaymentQRCode = generatePaymentQRCode;
exports.submitBuyAccessTransaction = submitBuyAccessTransaction;
exports.pollForAccessPurchasedEvent = pollForAccessPurchasedEvent;
exports.getLatestVersionShards = getLatestVersionShards;
exports.pullRepository = pullRepository;
const path = __importStar(require("path"));
const transactions_1 = require("@mysten/sui/transactions");
const walrus_1 = require("./walrus");
async function queryRepositoryInfo(client, repoId) {
    // Query repository object from Sui
    const repoObject = await client.getObject({
        id: repoId,
        options: { showContent: true }
    });
    if (!repoObject.data?.content || repoObject.data.content.dataType !== "moveObject") {
        throw new Error(`Repository ${repoId} not found or invalid`);
    }
    const fields = repoObject.data.content.fields;
    return {
        id: repoId,
        name: fields.name || "unknown",
        owner: fields.owner || "0x0",
        price: BigInt(fields.price || "0"),
        trustScore: parseInt(fields.trust_score || "0")
    };
}
function generatePaymentQRCode(repoInfo) {
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
║  Price: ${(Number(repoInfo.price) / 1000000000).toFixed(2)} SUI                    ║
║  Repository: ${repoInfo.name.padEnd(20)}║
║                                      ║
║  Payment URL: ${paymentUrl}
║                                      ║
╚══════════════════════════════════════╝
`;
}
async function submitBuyAccessTransaction(client, keypair, packageId, repoId, price) {
    const tx = new transactions_1.Transaction();
    tx.setGasBudget(100000000n);
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
async function pollForAccessPurchasedEvent(client, transactionDigest, timeoutMs = 30000) {
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
        }
        catch (error) {
            // Transaction might not be available yet, continue polling
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    throw new Error("Timeout waiting for AccessPurchased event");
}
async function getLatestVersionShards(client, repoId) {
    // Query the repository to get the latest version
    const repoObject = await client.getObject({
        id: repoId,
        options: { showContent: true }
    });
    if (!repoObject.data?.content || repoObject.data.content.dataType !== "moveObject") {
        throw new Error(`Repository ${repoId} not found`);
    }
    const fields = repoObject.data.content.fields;
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
    const versionFields = versionObject.data.content.fields;
    const shardIds = versionFields.model_shards || [];
    const totalSize = parseInt(versionFields.total_size_bytes || "0");
    // Convert to ShardInfo format
    return shardIds.map((shardId, index) => ({
        index,
        blobId: shardId,
        sizeBytes: Math.floor(totalSize / shardIds.length), // Approximate size per shard
        sha256: "" // We don't have the hash stored, but download will verify
    }));
}
async function pullRepository(options) {
    const { repoId, outputDir, config, client, keypair, packageId } = options;
    console.log(`🔍 Querying repository ${repoId}...`);
    const repoInfo = await queryRepositoryInfo(client, repoId);
    console.log(`📋 Repository: ${repoInfo.name}`);
    console.log(`👤 Owner: ${repoInfo.owner}`);
    console.log(`⭐ Trust Score: ${repoInfo.trustScore}`);
    console.log(`💰 Price: ${repoInfo.price === 0n ? "FREE" : `${Number(repoInfo.price) / 1000000000} SUI`}`);
    // Check if payment is required
    if (repoInfo.price > 0n) {
        console.log("\n💳 This is a premium repository. Payment required.");
        console.log(generatePaymentQRCode(repoInfo));
        console.log("🔄 Processing payment...");
        const txDigest = await submitBuyAccessTransaction(client, keypair, packageId, repoId, repoInfo.price);
        console.log(`📄 Transaction: ${txDigest}`);
        console.log("⏳ Waiting for payment confirmation...");
        await pollForAccessPurchasedEvent(client, txDigest);
    }
    else {
        console.log("🆓 This repository is free to access.");
    }
    console.log("📦 Fetching model shards...");
    const shards = await getLatestVersionShards(client, repoId);
    console.log(`📥 Downloading ${shards.length} shard(s)...`);
    const outputPath = path.join(outputDir, `${repoInfo.name}.model`);
    await (0, walrus_1.downloadShards)(shards, outputPath, config);
    console.log(`✅ Model saved to: ${outputPath}`);
}
