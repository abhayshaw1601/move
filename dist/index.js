#!/usr/bin/env node
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
const commander_1 = require("commander");
const path = __importStar(require("path"));
const readline = __importStar(require("readline"));
const config_1 = require("./config");
const walrus_1 = require("./walrus");
const sui_1 = require("./sui");
const transactions_1 = require("@mysten/sui/transactions");
const program = new commander_1.Command();
async function prompt(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer.trim());
        });
    });
}
program
    .name("provenance")
    .description("ProvenancePro CLI - AI Model Provenance and Marketplace Platform")
    .version("0.1.0")
    .option("-c, --config <path>", "Configuration file path (default: ~/.provenance/config.json)");
program
    .command("commit")
    .description("Commit AI model version with metrics to blockchain")
    .requiredOption("--repo <id>", "Repository object ID")
    .requiredOption("--cap <id>", "RepoCap object ID for this repository")
    .requiredOption("--branch <name>", "Branch name (e.g. main)")
    .requiredOption("--message <msg>", "Commit message")
    .requiredOption("--file <path>", "Path to model file to shard and upload")
    .option("--deps <ids>", "Comma-separated dependency repository IDs")
    .option("--accuracy <val>", "Accuracy metric, e.g. 98.5")
    .option("--loss <val>", "Loss metric, e.g. 0.02")
    .option("--epochs <val>", "Epoch count, e.g. 100")
    .option("--f1-score <val>", "F1-score, e.g. 0.92")
    .action(async (cmd) => {
    const globalOpts = program.opts();
    const cfg = await (0, config_1.loadConfig)(globalOpts.config);
    const opts = cmd.opts();
    const filePath = path.resolve(opts.file);
    console.log("🔄 Uploading shards to Walrus:", filePath);
    const shards = await (0, walrus_1.uploadShards)(filePath, cfg);
    const totalSize = shards.reduce((sum, s) => sum + s.sizeBytes, 0);
    console.log(`✅ Uploaded ${shards.length} shard(s), total size ${totalSize} bytes`);
    const encoder = new TextEncoder();
    // Metrics map with interactive prompts for missing ones
    const metrics = {};
    const accuracy = opts.accuracy ?? (await prompt("Accuracy (%): "));
    const loss = opts.loss ?? (await prompt("Loss: "));
    const epochs = opts.epochs ?? (await prompt("Epochs: "));
    const f1 = opts["f1-score"] ?? (await prompt("F1-Score: "));
    if (accuracy)
        metrics["Accuracy"] = accuracy;
    if (loss)
        metrics["Loss"] = loss;
    if (epochs)
        metrics["Epochs"] = epochs;
    if (f1)
        metrics["F1-Score"] = f1;
    const metricKeysBytes = Object.keys(metrics).map((k) => Array.from(encoder.encode(k)));
    const metricValsBytes = Object.values(metrics).map((v) => Array.from(encoder.encode(v)));
    const shardIdBytes = shards.map((s) => Array.from(encoder.encode(s.blobId)));
    const deps = opts.deps
        ? opts.deps.split(",").map((d) => d.trim()).filter(Boolean)
        : [];
    const branchBytes = Array.from(encoder.encode(opts.branch));
    const msgBytes = Array.from(encoder.encode(opts.message));
    const rootBlobBytes = Array.from(encoder.encode(shards[0]?.blobId ?? ""));
    const pkg = (0, sui_1.getPackageId)();
    const client = (0, sui_1.getSuiClient)(cfg);
    const keypair = (0, sui_1.getKeypairFromEnv)();
    const tx = new transactions_1.Transaction();
    tx.setGasBudget(100000000n);
    // For now we don't track parents; dependencies come from --deps
    const parentIdsArg = tx.pure.vector("id", []);
    const depsArg = tx.pure.vector("id", deps);
    const metricsKeysArg = metricKeysBytes.length
        ? tx.pure.vector("vector<u8>", metricKeysBytes)
        : tx.pure.vector("vector<u8>", []);
    const metricsValsArg = metricValsBytes.length
        ? tx.pure.vector("vector<u8>", metricValsBytes)
        : tx.pure.vector("vector<u8>", []);
    const shardIdsArg = tx.pure.vector("vector<u8>", shardIdBytes);
    tx.moveCall({
        target: `${pkg}::version_fs::commit`,
        arguments: [
            tx.object(opts.repo),
            tx.object(opts.cap),
            tx.pure.vector("u8", branchBytes),
            tx.pure.vector("u8", rootBlobBytes),
            parentIdsArg, // parent_ids
            tx.pure.vector("u8", msgBytes),
            metricsKeysArg,
            metricsValsArg,
            shardIdsArg,
            depsArg, // dependencies
            tx.pure.u64(BigInt(totalSize)),
        ],
    });
    console.log("📤 Submitting commit transaction to Sui...");
    const result = await client.signAndExecuteTransaction({
        signer: keypair,
        transaction: tx,
        options: {
            showEffects: true,
            showEvents: true,
        },
    });
    console.log("✅ Commit transaction digest:", result.digest);
});
program
    .command("log")
    .description("Display repository version history and metrics")
    .requiredOption("--repo-name <name>", "Repository (model) name to display")
    .action(async (cmd) => {
    const globalOpts = program.opts();
    const cfg = await (0, config_1.loadConfig)(globalOpts.config);
    const opts = cmd.opts();
    // TODO: Wire this to real Sui events / objects. For now, use a minimal
    // placeholder that demonstrates formatting semantics validated by
    // property tests.
    const now = Date.now();
    const logMod = await Promise.resolve().then(() => __importStar(require("./log")));
    const renderLog = logMod.renderLog;
    const commits = [
        {
            versionId: "0xversion1",
            author: "0xauthor1",
            timestampMs: now - 1000,
            message: "Initial commit",
            repoName: opts.repoName,
            walrusRootBlobId: "blob-1",
            metrics: { Accuracy: "98.5", Loss: "0.02", Epochs: "100" },
            shardCount: 3,
            totalSizeBytes: 4500000000,
            dependencies: [],
        },
    ];
    const output = renderLog(commits, opts.repoName);
    console.log(output);
});
program
    .command("audit-report")
    .description("Generate comprehensive audit report with performance analytics")
    .requiredOption("--repo <id>", "Repository object ID to audit")
    .action(async (cmd) => {
    const globalOpts = program.opts();
    const cfg = await (0, config_1.loadConfig)(globalOpts.config);
    const opts = cmd.opts();
    const auditMod = await Promise.resolve().then(() => __importStar(require("./commands/audit-report")));
    const { executeAuditReport } = auditMod;
    const client = (0, sui_1.getSuiClient)(cfg);
    try {
        await executeAuditReport({
            repoId: opts.repo,
            client,
            config: cfg
        });
    }
    catch (error) {
        console.error(`❌ Quantum audit failed: ${error}`);
        process.exit(1);
    }
});
program
    .command("storefront")
    .description("Browse AI model marketplace and repository listings")
    .action(async () => {
    const globalOpts = program.opts();
    const cfg = await (0, config_1.loadConfig)(globalOpts.config);
    const { renderStorefrontTable } = await Promise.resolve().then(() => __importStar(require("./storefront")));
    // TODO: Replace with real on-chain repository query. For now, a sample.
    const rows = [
        {
            modelName: "GPT-4-Replica",
            author: "0xABC...",
            totalSizeBytes: 4500000000,
            trustScore: 95,
            priceMist: 100000000000n,
        },
        {
            modelName: "BERT-Fine-Tuned",
            author: "0xDEF...",
            totalSizeBytes: 1200000000,
            trustScore: 12,
            priceMist: 0n,
        },
    ];
    const table = renderStorefrontTable(rows);
    console.log(table);
});
program
    .command("pull")
    .description("Download AI model with payment processing if required")
    .requiredOption("--repo <id>", "Repository object ID to extract from")
    .requiredOption("--output <dir>", "Output directory to materialize the model")
    .action(async (cmd) => {
    const globalOpts = program.opts();
    const cfg = await (0, config_1.loadConfig)(globalOpts.config);
    const opts = cmd.opts();
    const pullMod = await Promise.resolve().then(() => __importStar(require("./commands/pull")));
    const { executePull } = pullMod;
    const pkg = (0, sui_1.getPackageId)();
    const client = (0, sui_1.getSuiClient)(cfg);
    const keypair = (0, sui_1.getKeypairFromEnv)();
    try {
        await executePull({
            repoId: opts.repo,
            outputDir: opts.output,
            config: cfg,
            client,
            keypair,
            packageId: pkg
        });
    }
    catch (error) {
        console.error(`❌ Neural extraction failed: ${error}`);
        process.exit(1);
    }
});
program
    .command("inspect")
    .description("Analyze repository dependencies and lineage")
    .requiredOption("--repo <id>", "Repository object ID to inspect")
    .option("--max-depth <num>", "Maximum dependency depth to traverse", "5")
    .action(async (cmd) => {
    const globalOpts = program.opts();
    const cfg = await (0, config_1.loadConfig)(globalOpts.config);
    const opts = cmd.opts();
    const inspectMod = await Promise.resolve().then(() => __importStar(require("./inspect")));
    const { inspectRepository } = inspectMod;
    const client = (0, sui_1.getSuiClient)(cfg);
    await inspectRepository({
        repoId: opts.repo,
        client,
        maxDepth: parseInt(opts.maxDepth)
    });
});
program
    .command("verify")
    .description("Execute TEE verification and generate trust score")
    .requiredOption("--repo <id>", "Repository object ID to verify")
    .option("--version <id>", "Specific version ID to verify (defaults to latest)")
    .action(async (cmd) => {
    const globalOpts = program.opts();
    const cfg = await (0, config_1.loadConfig)(globalOpts.config);
    const opts = cmd.opts();
    const verifyMod = await Promise.resolve().then(() => __importStar(require("./verify")));
    const { verifyRepository } = verifyMod;
    const pkg = (0, sui_1.getPackageId)();
    const client = (0, sui_1.getSuiClient)(cfg);
    const keypair = (0, sui_1.getKeypairFromEnv)();
    try {
        const result = await verifyRepository({
            repoId: opts.repo,
            versionId: opts.version,
            client,
            keypair,
            packageId: pkg,
            config: cfg
        });
        console.log("\n✅ Verification Complete!");
        console.log(`   Transaction: ${result.transactionDigest}`);
        console.log(`   New Trust Score: ${result.newTrustScore}`);
        if (result.auditReportPath) {
            console.log(`   Audit Report: ${result.auditReportPath}`);
        }
    }
    catch (error) {
        console.error(`❌ Verification failed: ${error}`);
        process.exit(1);
    }
});
(async () => {
    await (0, config_1.ensureConfigFile)(program.opts().config);
    program.parseAsync(process.argv);
})();
