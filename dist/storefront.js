"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatSize = formatSize;
exports.colorTrustScore = colorTrustScore;
exports.formatPrice = formatPrice;
exports.sumShardSizes = sumShardSizes;
exports.renderStorefrontTable = renderStorefrontTable;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Table = require("cli-table3");
function formatSize(bytes) {
    if (bytes >= 1024 * 1024 * 1024) {
        return (bytes / (1024 * 1024 * 1024)).toFixed(1) + " GB";
    }
    if (bytes >= 1024 * 1024) {
        return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    }
    if (bytes >= 1024) {
        return (bytes / 1024).toFixed(1) + " KB";
    }
    return `${bytes} B`;
}
function colorTrustScore(score) {
    const label = score.toString();
    const green = "\x1b[32m";
    const red = "\x1b[31m";
    const reset = "\x1b[0m";
    return score >= 50 ? `${green}${label}${reset}` : `${red}${label}${reset}`;
}
function formatPrice(priceMist) {
    if (priceMist === 0n)
        return "FREE";
    const sui = Number(priceMist) / 1000000000;
    return `${sui} SUI`;
}
function sumShardSizes(sizes) {
    return sizes.reduce((a, b) => a + b, 0);
}
function renderStorefrontTable(rows) {
    const table = new Table({
        head: ["MODEL NAME", "AUTHOR", "SIZE", "TRUST", "PRICE"],
    });
    for (const r of rows) {
        table.push([
            r.modelName,
            r.author,
            formatSize(r.totalSizeBytes),
            colorTrustScore(r.trustScore),
            formatPrice(r.priceMist),
        ]);
    }
    return table.toString();
}
