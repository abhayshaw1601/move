"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.printBanner = printBanner;
exports.startSpinner = startSpinner;
exports.printChart = printChart;
exports.printSuccess = printSuccess;
exports.printCompletion = printCompletion;
exports.printInfoBox = printInfoBox;
exports.printWarning = printWarning;
exports.printError = printError;
exports.printAccessGranted = printAccessGranted;
exports.printPaymentInfo = printPaymentInfo;
exports.printDependencyHeader = printDependencyHeader;
exports.printRepoStats = printRepoStats;
exports.printVerificationStatus = printVerificationStatus;
exports.printCommandComplete = printCommandComplete;
exports.executePhases = executePhases;
exports.printVersionFSBanner = printVersionFSBanner;
exports.printAccessDenied = printAccessDenied;
exports.printTrustScore = printTrustScore;
const figlet_1 = __importDefault(require("figlet"));
const boxen_1 = __importDefault(require("boxen"));
const ora_1 = __importDefault(require("ora"));
const asciichart = require("asciichart");
const chalk_1 = __importDefault(require("chalk"));
// ProvenancePro CLI Design System
// Professional terminal interface for AI model provenance
/**
 * Print application banner
 */
function printBanner() {
    console.clear();
    const banner = figlet_1.default.textSync("ProvenancePro", {
        font: "Standard",
        horizontalLayout: "default",
        verticalLayout: "default"
    });
    console.log(chalk_1.default.blue.bold(banner));
    console.log(chalk_1.default.gray("AI Model Provenance & Marketplace Platform\n"));
    const separator = "─".repeat(60);
    console.log(chalk_1.default.gray(separator));
    console.log();
}
/**
 * Create loading spinner
 */
function startSpinner(text) {
    return (0, ora_1.default)({
        text: chalk_1.default.white(text),
        spinner: "dots",
        color: "blue"
    }).start();
}
/**
 * Print performance chart
 */
function printChart(dataArray, label) {
    const chart = asciichart.plot(dataArray, {
        height: 8,
        colors: [asciichart.blue]
    });
    const chartBox = (0, boxen_1.default)(chart, {
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
function printSuccess(label, message) {
    const successIcon = chalk_1.default.green("✓");
    const successLabel = chalk_1.default.green.bold(`[${successIcon} ${label}]`);
    const successMessage = chalk_1.default.white(message);
    console.log(`${successLabel} ${successMessage}`);
}
/**
 * Print operation completion
 */
function printCompletion(title, message) {
    const content = `${chalk_1.default.green.bold(title)}\n\n${chalk_1.default.white(message)}`;
    const successBox = (0, boxen_1.default)(content, {
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
function printInfoBox(title, data) {
    let content = "";
    for (const [key, value] of Object.entries(data)) {
        const keyFormatted = chalk_1.default.blue.bold(`${key}:`);
        const valueFormatted = chalk_1.default.white(String(value));
        content += `${keyFormatted} ${valueFormatted}\n`;
    }
    const infoBox = (0, boxen_1.default)(content.trim(), {
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
function printWarning(message) {
    const warningBox = (0, boxen_1.default)(chalk_1.default.yellow.bold(`Warning: ${message}`), {
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
function printError(title, message) {
    const content = `${chalk_1.default.red.bold(title)}\n\n${chalk_1.default.white(message)}`;
    const errorBox = (0, boxen_1.default)(content, {
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
function printAccessGranted() {
    const accessText = figlet_1.default.textSync("ACCESS GRANTED", {
        font: "Standard",
        horizontalLayout: "default"
    });
    console.log(chalk_1.default.green.bold(accessText));
    console.log(chalk_1.default.gray("\nRepository access has been successfully granted.\n"));
}
/**
 * Print payment information
 */
function printPaymentInfo(repoName, price, qrContent) {
    const title = `Payment Required: ${repoName}`;
    const priceInfo = `Price: ${chalk_1.default.yellow.bold(price)}`;
    const content = `${title}\n\n${priceInfo}\n\n${chalk_1.default.cyan(qrContent)}`;
    const paymentBox = (0, boxen_1.default)(content, {
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
function printDependencyHeader() {
    console.log(chalk_1.default.blue.bold("Dependency Analysis"));
    console.log(chalk_1.default.gray("Repository dependency graph and topology\n"));
}
/**
 * Print repository statistics
 */
function printRepoStats(stats) {
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
function printVerificationStatus(trustScore, txDigest) {
    const statusColor = trustScore >= 100 ? "green" : trustScore >= 50 ? "yellow" : "red";
    const content = `Trust Score: ${chalk_1.default[statusColor].bold(trustScore.toString())}\n` +
        `Transaction: ${chalk_1.default.cyan(txDigest.substring(0, 16))}...`;
    const verificationBox = (0, boxen_1.default)(content, {
        title: "Verification Complete",
        titleAlignment: "center",
        padding: 1,
        margin: 1,
        borderStyle: "single",
        borderColor: statusColor
    });
    console.log(verificationBox);
}
/**
 * Print command completion
 */
function printCommandComplete(command) {
    console.log(chalk_1.default.green(`\n${command} operation completed successfully.\n`));
}
/**
 * Execute loading phases with progress indication
 */
async function executePhases(phases, delayMs = 1000) {
    for (const phase of phases) {
        const spinner = startSpinner(phase);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        spinner.succeed(phase);
    }
}
/**

 * Print VersionFS demo banner for pitch
 */
function printVersionFSBanner() {
    console.clear();
    const banner = `
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║              VERSION_FS: PROVABLY AUTHENTIC               ║
║                                                           ║
║         Built on Sui Blockchain + Walrus Storage          ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `;
    console.log(chalk_1.default.cyan.bold(banner));
    console.log();
}
/**
 * Print dramatic access denied message
 */
function printAccessDenied() {
    const deniedBox = (0, boxen_1.default)(chalk_1.default.red.bold("❌ INTEGRITY CHECK FAILED\n\n") +
        chalk_1.default.white("Hash mismatch detected.\n") +
        chalk_1.default.white("Model has been modified or corrupted.\n\n") +
        chalk_1.default.red.bold("ACCESS DENIED"), {
        padding: 2,
        margin: 1,
        borderStyle: "double",
        borderColor: "red",
        title: "VERIFICATION FAILED",
        titleAlignment: "center"
    });
    console.log(deniedBox);
}
/**
 * Print trust score with color coding
 */
function printTrustScore(score) {
    let level;
    let color;
    if (score >= 100) {
        level = "GOLD [VERIFIED]";
        color = "green";
    }
    else if (score >= 50) {
        level = "SILVER [VERIFIED]";
        color = "yellow";
    }
    else {
        level = "BRONZE [UNVERIFIED]";
        color = "red";
    }
    const scoreBox = (0, boxen_1.default)(chalk_1.default[color].bold(`TRUST SCORE: ${score}\n`) +
        chalk_1.default[color].bold(`TRUST LEVEL: ${level}`), {
        padding: 1,
        margin: 1,
        borderStyle: "double",
        borderColor: color,
        title: "TRUST ORACLE",
        titleAlignment: "center"
    });
    console.log(scoreBox);
}
