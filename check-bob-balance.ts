#!/usr/bin/env ts-node

/**
 * Check Bob's wallet balance
 */

import { SuiClient } from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";
import chalk from "chalk";

const BOB_PRIVATE_KEY = process.env.BOB_PRIVATE_KEY || "suiprivkey1qptmc2uduejrljd84pxcsw8sndd9dm8ywvd76dtjw965wzlvunuw7rd2d4d";
const SUI_RPC = "https://fullnode.testnet.sui.io:443";

async function main() {
  const { secretKey } = decodeSuiPrivateKey(BOB_PRIVATE_KEY);
  const keypair = Ed25519Keypair.fromSecretKey(secretKey);
  const address = keypair.toSuiAddress();
  
  const client = new SuiClient({ url: SUI_RPC });
  
  console.log(chalk.cyan("\n👤 Bob's Wallet Information\n"));
  console.log(chalk.white(`Address: ${address}`));
  
  const balance = await client.getBalance({ owner: address });
  const balanceAmount = BigInt(balance.totalBalance);
  const balanceSUI = Number(balanceAmount) / 1_000_000_000;
  
  console.log(chalk.white(`Balance: ${balanceAmount} MIST (${balanceSUI.toFixed(4)} SUI)`));
  
  if (balanceSUI < 0.1) {
    console.log(chalk.red("\n⚠️  Low balance! Bob needs at least 0.1 SUI for the demo."));
    console.log(chalk.yellow("\nTo fund Bob's wallet:"));
    console.log(chalk.white(`1. Visit: https://faucet.sui.io/`));
    console.log(chalk.white(`2. Enter Bob's address: ${address}`));
    console.log(chalk.white(`3. Request testnet SUI tokens`));
  } else {
    console.log(chalk.green("\n✅ Bob has sufficient balance for the demo!"));
  }
  
  console.log();
}

main().catch(console.error);
