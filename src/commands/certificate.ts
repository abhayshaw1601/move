import { SuiClient } from "@mysten/sui/client";
import { ProvenanceConfig } from "../config";
import { startSpinner, printError } from "../utils/ui";
import boxen from "boxen";
import chalk from "chalk";
import * as crypto from "crypto";

export interface CertificateOptions {
  repoId: string;
  versionId?: string;
  client: SuiClient;
  packageId: string;
  config: ProvenanceConfig;
}

export async function executeCertificate(options: CertificateOptions): Promise<void> {
  const { repoId, versionId, client, packageId } = options;

  console.log(chalk.blue.bold("\n📜 PROVENANCE CERTIFICATE\n"));

  const spinner = startSpinner("Generating cryptographic certificate...");

  try {
    // Fetch repository data
    const repoObject = await client.getObject({
      id: repoId,
      options: { showContent: true, showOwner: true }
    });

    if (!repoObject.data) {
      spinner.fail("Repository not found");
      printError("Certificate Error", `Repository ${repoId} does not exist`);
      process.exit(1);
    }

    const content = repoObject.data.content as any;
    const fields = content?.fields || {};

    const repoName = fields.name || "Unknown";
    const owner = fields.owner || "Unknown";
    const trustScore = parseInt(fields.trust_score || "0");
    const versionCount = parseInt(fields.version_count || "0");
    const upstreamAuthor = fields.upstream_author || "0x0";

    // Query verification events
    const events = await client.queryEvents({
      query: {
        MoveEventType: `${packageId}::version_fs::ReproducibilityVerified`
      },
      limit: 50
    });

    const repoVerifications = events.data.filter((event: any) => {
      const parsed = event.parsedJson || {};
      return parsed.repo_id === repoId;
    });

    const verificationCount = repoVerifications.length;
    const lastVerification = repoVerifications[0];
    const lastVerifiedTimestamp = lastVerification?.timestampMs 
      ? new Date(parseInt(lastVerification.timestampMs)).toISOString()
      : "Never";

    // Generate certificate hash
    const certificateData = {
      repository_id: repoId,
      repository_name: repoName,
      owner_address: owner,
      trust_score: trustScore,
      version_count: versionCount,
      verification_count: verificationCount,
      upstream_author: upstreamAuthor,
      generated_at: new Date().toISOString()
    };

    const certificateJson = JSON.stringify(certificateData, null, 2);
    const certificateHash = crypto.createHash("sha256").update(certificateJson).digest("hex");

    spinner.succeed("Certificate generated");

    // Determine trust level
    let trustLevel: string;
    let trustColor: "green" | "yellow" | "red";
    
    if (trustScore >= 100) {
      trustLevel = "GOLD [VERIFIED]";
      trustColor = "green";
    } else if (trustScore >= 50) {
      trustLevel = "SILVER [VERIFIED]";
      trustColor = "yellow";
    } else {
      trustLevel = "BRONZE [UNVERIFIED]";
      trustColor = "red";
    }

    // Display certificate
    console.log();
    const certificateBox = boxen(
      chalk.white.bold("CRYPTOGRAPHIC PROVENANCE CERTIFICATE\n\n") +
      chalk.gray("Repository ID:     ") + chalk.cyan(repoId.substring(0, 32) + "...\n") +
      chalk.gray("Repository Name:   ") + chalk.white(repoName + "\n") +
      chalk.gray("Owner Address:     ") + chalk.cyan(owner.substring(0, 32) + "...\n") +
      chalk.gray("Trust Score:       ") + chalk[trustColor].bold(trustScore.toString() + "\n") +
      chalk.gray("Trust Level:       ") + chalk[trustColor].bold(trustLevel + "\n") +
      chalk.gray("Verifications:     ") + chalk.white(verificationCount.toString() + "\n") +
      chalk.gray("Last Verified:     ") + chalk.white(lastVerifiedTimestamp + "\n") +
      chalk.gray("Upstream Author:   ") + chalk.cyan(upstreamAuthor === "0x0" ? "None (Original)" : upstreamAuthor.substring(0, 32) + "...\n") +
      chalk.gray("\nCertificate Hash:  ") + chalk.yellow(certificateHash.substring(0, 32) + "..."),
      {
        padding: 1,
        margin: 1,
        borderStyle: "double",
        borderColor: trustColor,
        title: "PROVENANCE CERTIFICATE",
        titleAlignment: "center"
      }
    );

    console.log(certificateBox);

    // Display authenticity warning if forked
    if (upstreamAuthor !== "0x0") {
      const forkWarning = boxen(
        chalk.yellow.bold("⚠️  FORKED REPOSITORY\n\n") +
        chalk.white("This repository is a fork. Original author:\n") +
        chalk.cyan(upstreamAuthor.substring(0, 32) + "...\n\n") +
        chalk.gray("5% of all sales automatically route to original author."),
        {
          padding: 1,
          margin: 1,
          borderStyle: "single",
          borderColor: "yellow"
        }
      );
      console.log(forkWarning);
    }

    // Output JSON for programmatic use
    console.log(chalk.gray("\n📄 Certificate JSON:\n"));
    console.log(chalk.dim(certificateJson));
    console.log();

  } catch (error) {
    spinner.fail("Certificate generation failed");
    printError("Certificate Error", error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
