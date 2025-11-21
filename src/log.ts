export interface CommitView {
  versionId: string;
  author: string;
  timestampMs: number;
  message: string;
  repoName: string;
  walrusRootBlobId: string;
  metrics: Record<string, string>;
  shardCount: number;
  totalSizeBytes: number;
  dependencies: string[];
}

function formatBytes(bytes: number): string {
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

export function formatMetricValue(key: string, value: string): string {
  const lower = key.toLowerCase();
  const isPercentKey = lower.includes("accuracy") || lower.endsWith("rate");
  if (isPercentKey && !value.trim().endsWith("%")) {
    return `${value}%`;
  }
  return value;
}

export function renderLog(commits: CommitView[], filterRepoName?: string): string {
  const filtered = filterRepoName
    ? commits.filter((c) => c.repoName === filterRepoName)
    : commits;

  const lines: string[] = [];

  for (const c of filtered) {
    const date = new Date(c.timestampMs).toISOString();
    lines.push(`COMMIT: ${c.versionId}`);
    lines.push(`Author: ${c.author}`);
    lines.push(`Date:   ${date}`);
    lines.push(`Message: ${c.message}`);

    lines.push("├── 📊 METRICS:");
    const metricEntries = Object.entries(c.metrics);
    if (metricEntries.length === 0) {
      lines.push("│   (none)");
    } else {
      for (const [k, v] of metricEntries) {
        lines.push(`│   ├── ${k}: ${formatMetricValue(k, v)}`);
      }
    }

    lines.push(
      `├── 📦 WALRUS SHARDS: ${c.shardCount} shard(s) (${formatBytes(
        c.totalSizeBytes,
      )} total)`,
    );
    lines.push(`│   Root blob: ${c.walrusRootBlobId}`);

    lines.push("└── 🔗 DEPENDENCIES:");
    if (c.dependencies.length === 0) {
      lines.push("    (none)");
    } else {
      for (const dep of c.dependencies) {
        lines.push(`    └── ${dep}`);
      }
    }

    lines.push("");
  }

  return lines.join("\n");
}
