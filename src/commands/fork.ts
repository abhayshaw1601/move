import { SuiClient } from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";
import { ProvenanceConfig } from "../config";
import { startSpinner, printSuccess, printInfoBox, printError } from "../utils/ui";
import boxen from "boxen";
import chalk from "chalk";

export interface ForkOptions {
  originalRepoId: string;
  newName: string;
  price: string;
  client: SuiClient;
  keypair: Ed25519Keypair;
  packageId: string;
  config: ProvenanceConfig;
}

export async function executeFork(options: ForkOptions): Promise<void> {
  const { originalRepoId, newName, price, client, keypair, packageId } = options;

  console.log(chalk.blue.bold("\n🔱 FORKING REPOSITORY\n"));

  // Fetch original repository details
  const spinner = startSpinner("Querying original repository...");
  
  try {
    const originalRepo = await client.getObject({
      id: originalRepoId,
      options: { showContent: true, showOwner: true }
    });

    if (!originalRepo.data) {
      spinner.fail("Original repository not found");
      printError("Fork Failed", `Repository ${originalRepoId} does not exist`);
      process.exit(1);
    }

    const content = originalRepo.data.content as any;
    const fields = content?.fields || {};
    const originalOwner = fields.owner || "Unknown";
    const originalName = fields.name || "Unknown";

    spinner.succeed("Original repository found");

    // Display fork information
    printInfoBox("Fork Details", {
      "Original Repository": originalRepoId.substring(0, 16) + "...",
      "Original Owner": originalOwner.substring(0, 16) + "...",
      "Original Name": originalName,
      "New Name": newName,
      "New Price": `${price} MIST`
    });

    // Create fork transaction
    const forkSpinner = startSpinner("Creating fork on blockchain...");

    const tx = new Transaction();
    tx.setGasBudget(100_000_000n);

    const encoder = new TextEncoder();
    const nameBytes = Array.from(encoder.encode(newName));
    const priceValue = BigInt(price);

    tx.moveCall({
      target: `${packageId}::version_fs::fork_repository`,
      arguments: [
        tx.object(originalRepoId),
        tx.pure.vector("u8", nameBytes),
        tx.pure.u64(priceValue),
      ],
    });

    const result = await client.signAndExecuteTransaction({
      signer: keypair,
      transaction: tx,
      options: {
        showEffects: true,
        showEvents: true,
        showObjectChanges: true,
      },
    });

    forkSpinner.succeed("Fork transaction submitted");

    // Extract new repository ID from object changes
    const objectChanges = result.objectChanges || [];
    const createdRepo = objectChanges.find(
      (change: any) => change.type === "created" && change.objectType?.includes("Repository")
    );

    const newRepoId = createdRepo ? (createdRepo as any).objectId : "Unknown";

    // Display success with upstream author warning
    console.log();
    const upstreamWarning = boxen(
      chalk.yellow.bold("⚠️  UPSTREAM AUTHOR LOCKED\n\n") +
      chalk.white(`Original Author: ${chalk.cyan(originalOwner.substring(0, 16) + "...")}\n\n`) +
      chalk.gray("All sales of this forked repository will automatically\n") +
      chalk.gray("route 5% royalties back to the original author.\n") +
      chalk.gray("This attribution is permanent and cannot be removed."),
      {
        padding: 1,
        margin: 1,
        borderStyle: "double",
        borderColor: "yellow",
        title: "PROVENANCE LOCKED",
        titleAlignment: "center"
      }
    );

    console.log(upstreamWarning);

    printSuccess("Fork Complete", `New Repository ID: ${newRepoId}`);
    printSuccess("Transaction", result.digest);

    console.log(chalk.gray("\n💡 Tip: Use 'provenance commit' to add versions to your fork\n"));

  } catch (error) {
    spinner.fail("Fork operation failed");
    printError("Fork Error", error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
