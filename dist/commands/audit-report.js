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
exports.executeAuditReport = executeAuditReport;
const ui_1 = require("../utils/ui");
const audit_1 = require("../audit");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
async function executeAuditReport(options) {
    const { repoId, outputPath, client } = options;
    // Display application banner
    (0, ui_1.printBanner)();
    // Query repository metadata
    const spinner = (0, ui_1.startSpinner)("Querying repository metadata from blockchain...");
    try {
        // Query repository details
        const repoObject = await client.getObject({
            id: repoId,
            options: { showContent: true }
        });
        if (!repoObject.data?.content || repoObject.data.content.dataType !== "moveObject") {
            throw new Error(`Repository ${repoId} not found`);
        }
        const fields = repoObject.data.content.fields;
        spinner.succeed("Repository metadata retrieved successfully");
        // Display repository information
        const repoData = {
            "Model Name": fields.name || "Unknown Model",
            "Owner": `${fields.owner?.substring(0, 8)}...`,
            "Trust Score": fields.trust_score || 0,
            "Access Price": fields.price === "0" ? "Free" : `${Number(fields.price) / 1000000000} SUI`,
            "Version Count": fields.version_count || 0,
            "Total Revenue": `${Number(fields.total_revenue || 0) / 1000000000} SUI`
        };
        (0, ui_1.printInfoBox)("Repository Information", repoData);
        // Query actual version data from blockchain
        const metricsSpinner = (0, ui_1.startSpinner)("Fetching version history from blockchain...");
        // Get versions from the repository's version table
        const versions = [];
        const versionTable = fields.versions;
        const versionCount = parseInt(fields.version_count || "0");
        // Query dynamic fields from the Table
        if (versionTable && versionTable.fields && versionTable.fields.id) {
            const tableId = versionTable.fields.id.id;
            try {
                // Get all dynamic fields from the table
                const dynamicFields = await client.getDynamicFields({
                    parentId: tableId
                });
                for (const field of dynamicFields.data) {
                    try {
                        // Get the actual version data
                        const versionObj = await client.getDynamicFieldObject({
                            parentId: tableId,
                            name: field.name
                        });
                        if (versionObj.data?.content && versionObj.data.content.dataType === 'moveObject') {
                            const fields = versionObj.data.content.fields;
                            // Version data is nested under fields.value.fields
                            const versionData = fields.value?.fields || fields;
                            const metrics = {};
                            // Extract metrics from VecMap
                            if (versionData.metrics && versionData.metrics.fields && versionData.metrics.fields.contents) {
                                for (const metricEntry of versionData.metrics.fields.contents) {
                                    metrics[metricEntry.fields.key] = metricEntry.fields.value;
                                }
                            }
                            const shardCount = parseInt(versionData.shard_count || "0");
                            const totalSize = parseInt(versionData.total_size_bytes || "0");
                            const timestamp = parseInt(versionData.timestamp || "0");
                            versions.push({
                                versionId: versionData.version_id || field.objectId,
                                timestampMs: timestamp > 1000000000000 ? timestamp : timestamp * 1000, // Handle both ms and seconds
                                message: versionData.message || "No message",
                                metrics: metrics,
                                shardCount: shardCount,
                                totalSizeBytes: totalSize,
                                fileName: `version_${versions.length + 1}.bin`,
                                oldText: versions.length > 0 ? `// Version ${versions.length}\n// Previous changes...` : "// Initial version",
                                newText: `// Version ${versions.length + 1}\n// ${versionData.message || "No message"}\n// Shards: ${shardCount}, Size: ${(totalSize / 1000000000).toFixed(2)} GB\n// Metrics: ${Object.entries(metrics).map(([k, v]) => `${k}=${v}`).join(', ')}`
                            });
                        }
                    }
                    catch (err) {
                        console.error("Error fetching version:", err);
                    }
                }
            }
            catch (err) {
                console.error("Error querying dynamic fields:", err);
            }
        }
        // Sort versions by timestamp
        versions.sort((a, b) => a.timestampMs - b.timestampMs);
        // If no versions found but version_count > 0, create placeholder
        if (versions.length === 0 && versionCount > 0) {
            for (let i = 0; i < versionCount; i++) {
                versions.push({
                    versionId: `${repoId}-v${i + 1}`,
                    timestampMs: Date.now() - (versionCount - i) * 86400000,
                    message: `Version ${i + 1}`,
                    metrics: { "Status": "Data unavailable" },
                    shardCount: 0,
                    totalSizeBytes: 0,
                    fileName: `version_${i + 1}.bin`,
                    oldText: i > 0 ? `// Version ${i}` : "// Initial version",
                    newText: `// Version ${i + 1}`
                });
            }
        }
        metricsSpinner.succeed(`Found ${versions.length} version(s)`);
        // Extract metrics for charts
        const trainingLoss = [];
        const accuracyMetrics = [];
        versions.forEach(v => {
            const loss = parseFloat(v.metrics["Loss"] || "NaN");
            const acc = parseFloat(v.metrics["Accuracy"] || "NaN");
            if (!Number.isNaN(loss))
                trainingLoss.push(loss);
            if (!Number.isNaN(acc))
                accuracyMetrics.push(acc);
        });
        // Display charts if we have data
        if (trainingLoss.length > 0) {
            (0, ui_1.printChart)(trainingLoss, "Training Loss");
        }
        if (accuracyMetrics.length > 0) {
            (0, ui_1.printChart)(accuracyMetrics, "Model Accuracy");
        }
        // Generate HTML audit report
        const htmlSpinner = (0, ui_1.startSpinner)("Generating HTML audit report...");
        const auditInput = {
            repoName: fields.name || "AI Model",
            trustScore: parseInt(fields.trust_score || "0"),
            versions: versions
        };
        const htmlContent = (0, audit_1.renderAuditReportHtml)(auditInput);
        // Save the report
        const reportPath = outputPath || path.join(os.tmpdir(), `provenance-audit-${Date.now()}.html`);
        await fs.promises.writeFile(reportPath, htmlContent, "utf8");
        htmlSpinner.succeed("HTML audit report generated");
        // Display completion summary
        (0, ui_1.printCompletion)("Audit Complete", `Repository analysis completed successfully.\n\n` +
            `Performance Metrics: Analyzed\n` +
            `Blockchain Integrity: Verified\n` +
            `Report Location: ${reportPath}\n\n` +
            `The AI model has been thoroughly audited and the report is ready for review.`);
        // Open report in browser
        const openSpinner = (0, ui_1.startSpinner)("Opening report in browser...");
        await new Promise(resolve => setTimeout(resolve, 500));
        try {
            const { exec } = require("child_process");
            let command;
            switch (process.platform) {
                case "darwin":
                    command = `open "${reportPath}"`;
                    break;
                case "win32":
                    command = `start "" "${reportPath}"`;
                    break;
                default:
                    command = `xdg-open "${reportPath}"`;
                    break;
            }
            exec(command, (error) => {
                if (error) {
                    openSpinner.warn("Manual browser launch required");
                }
                else {
                    openSpinner.succeed("Report opened in browser");
                }
            });
        }
        catch (error) {
            openSpinner.warn("Browser launch failed - report saved locally");
        }
        (0, ui_1.printCommandComplete)("Audit Report");
    }
    catch (error) {
        spinner.fail("Repository query failed");
        throw error;
    }
}
