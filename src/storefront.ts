// eslint-disable-next-line @typescript-eslint/no-var-requires
const Table: any = require("cli-table3");

export interface StorefrontRow {
  modelName: string;
  author: string;
  totalSizeBytes: number;
  trustScore: number;
  priceMist: bigint;
}

export function formatSize(bytes: number): string {
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

export function colorTrustScore(score: number): string {
  const label = score.toString();
  const green = "\x1b[32m";
  const red = "\x1b[31m";
  const reset = "\x1b[0m";
  return score >= 50 ? `${green}${label}${reset}` : `${red}${label}${reset}`;
}

export function formatPrice(priceMist: bigint): string {
  if (priceMist === 0n) return "FREE";
  const sui = Number(priceMist) / 1_000_000_000;
  return `${sui} SUI`;
}

export function sumShardSizes(sizes: number[]): number {
  return sizes.reduce((a, b) => a + b, 0);
}

export function renderStorefrontTable(rows: StorefrontRow[]): string {
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
