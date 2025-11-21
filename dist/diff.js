"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeDiffLines = computeDiffLines;
exports.renderDiffHtml = renderDiffHtml;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const diffLib = require("diff");
function computeDiffLines(oldText, newText) {
    const parts = diffLib.diffLines(oldText, newText);
    const lines = [];
    for (const part of parts) {
        const kind = part.added
            ? "added"
            : part.removed
                ? "removed"
                : "unchanged";
        const split = part.value.split(/\r?\n/);
        for (const line of split) {
            if (line.length === 0)
                continue;
            lines.push({ kind, text: line });
        }
    }
    return lines;
}
function renderDiffHtml(oldText, newText, fileName) {
    const lines = computeDiffLines(oldText, newText);
    const htmlLines = [];
    htmlLines.push('<section class="diff-section">');
    htmlLines.push(`  <h2>Code Changes: ${fileName}</h2>`);
    htmlLines.push('  <div class="file-diff">');
    htmlLines.push(`    <h3>${fileName}</h3>`);
    htmlLines.push('    <pre class="diff-content">');
    let lineNumber = 1;
    for (const line of lines) {
        let cls = "unchanged";
        if (line.kind === "added")
            cls = "added";
        if (line.kind === "removed")
            cls = "removed";
        htmlLines.push(`      <span class="line-number">${lineNumber}</span> <span class="${cls}">${line.text}</span>`);
        lineNumber++;
    }
    htmlLines.push("    </pre>");
    htmlLines.push("  </div>");
    htmlLines.push("</section>");
    return htmlLines.join("\n");
}
