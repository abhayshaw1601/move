import { SuiClient } from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";
import { ProvenanceConfig } from "../config";
import { startSpinner, printSuccess, printInfoBox, printError } from "../utils/ui";
import boxen from "boxen";
import chalk from "chalk";

export interface CreateRepoOptions {
  name: string;
  price: string;
  client: SuiClient;
  keypair: Ed25519Keypair;
  packageId: string;
  config: ProvenanceConfig;
}

export async function executeCreateRepo(options: CreateRepoOptions): Promise<void> {
  const { name, price, client, keypair, packageId } = options;

  console.log(chalk.blue.bold("\n🏗️  CREATING REPOSITORY\n"));

  const spinner = startSpinner("Submitting repository creation transaction...");

  try {
    const tx = new Transaction();
    tx.setGasBudget(100_000_000n);

    const encoder = new TextEncoder();
    const nameBytes = Array.from(encoder.encode(name));
    const priceValue = BigInt(price);

    tx.moveCall({
      target: `${packageId}::version_fs::create_repository`,
      arguments: [
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

    spinner.succeed("Repository created on blockchain");

    // Extract repository ID and capability ID from object changes
    const objectChanges = result.objectChanges || [];
    
    const createdRepo = objectChanges.find(
      (change: any) => change.type === "created" && change.objectType?.includes("Repository")
    );
    
    const createdCap = objectChanges.find(
      (change: any) => change.type === "created" && change.objectType?.includes("RepoCap")
    );

    const repoId = createdRepo ? (createdRepo as any).objectId : "Unknown";
    const capId = createdCap ? (createdCap as any).objectId : "Unknown";

    // Display success
    console.log();
    const successBox = boxen(
      chalk.green.bold("✓ REPOSITORY CREATED\n\n") +
      chalk.white(`Name: ${chalk.cyan(name)}\n`) +
      chalk.white(`Price: ${chalk.yellow(price === "0" ? "FREE" : `${price} MIST`)}\n\n`) +
      chalk.gray("Repository ID:\n") +
      chalk.cyan(`${repoId}\n\n`) +
      chalk.gray("Capability ID:\n") +
      chalk.cyan(`${capId}\n\n`) +
      chalk.gray("Transaction:\n") +
      chalk.cyan(`${result.digest.substring(0, 32)}...`),
      {
        padding: 1,
        margin: 1,
        borderStyle: "double",
        borderColor: "green",
        title: "SUCCESS",
        titleAlignment: "center"
      }
    );

    console.log(successBox);

    // Display next steps
    const nextStepsBox = boxen(
      chalk.white.bold("NEXT STEPS:\n\n") +
      chalk.gray("1. Save these IDs for future commands\n") +
      chalk.gray("2. Commit your first model:\n\n") +
      chalk.cyan(`   npm run cli -- commit \\\n`) +
      chalk.cyan(`     --repo ${repoId} \\\n`) +
      chalk.cyan(`     --cap ${capId} \\\n`) +
      chalk.cyan(`     --branch main \\\n`) +
      chalk.cyan(`     --message "Initial commit" \\\n`) +
      chalk.cyan(`     --file model.bin \\\n`) +
      chalk.cyan(`     --accuracy 98.5 \\\n`) +
      chalk.cyan(`     --loss 0.02 \\\n`) +
      chalk.cyan(`     --epochs 100 \\\n`) +
      chalk.cyan(`     --f1-score 0.92`),
      {
        padding: 1,
        margin: 1,
        borderStyle: "single",
        borderColor: "blue"
      }
    );

    console.log(nextStepsBox);
    console.log();

  } catch (error) {
    spinner.fail("Repository creation failed");
    printError("Creation Error", error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
