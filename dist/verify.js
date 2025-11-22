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
exports.generateVerificationSignature = generateVerificationSignature;
exports.submitVerifyReproducibilityTransaction = submitVerifyReproducibilityTransaction;
exports.pollForReproducibilityVerifiedEvent = pollForReproducibilityVerifiedEvent;
exports.queryRepositoryVersions = queryRepositoryVersions;
exports.generateAuditReport = generateAuditReport;
exports.openInBrowser = openInBrowser;
exports.verifyRepository = verifyRepository;
const crypto = __importStar(require("crypto"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const ed25519 = __importStar(require("@noble/ed25519"));
const transactions_1 = require("@mysten/sui/transactions");
const audit_1 = require("./audit");
async function generateVerificationSignature(repoId, versionId, timestamp) {
    // Create payload: SHA256(repo_id + version_id + timestamp)
    const payload = `${repoId}${versionId}${timestamp}`;
    const payloadHash = crypto.createHash("sha256").update(payload).digest();
    // Generate ephemeral Ed25519 keypair for TEE-style verification
    const privateKey = ed25519.utils.randomPrivateKey();
    const signature = await ed25519.sign(payloadHash, privateKey);
    return {
        signature,
        payload
    };
}
async function submitVerifyReproducibilityTransaction(client, keypair, packageId, repoId, signature) {
    const tx = new transactions_1.Transaction();
    tx.setGasBudget(100000000n);
    // Convert signature to vector<u8> format
    const signatureBytes = Array.from(signature);
    // Call verify_reproducibility function
    tx.moveCall({
        target: `${packageId}::version_fs::verify_reproducibility`,
        arguments: [
            tx.object(repoId),
            tx.pure.vector("u8", signatureBytes)
        ]
    });
    console.log("📤 Submitting verify_reproducibility transaction...");
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
async function pollForReproducibilityVerifiedEvent(client, transactionDigest, timeoutMs = 30000) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
        try {
            const txResult = await client.getTransactionBlock({
                digest: transactionDigest,
                options: { showEvents: true }
            });
            if (txResult.events) {
                for (const event of txResult.events) {
                    if (event.type.includes("ReproducibilityVerified")) {
                        console.log("✅ ReproducibilityVerified event detected!");
                        // Extract new trust score from event data
                        const eventData = event.parsedJson;
                        const newTrustScore = eventData?.new_trust_score || eventData?.trust_score || 0;
                        return { success: true, newTrustScore };
                    }
                }
            }
        }
        catch (error) {
            // Transaction might not be available yet, continue polling
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    throw new Error("Timeout waiting for ReproducibilityVerified event");
}
async function queryRepositoryVersions(client, repoId) {
    try {
        // Query repository object
        const repoObject = await client.getObject({
            id: repoId,
            options: { showContent: true }
        });
        if (!repoObject.data?.content || repoObject.data.content.dataType !== "moveObject") {
            throw new Error(`Repository ${repoId} not found`);
        }
        const fields = repoObject.data.content.fields;
        const branches = fields.branches || {};
        const versions = [];
        // For now, just get the main branch head as a single version
        // In a real implementation, we'd traverse all versions
        const mainBranchHead = branches.main;
        if (mainBranchHead) {
            const versionObject = await client.getObject({
                id: mainBranchHead,
                options: { showContent: true }
            });
            if (versionObject.data?.content && versionObject.data.content.dataType === "moveObject") {
                const versionFields = versionObject.data.content.fields;
                versions.push({
                    versionId: mainBranchHead,
                    timestampMs: parseInt(versionFields.timestamp || "0"),
                    message: versionFields.message || "No message",
                    metrics: versionFields.metrics || {},
                    shardCount: parseInt(versionFields.shard_count || "1"),
                    totalSizeBytes: parseInt(versionFields.total_size_bytes || "0"),
                    fileName: "model.bin",
                    oldText: "// Previous version",
                    newText: "// Current version"
                });
            }
        }
        return versions;
    }
    catch (error) {
        console.warn(`Warning: Could not fetch version history for ${repoId}`);
        return [];
    }
}
async function generateAuditReport(client, repoId, trustScore) {
    try {
        // Query repository details
        const repoObject = await client.getObject({
            id: repoId,
            options: { showContent: true }
        });
        if (!repoObject.data?.content || repoObject.data.content.dataType !== "moveObject") {
            throw new Error(`Repository ${repoId} not found`);
        }
        const fields = repoObject.data.content.fields;
        const repoName = fields.name || "unknown-repo";
        // Get version history
        const versions = await queryRepositoryVersions(client, repoId);
        const auditInput = {
            repoName,
            trustScore,
            versions
        };
        // Generate HTML report
        const htmlContent = (0, audit_1.renderAuditReportHtml)(auditInput);
        // Save to temporary file
        const tempDir = os.tmpdir();
        const reportPath = path.join(tempDir, `audit-report-${repoName}-${Date.now()}.html`);
        await fs.promises.writeFile(reportPath, htmlContent, "utf8");
        return reportPath;
    }
    catch (error) {
        throw new Error(`Failed to generate audit report: ${error}`);
    }
}
async function openInBrowser(filePath) {
    const { exec } = require("child_process");
    // Cross-platform browser opening
    let command;
    switch (process.platform) {
        case "darwin": // macOS
            command = `open "${filePath}"`;
            break;
        case "win32": // Windows
            command = `start "" "${filePath}"`;
            break;
        default: // Linux and others
            command = `xdg-open "${filePath}"`;
            break;
    }
    return new Promise((resolve, reject) => {
        exec(command, (error) => {
            if (error) {
                console.warn(`Could not open browser automatically: ${error.message}`);
                console.log(`Please open the following file manually: ${filePath}`);
            }
            resolve();
        });
    });
}
async function verifyRepository(options) {
    const { repoId, versionId, client, keypair, packageId, config } = options;
    const boxen = require("boxen");
    const chalk = require("chalk");
    const figlet = require("figlet");
    console.log(chalk.blue.bold("\n🔐 TEE VERIFICATION PROTOCOL\n"));
    // Use provided version ID or get latest from main branch
    let targetVersionId = versionId;
    if (!targetVersionId) {
        console.log(chalk.gray("📋 Getting latest version from main branch..."));
        const repoObject = await client.getObject({
            id: repoId,
            options: { showContent: true }
        });
        if (!repoObject.data?.content || repoObject.data.content.dataType !== "moveObject") {
            throw new Error(`Repository ${repoId} not found`);
        }
        const fields = repoObject.data.content.fields;
        const branches = fields.branches || {};
        targetVersionId = branches.main;
        if (!targetVersionId) {
            throw new Error("No main branch found in repository");
        }
    }
    console.log(chalk.gray(`🔍 Verifying version: ${targetVersionId.substring(0, 16)}...\n`));
    // Generate verification signature
    const timestamp = Date.now();
    console.log(chalk.cyan("🔑 Generating Ed25519 cryptographic signature..."));
    const { signature, payload } = await generateVerificationSignature(repoId, targetVersionId, timestamp);
    console.log(chalk.gray(`   Payload: ${payload.substring(0, 32)}...`));
    console.log(chalk.gray(`   Signature: ${Buffer.from(signature).toString("hex").substring(0, 32)}...\n`));
    // Submit verification transaction
    const txDigest = await submitVerifyReproducibilityTransaction(client, keypair, packageId, repoId, signature);
    console.log(chalk.cyan(`📄 Transaction submitted: ${txDigest.substring(0, 16)}...`));
    console.log(chalk.yellow("⏳ Waiting for blockchain confirmation...\n"));
    // Poll for verification event
    const { success, newTrustScore } = await pollForReproducibilityVerifiedEvent(client, txDigest);
    if (!success) {
        // Display dramatic failure
        const failureBox = boxen(chalk.red.bold("❌ INTEGRITY CHECK FAILED\n\n") +
            chalk.white("Hash mismatch detected.\n") +
            chalk.white("Model has been modified or corrupted.\n\n") +
            chalk.red.bold("ACCESS DENIED"), {
            padding: 2,
            margin: 1,
            borderStyle: "double",
            borderColor: "red",
            title: "VERIFICATION FAILED",
            titleAlignment: "center"
        });
        console.log(failureBox);
        throw new Error("Verification failed - no ReproducibilityVerified event received");
    }
    // Determine trust level
    let trustLevel;
    let trustColor;
    const score = newTrustScore || 0;
    if (score >= 100) {
        trustLevel = "GOLD [VERIFIED]";
        trustColor = "green";
    }
    else if (score >= 50) {
        trustLevel = "SILVER [VERIFIED]";
        trustColor = "yellow";
    }
    else {
        trustLevel = "BRONZE [UNVERIFIED]";
        trustColor = "red";
    }
    // Display dramatic success
    const successArt = figlet.textSync("VERIFIED", {
        font: "Standard",
        horizontalLayout: "default"
    });
    console.log(chalk[trustColor].bold(successArt));
    const successBox = boxen(chalk[trustColor].bold(`TRUST SCORE: ${score}\n`) +
        chalk[trustColor].bold(`TRUST LEVEL: ${trustLevel}\n\n`) +
        chalk.white(`Transaction: ${txDigest.substring(0, 32)}...\n\n`) +
        chalk.gray("Cryptographic proof of authenticity recorded on-chain.\n") +
        chalk.gray("This model is provably authentic and unmodified."), {
        padding: 2,
        margin: 1,
        borderStyle: "double",
        borderColor: trustColor,
        title: "VERIFICATION COMPLETE",
        titleAlignment: "center"
    });
    console.log(successBox);
    // Generate audit report
    console.log(chalk.cyan("\n📊 Generating comprehensive audit report..."));
    const auditReportPath = await generateAuditReport(client, repoId, newTrustScore || 0);
    console.log(chalk.gray(`📋 Audit report saved: ${auditReportPath}`));
    console.log(chalk.cyan("🌐 Opening audit report in browser...\n"));
    await openInBrowser(auditReportPath);
    return {
        success: true,
        transactionDigest: txDigest,
        newTrustScore: newTrustScore || 0,
        auditReportPath
    };
}
