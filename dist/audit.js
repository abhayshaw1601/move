"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderAuditReportHtml = renderAuditReportHtml;
const diff_1 = require("./diff");
function renderAuditReportHtml(input) {
    const { repoName, trustScore, versions } = input;
    const lossSeries = [];
    const accSeries = [];
    versions.forEach((v, idx) => {
        const loss = parseFloat(v.metrics["Loss"] ?? "NaN");
        const acc = parseFloat(v.metrics["Accuracy"] ?? "NaN");
        if (!Number.isNaN(loss))
            lossSeries.push({ x: idx, y: loss });
        if (!Number.isNaN(acc))
            accSeries.push({ x: idx, y: acc });
    });
    // Get all unique metric keys
    const allMetricKeys = new Set();
    versions.forEach(v => {
        Object.keys(v.metrics).forEach(k => allMetricKeys.add(k));
    });
    const metricKeys = Array.from(allMetricKeys);
    const rowsHtml = versions
        .map((v) => {
        const shortId = v.versionId.length > 20 ? `${v.versionId.substring(0, 10)}...${v.versionId.substring(v.versionId.length - 8)}` : v.versionId;
        const metricsCells = metricKeys
            .map(k => `<td>${v.metrics[k] || "N/A"}</td>`)
            .join("");
        return `<tr>
        <td>${shortId}</td>
        <td>${new Date(v.timestampMs).toLocaleString()}</td>
        <td>${v.message}</td>
        ${metricsCells}
        <td>${v.shardCount}</td>
        <td>${(v.totalSizeBytes / 1000000).toFixed(2)} MB</td>
      </tr>`;
    })
        .join("\n");
    const diffSections = versions
        .map((v, idx) => `
      <div class="diff-section">
        <h3>Version ${idx + 1}: ${v.message}</h3>
        ${(0, diff_1.renderDiffHtml)(v.oldText, v.newText, v.fileName)}
      </div>
    `)
        .join("\n");
    const trustBadge = trustScore >= 100 ? "🥇 Gold" : trustScore >= 50 ? "🥈 Silver" : "🥉 Bronze";
    const trustColor = trustScore >= 100 ? "#FFD700" : trustScore >= 50 ? "#C0C0C0" : "#CD7F32";
    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Audit Report - ${repoName}</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
      * { box-sizing: border-box; }
      body { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        margin: 0;
        padding: 2rem;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        min-height: 100vh;
      }
      .container {
        max-width: 1200px;
        margin: 0 auto;
        background: white;
        border-radius: 12px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        padding: 2rem;
      }
      h1 { 
        color: #2d3748;
        margin: 0 0 0.5rem 0;
        font-size: 2.5rem;
      }
      .trust-badge {
        display: inline-block;
        padding: 0.5rem 1rem;
        background: ${trustColor};
        color: white;
        border-radius: 20px;
        font-weight: bold;
        margin: 1rem 0;
      }
      .stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin: 2rem 0;
      }
      .stat-card {
        background: #f7fafc;
        padding: 1.5rem;
        border-radius: 8px;
        border-left: 4px solid #667eea;
      }
      .stat-label {
        color: #718096;
        font-size: 0.875rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .stat-value {
        color: #2d3748;
        font-size: 1.5rem;
        font-weight: bold;
        margin-top: 0.5rem;
      }
      h2 { 
        color: #2d3748;
        margin: 2rem 0 1rem 0;
        padding-bottom: 0.5rem;
        border-bottom: 2px solid #e2e8f0;
      }
      .chart-container {
        position: relative;
        height: 300px;
        margin: 2rem 0;
      }
      table { 
        border-collapse: collapse;
        width: 100%;
        margin: 1rem 0;
        background: white;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        border-radius: 8px;
        overflow: hidden;
      }
      th, td { 
        border: 1px solid #e2e8f0;
        padding: 0.75rem;
        text-align: left;
      }
      th { 
        background: #667eea;
        color: white;
        font-weight: 600;
        text-transform: uppercase;
        font-size: 0.875rem;
        letter-spacing: 0.05em;
      }
      tr:nth-child(even) { background: #f7fafc; }
      tr:hover { background: #edf2f7; }
      .diff-section { 
        margin: 2rem 0;
        background: #f7fafc;
        padding: 1.5rem;
        border-radius: 8px;
      }
      .diff-section h3 {
        margin-top: 0;
        color: #2d3748;
      }
      .diff-content { 
        background: #1a202c;
        color: #e2e8f0;
        padding: 1rem;
        border-radius: 4px;
        overflow-x: auto;
        font-family: 'Courier New', monospace;
        font-size: 0.875rem;
        line-height: 1.5;
      }
      .diff-content .added { 
        background: rgba(72, 187, 120, 0.2);
        color: #9ae6b4;
        display: block;
        padding: 0.25rem 0.5rem;
      }
      .diff-content .removed { 
        background: rgba(245, 101, 101, 0.2);
        color: #fc8181;
        display: block;
        padding: 0.25rem 0.5rem;
      }
      .diff-content .unchanged { 
        display: block;
        padding: 0.25rem 0.5rem;
      }
      .line-number { 
        color: #718096;
        margin-right: 1rem;
        user-select: none;
      }
      .no-data {
        text-align: center;
        padding: 2rem;
        color: #718096;
        font-style: italic;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>🔍 Audit Report: ${repoName}</h1>
      <div class="trust-badge">Trust Score: ${trustScore} - ${trustBadge}</div>

      <div class="stats">
        <div class="stat-card">
          <div class="stat-label">Total Versions</div>
          <div class="stat-value">${versions.length}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total Size</div>
          <div class="stat-value">${(versions.reduce((sum, v) => sum + v.totalSizeBytes, 0) / 1000000).toFixed(2)} MB</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total Shards</div>
          <div class="stat-value">${versions.reduce((sum, v) => sum + v.shardCount, 0)}</div>
        </div>
      </div>

      ${lossSeries.length > 0 || accSeries.length > 0 ? `
      <section>
        <h2>📊 Metrics Over Time</h2>
        ${lossSeries.length > 0 ? '<div class="chart-container"><canvas id="lossChart"></canvas></div>' : ''}
        ${accSeries.length > 0 ? '<div class="chart-container"><canvas id="accChart"></canvas></div>' : ''}
      </section>
      ` : '<div class="no-data">No metric data available</div>'}

      <section>
        <h2>📋 Version History</h2>
        <table>
          <thead>
            <tr>
              <th>Version ID</th>
              <th>Timestamp</th>
              <th>Message</th>
              ${metricKeys.map(k => `<th>${k}</th>`).join('')}
              <th>Shards</th>
              <th>Size</th>
            </tr>
          </thead>
          <tbody>
${rowsHtml}
          </tbody>
        </table>
      </section>

${diffSections}
    </div>

    <script>
      const lossData = ${JSON.stringify(lossSeries)};
      const accData = ${JSON.stringify(accSeries)};

      if (lossData.length > 0) {
        const lossCtx = document.getElementById('lossChart').getContext('2d');
        new Chart(lossCtx, {
          type: 'line',
          data: {
            datasets: [{
              label: 'Loss',
              data: lossData,
              borderColor: '#ff6384',
              backgroundColor: 'rgba(255, 99, 132, 0.1)',
              tension: 0.4,
              fill: true
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: { type: 'linear', title: { display: true, text: 'Version' } },
              y: { title: { display: true, text: 'Loss' } }
            },
            plugins: {
              legend: { display: true, position: 'top' }
            }
          },
        });
      }

      if (accData.length > 0) {
        const accCtx = document.getElementById('accChart').getContext('2d');
        new Chart(accCtx, {
          type: 'line',
          data: {
            datasets: [{
              label: 'Accuracy',
              data: accData,
              borderColor: '#36a2eb',
              backgroundColor: 'rgba(54, 162, 235, 0.1)',
              tension: 0.4,
              fill: true
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: { type: 'linear', title: { display: true, text: 'Version' } },
              y: { title: { display: true, text: 'Accuracy' } }
            },
            plugins: {
              legend: { display: true, position: 'top' }
            }
          },
        });
      }
    </script>
  </body>
</html>`;
}
