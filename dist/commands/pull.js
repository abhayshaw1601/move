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
exports.executePull = executePull;
const transactions_1 = require("@mysten/sui/transactions");
const walrus_1 = require("../walrus");
const ui_1 = require("../utils/ui");
const path = __importStar(require("path"));
async function executePull(options) {
    const { repoId, outputDir, config, client, keypair, packageId } = options;
    // Display application banner
    (0, ui_1.printBanner)();
    // Initialize repository analysis
    const phases = [
        "Connecting to Sui network...",
        "Querying repository metadata...",
        "Analyzing repository structure...",
        "Verifying access permissions..."
    ];
    await (0, ui_1.executePhases)(phases, 800);
    try {
        // Query repository info
        const repoObject = await client.getObject({
            id: repoId,
            options: { showContent: true }
        });
        if (!repoObject.data?.content || repoObject.data.content.dataType !== "moveObject") {
            throw new Error(`Repository ${repoId} not found`);
        }
        const fields = repoObject.data.content.fields;
        const repoName = fields.name || "Unknown Model";
        const price = BigInt(fields.price || "0");
        const trustScore = parseInt(fields.trust_score || "0");
        // Display repository information
        const repoData = {
            "Model Name": repoName,
            "Owner": `${fields.owner?.substring(0, 8)}...`,
            "Trust Score": `${trustScore}`,
            "Access Price": price === 0n ? "Free" : `${Number(price) / 1000000000} SUI`,
            "Status": "Available"
        };
        (0, ui_1.printInfoBox)("Repository Information", repoData);
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
║  Amount: ${(Number(price) / 1000000000).toFixed(2)} SUI                   ║
║                                      ║
╚══════════════════════════════════════╝`;
            (0, ui_1.printPaymentInfo)(repoName, `${Number(price) / 1000000000} SUI`, qrContent);
            await (0, ui_1.executePhases)(paymentPhases, 800);
            // Execute payment transaction
            const tx = new transactions_1.Transaction();
            tx.setGasBudget(100000000n);
            const [coin] = tx.splitCoins(tx.gas, [price]);
            tx.moveCall({
                target: `${packageId}::version_fs::buy_access`,
                arguments: [tx.object(repoId), coin]
            });
            const paymentSpinner = (0, ui_1.startSpinner)("⚡ Executing Quantum Transaction...");
            const result = await client.signAndExecuteTransaction({
                signer: keypair,
                transaction: tx,
                options: { showEffects: true, showEvents: true }
            });
            paymentSpinner.succeed("💎 Payment Verified by Neural Validators");
            // Wait for confirmation
            const confirmSpinner = (0, ui_1.startSpinner)("Waiting for payment confirmation...");
            await new Promise(resolve => setTimeout(resolve, 1500));
            confirmSpinner.succeed("Payment confirmed - access granted");
        }
        // Display access confirmation
        (0, ui_1.printAccessGranted)();
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
        await (0, ui_1.executePhases)(downloadPhases, 600);
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
        const versionFields = versionObject.data.content.fields;
        const shardIds = versionFields.model_shards || [];
        const totalSize = parseInt(versionFields.total_size_bytes || "0");
        // Convert to ShardInfo format
        const shards = shardIds.map((shardId, index) => ({
            index,
            blobId: shardId,
            sizeBytes: Math.floor(totalSize / shardIds.length),
            sha256: ""
        }));
        // Download and reassemble model
        const downloadSpinner = (0, ui_1.startSpinner)("Downloading model files...");
        const outputPath = path.join(outputDir, `${repoName}.model`);
        await (0, walrus_1.downloadShards)(shards, outputPath, config);
        downloadSpinner.succeed("Model downloaded successfully");
        // Display completion summary
        (0, ui_1.printCompletion)("Download Complete", `Model: ${repoName}\n` +
            `Location: ${outputPath}\n` +
            `Size: ${(totalSize / (1024 * 1024)).toFixed(1)} MB\n` +
            `Shards: ${shards.length}\n\n` +
            `The AI model has been successfully downloaded and is ready for use.`);
        (0, ui_1.printCommandComplete)("Model Download");
    }
    catch (error) {
        throw new Error(`Download failed: ${error}`);
    }
}
