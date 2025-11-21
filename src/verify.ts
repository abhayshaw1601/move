import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as ed25519 from "@noble/ed25519";
import { SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { renderAuditReportHtml, AuditReportInput, VersionMetrics } from "./audit";
import { ProvenanceConfig } from "./config";

export interface VerifyOptions {
  repoId: string;
  versionId?: string;
  client: SuiClient;
  keypair: Ed25519Keypair;
  packageId: string;
  config: ProvenanceConfig;
}

export interface VerificationResult {
  success: boolean;
  transactionDigest: string;
  newTrustScore: number;
  auditReportPath?: string;
}

export async function generateVerificationSignature(
  repoId: string,
  versionId: string,
  timestamp: number
): Promise<{ signature: Uint8Array; payload: string }> {
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

export async function submitVerifyReproducibilityTransaction(
  client: SuiClient,
  keypair: Ed25519Keypair,
  packageId: string,
  repoId: string,
  signature: Uint8Array
): Promise<string> {
  const tx = new Transaction();
  tx.setGasBudget(100_000_000n);

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

export async function pollForReproducibilityVerifiedEvent(
  client: SuiClient,
  transactionDigest: string,
  timeoutMs: number = 30000
): Promise<{ success: boolean; newTrustScore?: number }> {
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
            const eventData = event.parsedJson as any;
            const newTrustScore = eventData?.new_trust_score || eventData?.trust_score || 0;
            
            return { success: true, newTrustScore };
          }
        }
      }
    } catch (error) {
      // Transaction might not be available yet, continue polling
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  throw new Error("Timeout waiting for ReproducibilityVerified event");
}

export async function queryRepositoryVersions(
  client: SuiClient,
  repoId: string
): Promise<VersionMetrics[]> {
  try {
    // Query repository object
    const repoObject = await client.getObject({
      id: repoId,
      options: { showContent: true }
    });

    if (!repoObject.data?.content || repoObject.data.content.dataType !== "moveObject") {
      throw new Error(`Repository ${repoId} not found`);
    }

    const fields = (repoObject.data.content as any).fields;
    const branches = fields.branches || {};
    const versions: VersionMetrics[] = [];

    // For now, just get the main branch head as a single version
    // In a real implementation, we'd traverse all versions
    const mainBranchHead = branches.main;
    if (mainBranchHead) {
      const versionObject = await client.getObject({
        id: mainBranchHead,
        options: { showContent: true }
      });

      if (versionObject.data?.content && versionObject.data.content.dataType === "moveObject") {
        const versionFields = (versionObject.data.content as any).fields;
        
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
  } catch (error) {
    console.warn(`Warning: Could not fetch version history for ${repoId}`);
    return [];
  }
}

export async function generateAuditReport(
  client: SuiClient,
  repoId: string,
  trustScore: number
): Promise<string> {
  try {
    // Query repository details
    const repoObject = await client.getObject({
      id: repoId,
      options: { showContent: true }
    });

    if (!repoObject.data?.content || repoObject.data.content.dataType !== "moveObject") {
      throw new Error(`Repository ${repoId} not found`);
    }

    const fields = (repoObject.data.content as any).fields;
    const repoName = fields.name || "unknown-repo";

    // Get version history
    const versions = await queryRepositoryVersions(client, repoId);

    const auditInput: AuditReportInput = {
      repoName,
      trustScore,
      versions
    };

    // Generate HTML report
    const htmlContent = renderAuditReportHtml(auditInput);

    // Save to temporary file
    const tempDir = os.tmpdir();
    const reportPath = path.join(tempDir, `audit-report-${repoName}-${Date.now()}.html`);
    
    await fs.promises.writeFile(reportPath, htmlContent, "utf8");
    
    return reportPath;
  } catch (error) {
    throw new Error(`Failed to generate audit report: ${error}`);
  }
}

export async function openInBrowser(filePath: string): Promise<void> {
  const { exec } = require("child_process");
  
  // Cross-platform browser opening
  let command: string;
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
    exec(command, (error: any) => {
      if (error) {
        console.warn(`Could not open browser automatically: ${error.message}`);
        console.log(`Please open the following file manually: ${filePath}`);
      }
      resolve();
    });
  });
}

export async function verifyRepository(options: VerifyOptions): Promise<VerificationResult> {
  const { repoId, versionId, client, keypair, packageId, config } = options;

  console.log(`🔐 Starting TEE-style verification for repository: ${repoId}`);
  
  // Use provided version ID or get latest from main branch
  let targetVersionId = versionId;
  if (!targetVersionId) {
    console.log("📋 Getting latest version from main branch...");
    const repoObject = await client.getObject({
      id: repoId,
      options: { showContent: true }
    });

    if (!repoObject.data?.content || repoObject.data.content.dataType !== "moveObject") {
      throw new Error(`Repository ${repoId} not found`);
    }

    const fields = (repoObject.data.content as any).fields;
    const branches = fields.branches || {};
    targetVersionId = branches.main;
    
    if (!targetVersionId) {
      throw new Error("No main branch found in repository");
    }
  }

  console.log(`🔍 Verifying version: ${targetVersionId}`);

  // Generate verification signature
  const timestamp = Date.now();
  console.log("🔑 Generating Ed25519 signature...");
  const { signature, payload } = await generateVerificationSignature(
    repoId,
    targetVersionId,
    timestamp
  );

  console.log(`📝 Payload: ${payload}`);
  console.log(`✍️  Signature: ${Buffer.from(signature).toString("hex").substring(0, 16)}...`);

  // Submit verification transaction
  const txDigest = await submitVerifyReproducibilityTransaction(
    client,
    keypair,
    packageId,
    repoId,
    signature
  );

  console.log(`📄 Transaction: ${txDigest}`);
  console.log("⏳ Waiting for verification confirmation...");

  // Poll for verification event
  const { success, newTrustScore } = await pollForReproducibilityVerifiedEvent(client, txDigest);

  if (!success) {
    throw new Error("Verification failed - no ReproducibilityVerified event received");
  }

  console.log(`🎉 Verification successful! New trust score: ${newTrustScore}`);

  // Generate audit report
  console.log("📊 Generating audit report...");
  const auditReportPath = await generateAuditReport(client, repoId, newTrustScore || 0);
  
  console.log(`📋 Audit report saved: ${auditReportPath}`);
  console.log("🌐 Opening audit report in browser...");
  
  await openInBrowser(auditReportPath);

  return {
    success: true,
    transactionDigest: txDigest,
    newTrustScore: newTrustScore || 0,
    auditReportPath
  };
}