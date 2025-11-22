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
    .command("create-repository")
    .description("Create a new AI model repository on blockchain")
    .requiredOption("--name <name>", "Repository name")
    .option("--price <mist>", "Price in MIST (0 for free)", "0")
    .action(async (opts) => {
    const globalOpts = program.opts();
    const cfg = await (0, config_1.loadConfig)(globalOpts.config);
    const options = opts;
    const createMod = await Promise.resolve().then(() => __importStar(require("./commands/create-repo")));
    const { executeCreateRepo } = createMod;
    const pkg = (0, sui_1.getPackageId)();
    const client = (0, sui_1.getSuiClient)(cfg);
    const keypair = (0, sui_1.getKeypairFromEnv)();
    try {
        await executeCreateRepo({
            name: options.name,
            price: options.price,
            client,
            keypair,
            packageId: pkg,
            config: cfg
        });
    }
    catch (error) {
        console.error(`❌ Repository creation failed: ${error}`);
        process.exit(1);
    }
});
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
    .action(async (opts) => {
    const globalOpts = program.opts();
    const cfg = await (0, config_1.loadConfig)(globalOpts.config);
    const options = opts;
    const filePath = path.resolve(options.file);
    console.log("🔄 Uploading shards to Walrus:", filePath);
    const shards = await (0, walrus_1.uploadShards)(filePath, cfg);
    const totalSize = shards.reduce((sum, s) => sum + s.sizeBytes, 0);
    console.log(`✅ Uploaded ${shards.length} shard(s), total size ${totalSize} bytes`);
    const encoder = new TextEncoder();
    // Metrics map with interactive prompts for missing ones
    const metrics = {};
    const accuracy = options.accuracy ?? (await prompt("Accuracy (%): "));
    const loss = options.loss ?? (await prompt("Loss: "));
    const epochs = options.epochs ?? (await prompt("Epochs: "));
    const f1 = options["f1-score"] ?? (await prompt("F1-Score: "));
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
    const deps = options.deps
        ? options.deps.split(",").map((d) => d.trim()).filter(Boolean)
        : [];
    const branchBytes = Array.from(encoder.encode(options.branch));
    const msgBytes = Array.from(encoder.encode(options.message));
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
            tx.object(options.repo),
            tx.object(options.cap),
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
    .option("--repo-id <id>", "Repository object ID to query")
    .action(async (opts) => {
    const globalOpts = program.opts();
    const cfg = await (0, config_1.loadConfig)(globalOpts.config);
    const options = opts;
    const client = (0, sui_1.getSuiClient)(cfg);
    const pkg = (0, sui_1.getPackageId)();
    try {
        // Query commit events from blockchain
        const events = await client.queryEvents({
            query: {
                MoveEventType: `${pkg}::version_fs::CommitEvent`
            },
            limit: 50
        });
        if (events.data.length === 0) {
            console.log("No commits found on blockchain.");
            return;
        }
        const logMod = await Promise.resolve().then(() => __importStar(require("./log")));
        const renderLog = logMod.renderLog;
        // Convert events to commit format
        const commits = events.data.map((event) => {
            const fields = event.parsedJson || {};
            return {
                versionId: fields.version_id || "unknown",
                author: fields.author || "unknown",
                timestampMs: event.timestampMs ? parseInt(event.timestampMs) : Date.now(),
                message: fields.message || "No message",
                repoName: fields.repo_name || "Unknown",
                walrusRootBlobId: fields.root_blob_id || "",
                metrics: fields.metrics || {},
                shardCount: fields.shard_count || 0,
                totalSizeBytes: fields.total_size || 0,
                dependencies: fields.dependencies || [],
            };
        });
        // Filter by repo ID if provided
        const filteredCommits = options.repoId
            ? commits.filter((c) => c.versionId.includes(options.repoId))
            : commits;
        if (filteredCommits.length === 0) {
            console.log(`No commits found${options.repoId ? ` for repository ${options.repoId}` : ''}.`);
            return;
        }
        const output = renderLog(filteredCommits, options.repoId || "all-repos");
        console.log(output);
    }
    catch (error) {
        console.error(`❌ Failed to query commits: ${error}`);
        process.exit(1);
    }
});
program
    .command("audit-report")
    .description("Generate comprehensive audit report with performance analytics")
    .requiredOption("--repo <id>", "Repository object ID to audit")
    .option("--out <path>", "Output file path for HTML report", "./audit-report.html")
    .action(async (opts) => {
    const globalOpts = program.opts();
    const cfg = await (0, config_1.loadConfig)(globalOpts.config);
    const options = opts;
    const auditMod = await Promise.resolve().then(() => __importStar(require("./commands/audit-report")));
    const { executeAuditReport } = auditMod;
    const client = (0, sui_1.getSuiClient)(cfg);
    try {
        await executeAuditReport({
            repoId: options.repo,
            outputPath: options.out,
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
    const client = (0, sui_1.getSuiClient)(cfg);
    const pkg = (0, sui_1.getPackageId)();
    try {
        const { renderStorefrontTable } = await Promise.resolve().then(() => __importStar(require("./storefront")));
        // Query all repository objects from blockchain
        console.log("🔍 Querying AI model marketplace...\n");
        const objects = await client.queryEvents({
            query: {
                MoveEventType: `${pkg}::version_fs::RepositoryCreated`
            },
            limit: 100
        });
        if (objects.data.length === 0) {
            console.log("No repositories found in marketplace.");
            console.log("\nTo add a model, use: npm run cli -- commit ...");
            return;
        }
        // Convert to storefront rows
        const rows = objects.data.map((event) => {
            const fields = event.parsedJson || {};
            return {
                modelName: fields.name || "Unknown Model",
                author: fields.owner ? `${fields.owner.substring(0, 8)}...` : "Unknown",
                totalSizeBytes: parseInt(fields.total_size || "0"),
                trustScore: parseInt(fields.trust_score || "0"),
                priceMist: BigInt(fields.price_mist || "0"),
            };
        });
        const table = renderStorefrontTable(rows);
        console.log(table);
        console.log(`\n📊 Total Models: ${rows.length}`);
    }
    catch (error) {
        console.error(`❌ Failed to query marketplace: ${error}`);
        process.exit(1);
    }
});
program
    .command("pull")
    .description("Download AI model with payment processing if required")
    .requiredOption("--repo <id>", "Repository object ID to extract from")
    .requiredOption("--output <dir>", "Output directory to materialize the model")
    .action(async (opts) => {
    const globalOpts = program.opts();
    const cfg = await (0, config_1.loadConfig)(globalOpts.config);
    const options = opts;
    const pullMod = await Promise.resolve().then(() => __importStar(require("./commands/pull")));
    const { executePull } = pullMod;
    const pkg = (0, sui_1.getPackageId)();
    const client = (0, sui_1.getSuiClient)(cfg);
    const keypair = (0, sui_1.getKeypairFromEnv)();
    try {
        await executePull({
            repoId: options.repo,
            outputDir: options.output,
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
    .action(async (opts) => {
    const globalOpts = program.opts();
    const cfg = await (0, config_1.loadConfig)(globalOpts.config);
    const options = opts;
    const inspectMod = await Promise.resolve().then(() => __importStar(require("./inspect")));
    const { inspectRepository } = inspectMod;
    const client = (0, sui_1.getSuiClient)(cfg);
    await inspectRepository({
        repoId: options.repo,
        client,
        maxDepth: parseInt(options.maxDepth)
    });
});
program
    .command("verify")
    .description("Execute TEE verification and generate trust score")
    .requiredOption("--repo <id>", "Repository object ID to verify")
    .option("--version <id>", "Specific version ID to verify (defaults to latest)")
    .action(async (opts) => {
    const globalOpts = program.opts();
    const cfg = await (0, config_1.loadConfig)(globalOpts.config);
    const options = opts;
    const verifyMod = await Promise.resolve().then(() => __importStar(require("./verify")));
    const { verifyRepository } = verifyMod;
    const pkg = (0, sui_1.getPackageId)();
    const client = (0, sui_1.getSuiClient)(cfg);
    const keypair = (0, sui_1.getKeypairFromEnv)();
    try {
        await verifyRepository({
            repoId: options.repo,
            versionId: options.version,
            client,
            keypair,
            packageId: pkg,
            config: cfg
        });
    }
    catch (error) {
        console.error(`❌ Verification failed: ${error}`);
        process.exit(1);
    }
});
program
    .command("fork")
    .description("Fork a repository with upstream author attribution")
    .requiredOption("--from <id>", "Original repository object ID to fork")
    .requiredOption("--name <name>", "Name for the forked repository")
    .option("--price <mist>", "Price in MIST for the forked repo (0 for free)", "0")
    .action(async (opts) => {
    const globalOpts = program.opts();
    const cfg = await (0, config_1.loadConfig)(globalOpts.config);
    const options = opts;
    const forkMod = await Promise.resolve().then(() => __importStar(require("./commands/fork")));
    const { executeFork } = forkMod;
    const pkg = (0, sui_1.getPackageId)();
    const client = (0, sui_1.getSuiClient)(cfg);
    const keypair = (0, sui_1.getKeypairFromEnv)();
    try {
        await executeFork({
            originalRepoId: options.from,
            newName: options.name,
            price: options.price,
            client,
            keypair,
            packageId: pkg,
            config: cfg
        });
    }
    catch (error) {
        console.error(`❌ Fork failed: ${error}`);
        process.exit(1);
    }
});
program
    .command("certificate")
    .description("Display cryptographic provenance certificate")
    .requiredOption("--repo <id>", "Repository object ID")
    .option("--version <id>", "Specific version ID (optional)")
    .action(async (opts) => {
    const globalOpts = program.opts();
    const cfg = await (0, config_1.loadConfig)(globalOpts.config);
    const options = opts;
    const certMod = await Promise.resolve().then(() => __importStar(require("./commands/certificate")));
    const { executeCertificate } = certMod;
    const pkg = (0, sui_1.getPackageId)();
    const client = (0, sui_1.getSuiClient)(cfg);
    try {
        await executeCertificate({
            repoId: options.repo,
            versionId: options.version,
            client,
            packageId: pkg,
            config: cfg
        });
    }
    catch (error) {
        console.error(`❌ Certificate generation failed: ${error}`);
        process.exit(1);
    }
});
(async () => {
    await (0, config_1.ensureConfigFile)(program.opts().config);
    program.parseAsync(process.argv);
})();
