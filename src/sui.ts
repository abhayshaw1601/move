import { SuiClient } from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";
import deploymentInfo from "../deployment-info.json";
import type { ProvenanceConfig } from "./config";

interface DeploymentInfoShape {
  network: string;
  packageId: string;
  deployerAddress: string;
  transactionDigest: string;
  deployedAt: string;
  explorerUrl: string;
}

export function getPackageId(): string {
  const info = deploymentInfo as DeploymentInfoShape;
  if (!info.packageId) {
    throw new Error("packageId missing in deployment-info.json");
  }
  return info.packageId;
}

export function getSuiClient(config: ProvenanceConfig): SuiClient {
  return new SuiClient({ url: config.sui_rpc });
}

export function getKeypairFromEnv(): Ed25519Keypair {
  const priv = process.env.SUI_PRIVATE_KEY;
  if (!priv) {
    throw new Error("SUI_PRIVATE_KEY env var not set; please export your Sui private key.");
  }
  const { secretKey } = decodeSuiPrivateKey(priv);
  return Ed25519Keypair.fromSecretKey(secretKey);
}
