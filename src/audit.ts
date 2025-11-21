import { renderDiffHtml } from "./diff";

export interface VersionMetrics {
  versionId: string;
  timestampMs: number;
  message: string;
  metrics: Record<string, string>;
  shardCount: number;
  totalSizeBytes: number;
  fileName: string;
  oldText: string;
  newText: string;
}

export interface AuditReportInput {
  repoName: string;
  trustScore: number;
  versions: VersionMetrics[];
}

export function renderAuditReportHtml(input: AuditReportInput): string {
  const { repoName, trustScore, versions } = input;

  const lossSeries: { x: number; y: number }[] = [];
  const accSeries: { x: number; y: number }[] = [];

  versions.forEach((v, idx) => {
    const loss = parseFloat(v.metrics["Loss"] ?? "NaN");
    const acc = parseFloat(v.metrics["Accuracy"] ?? "NaN");
    if (!Number.isNaN(loss)) lossSeries.push({ x: idx, y: loss });
    if (!Number.isNaN(acc)) accSeries.push({ x: idx, y: acc });
  });

  const rowsHtml = versions
    .map((v) => {
      const metricsCells = Object.entries(v.metrics)
        .map(([k, val]) => `<td>${k}</td><td>${val}</td>`)
        .join("");
      return `<tr><td>${v.versionId}</td><td>${new Date(
        v.timestampMs,
      ).toISOString()}</td><td>${v.message}</td>${metricsCells}</tr>`;
    })
    .join("\n");

  const diffSections = versions
    .map((v) => renderDiffHtml(v.oldText, v.newText, v.fileName))
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Audit Report - ${repoName}</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
      body { font-family: system-ui, sans-serif; margin: 2rem; }
      h1, h2 { margin-bottom: 0.5rem; }
      table { border-collapse: collapse; width: 100%; margin-top: 1rem; }
      th, td { border: 1px solid #ddd; padding: 0.5rem; }
      th { background: #f4f4f4; }
      .diff-section { margin-top: 2rem; }
      .diff-content { background: #1e1e1e; color: #eee; padding: 1rem; }
      .diff-content .added { background: #d4edda; display: block; }
      .diff-content .removed { background: #f8d7da; display: block; }
      .diff-content .unchanged { display: block; }
      .line-number { color: #888; margin-right: 0.5rem; }
    </style>
  </head>
  <body>
    <h1>Audit Report: ${repoName}</h1>
    <p>Trust Score: ${trustScore}</p>

    <section>
      <h2>Metrics Over Time</h2>
      <canvas id="lossChart" height="120"></canvas>
      <canvas id="accChart" height="120"></canvas>
    </section>

    <section>
      <h2>Version Metrics Table</h2>
      <table>
        <thead>
          <tr>
            <th>Version</th>
            <th>Timestamp</th>
            <th>Message</th>
            <th colspan="${
              Object.keys(versions[0]?.metrics ?? { Accuracy: "" }).length * 2
            }">Metrics</th>
          </tr>
        </thead>
        <tbody>
${rowsHtml}
        </tbody>
      </table>
    </section>

${diffSections}

    <script>
      const lossData = ${JSON.stringify(lossSeries)};
      const accData = ${JSON.stringify(accSeries)};

      const lossCtx = document.getElementById('lossChart').getContext('2d');
      new Chart(lossCtx, {
        type: 'line',
        data: {
          datasets: [{ label: 'Loss', data: lossData, borderColor: '#ff6384' }],
        },
        options: { scales: { x: { type: 'linear' } } },
      });

      const accCtx = document.getElementById('accChart').getContext('2d');
      new Chart(accCtx, {
        type: 'line',
        data: {
          datasets: [{ label: 'Accuracy', data: accData, borderColor: '#36a2eb' }],
        },
        options: { scales: { x: { type: 'linear' } } },
      });
    </script>
  </body>
</html>`;
}
