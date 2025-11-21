import figlet from "figlet";
import boxen from "boxen";
import ora, { Ora } from "ora";
const asciichart = require("asciichart");
import chalk from "chalk";

// ProvenancePro CLI Design System
// Professional terminal interface for AI model provenance

/**
 * Print application banner
 */
export function printBanner(): void {
  console.clear();
  
  const banner = figlet.textSync("ProvenancePro", {
    font: "Standard",
    horizontalLayout: "default",
    verticalLayout: "default"
  });
  
  console.log(chalk.blue.bold(banner));
  console.log(chalk.gray("AI Model Provenance & Marketplace Platform\n"));
  
  const separator = "─".repeat(60);
  console.log(chalk.gray(separator));
  console.log();
}

/**
 * Create loading spinner
 */
export function startSpinner(text: string): Ora {
  return ora({
    text: chalk.white(text),
    spinner: "dots",
    color: "blue"
  }).start();
}

/**
 * Print performance chart
 */
export function printChart(dataArray: number[], label: string): void {
  const chart = asciichart.plot(dataArray, { 
    height: 8,
    colors: [asciichart.blue]
  });
  
  const chartBox = boxen(chart, {
    title: label,
    titleAlignment: "center",
    padding: 1,
    margin: 1,
    borderStyle: "single",
    borderColor: "blue"
  });
  
  console.log(chartBox);
}

/**
 * Print success message
 */
export function printSuccess(label: string, message: string): void {
  const successIcon = chalk.green("✓");
  const successLabel = chalk.green.bold(`[${successIcon} ${label}]`);
  const successMessage = chalk.white(message);
  
  console.log(`${successLabel} ${successMessage}`);
}

/**
 * Print operation completion
 */
export function printCompletion(title: string, message: string): void {
  const content = `${chalk.green.bold(title)}\n\n${chalk.white(message)}`;
  
  const successBox = boxen(content, {
    title: "Operation Complete",
    titleAlignment: "center",
    padding: 2,
    margin: 1,
    borderStyle: "single",
    borderColor: "green"
  });
  
  console.log(successBox);
}

/**
 * Print information box
 */
export function printInfoBox(title: string, data: Record<string, any>): void {
  let content = "";
  
  for (const [key, value] of Object.entries(data)) {
    const keyFormatted = chalk.blue.bold(`${key}:`);
    const valueFormatted = chalk.white(String(value));
    content += `${keyFormatted} ${valueFormatted}\n`;
  }
  
  const infoBox = boxen(content.trim(), {
    title: title,
    titleAlignment: "center",
    padding: 1,
    margin: 1,
    borderStyle: "single",
    borderColor: "blue"
  });
  
  console.log(infoBox);
}

/**
 * Print warning message
 */
export function printWarning(message: string): void {
  const warningBox = boxen(chalk.yellow.bold(`Warning: ${message}`), {
    padding: 1,
    margin: 1,
    borderStyle: "single",
    borderColor: "yellow"
  });
  
  console.log(warningBox);
}

/**
 * Print error message
 */
export function printError(title: string, message: string): void {
  const content = `${chalk.red.bold(title)}\n\n${chalk.white(message)}`;
  
  const errorBox = boxen(content, {
    title: "Error",
    titleAlignment: "center",
    padding: 2,
    margin: 1,
    borderStyle: "single",
    borderColor: "red"
  });
  
  console.log(errorBox);
}

/**
 * Print access confirmation
 */
export function printAccessGranted(): void {
  const accessText = figlet.textSync("ACCESS GRANTED", {
    font: "Standard",
    horizontalLayout: "default"
  });
  
  console.log(chalk.green.bold(accessText));
  console.log(chalk.gray("\nRepository access has been successfully granted.\n"));
}

/**
 * Print payment information
 */
export function printPaymentInfo(repoName: string, price: string, qrContent: string): void {
  const title = `Payment Required: ${repoName}`;
  const priceInfo = `Price: ${chalk.yellow.bold(price)}`;
  
  const content = `${title}\n\n${priceInfo}\n\n${chalk.cyan(qrContent)}`;
  
  const paymentBox = boxen(content, {
    title: "Payment Gateway",
    titleAlignment: "center",
    padding: 2,
    margin: 1,
    borderStyle: "single",
    borderColor: "yellow"
  });
  
  console.log(paymentBox);
}

/**
 * Print dependency analysis header
 */
export function printDependencyHeader(): void {
  console.log(chalk.blue.bold("Dependency Analysis"));
  console.log(chalk.gray("Repository dependency graph and topology\n"));
}

/**
 * Print repository statistics
 */
export function printRepoStats(stats: {
  totalRepos: number;
  maxDepth: number;
  rootRepo: string;
}): void {
  const statsData = {
    "Total Repositories": stats.totalRepos,
    "Dependency Depth": stats.maxDepth,
    "Root Repository": stats.rootRepo
  };
  
  printInfoBox("Repository Statistics", statsData);
}

/**
 * Print verification status
 */
export function printVerificationStatus(trustScore: number, txDigest: string): void {
  const statusColor = trustScore >= 100 ? "green" : trustScore >= 50 ? "yellow" : "red";
  
  const content = `Trust Score: ${chalk[statusColor].bold(trustScore.toString())}\n` +
                  `Transaction: ${chalk.cyan(txDigest.substring(0, 16))}...`;
  
  const verificationBox = boxen(content, {
    title: "Verification Complete",
    titleAlignment: "center",
    padding: 1,
    margin: 1,
    borderStyle: "single",
    borderColor: statusColor as any
  });
  
  console.log(verificationBox);
}

/**
 * Print command completion
 */
export function printCommandComplete(command: string): void {
  console.log(chalk.green(`\n${command} operation completed successfully.\n`));
}

/**
 * Execute loading phases with progress indication
 */
export async function executePhases(phases: string[], delayMs: number = 1000): Promise<void> {
  for (const phase of phases) {
    const spinner = startSpinner(phase);
    await new Promise(resolve => setTimeout(resolve, delayMs));
    spinner.succeed(phase);
  }
}