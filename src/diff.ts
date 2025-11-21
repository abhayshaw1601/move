// eslint-disable-next-line @typescript-eslint/no-var-requires
const diffLib: any = require("diff");

export type DiffKind = "added" | "removed" | "unchanged";

export interface DiffLine {
  kind: DiffKind;
  text: string;
}

export function computeDiffLines(oldText: string, newText: string): DiffLine[] {
  const parts = diffLib.diffLines(oldText, newText);
  const lines: DiffLine[] = [];

  for (const part of parts) {
    const kind: DiffKind = part.added
      ? "added"
      : part.removed
      ? "removed"
      : "unchanged";
    const split = part.value.split(/\r?\n/);
    for (const line of split) {
      if (line.length === 0) continue;
      lines.push({ kind, text: line });
    }
  }

  return lines;
}

export function renderDiffHtml(
  oldText: string,
  newText: string,
  fileName: string,
): string {
  const lines = computeDiffLines(oldText, newText);

  const htmlLines: string[] = [];
  htmlLines.push('<section class="diff-section">');
  htmlLines.push(`  <h2>Code Changes: ${fileName}</h2>`);
  htmlLines.push('  <div class="file-diff">');
  htmlLines.push(`    <h3>${fileName}</h3>`);
  htmlLines.push('    <pre class="diff-content">');

  let lineNumber = 1;
  for (const line of lines) {
    let cls = "unchanged";
    if (line.kind === "added") cls = "added";
    if (line.kind === "removed") cls = "removed";

    htmlLines.push(
      `      <span class="line-number">${lineNumber}</span> <span class="${cls}">${
        line.text
      }</span>`,
    );
    lineNumber++;
  }

  htmlLines.push("    </pre>");
  htmlLines.push("  </div>");
  htmlLines.push("</section>");

  return htmlLines.join("\n");
}
