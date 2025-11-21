import * as fs from "fs";
import * as crypto from "crypto";
import * as path from "path";
import axios from "axios";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const cliProgress: any = require("cli-progress");

import { ProvenanceConfig } from "./config";

export interface ShardInfo {
  index: number;
  blobId: string;
  sizeBytes: number;
  sha256: string;
}

async function sha256Stream(stream: fs.ReadStream): Promise<string> {
  const hash = crypto.createHash("sha256");
  return new Promise((resolve, reject) => {
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

export async function uploadShards(
  filePath: string,
  config: ProvenanceConfig
): Promise<ShardInfo[]> {
  const stat = await fs.promises.stat(filePath);
  const shardSize = config.default_shard_size;
  const totalShards = Math.max(1, Math.ceil(stat.size / shardSize));

  const results: ShardInfo[] = [];
  const tasks: (() => Promise<void>)[] = [];

  for (let i = 0; i < totalShards; i++) {
    const start = i * shardSize;
    const end = Math.min(stat.size, start + shardSize) - 1;

    tasks.push(async () => {
      const stream = fs.createReadStream(filePath, { start, end });
      const hash = crypto.createHash("sha256");
      const chunks: Buffer[] = [];

      await new Promise<void>((resolve, reject) => {
        stream.on("data", (chunk) => {
          hash.update(chunk);
          chunks.push(chunk as Buffer);
        });
        stream.on("error", reject);
        stream.on("end", () => resolve());
      });

      const sha256 = hash.digest("hex");
      const buffer = Buffer.concat(chunks);

      const resp = await axios.post(
        `${config.walrus_api}/v1/blobs`,
        buffer,
        {
          headers: { "Content-Type": "application/octet-stream" }
        }
      );

      const blobId: string = resp.data.id ?? resp.data.blobId ?? resp.data.digest ?? "";

      results.push({
        index: i,
        blobId,
        sizeBytes: buffer.length,
        sha256
      });
    });
  }

  // Simple concurrency limiter
  const maxConcurrent = config.max_concurrent_uploads ?? 5;
  let idx = 0;
  const running: Promise<void>[] = [];

  while (idx < tasks.length || running.length > 0) {
    while (idx < tasks.length && running.length < maxConcurrent) {
      const p = tasks[idx++]();
      running.push(p);
      p.finally(() => {
        const i = running.indexOf(p);
        if (i >= 0) running.splice(i, 1);
      });
    }
    if (running.length > 0) {
      await Promise.race(running);
    }
  }

  // Ensure deterministic order by index
  return results.sort((a, b) => a.index - b.index);
}

export async function downloadShards(
  shards: ShardInfo[],
  outputPath: string,
  config: ProvenanceConfig
): Promise<void> {
  const dir = path.dirname(outputPath);
  await fs.promises.mkdir(dir, { recursive: true });

  const progress = new cliProgress.MultiBar(
    {
      clearOnComplete: false,
      hideCursor: true
    },
    cliProgress.Presets.shades_grey
  );

  const fileStream = fs.createWriteStream(outputPath);

  try {
    const maxConcurrent = config.max_concurrent_uploads ?? 5;
    const tasks: (() => Promise<Buffer>)[] = [];

    for (const shard of shards) {
      tasks.push(async () => {
        const bar = progress.create(shard.sizeBytes, 0, { shard: shard.index });

        const resp = await axios.get(`${config.walrus_api}/v1/blobs/${shard.blobId}`, {
          responseType: "stream"
        });

        const hash = crypto.createHash("sha256");
        const chunks: Buffer[] = [];

        await new Promise<void>((resolve, reject) => {
          resp.data.on("data", (chunk: Buffer) => {
            hash.update(chunk);
            chunks.push(chunk);
            bar.increment(chunk.length);
          });
          resp.data.on("error", reject);
          resp.data.on("end", () => resolve());
        });

        bar.stop();

        const sha256 = hash.digest("hex");
        if (shard.sha256 && shard.sha256 !== sha256) {
          throw new Error(`SHA256 mismatch for shard ${shard.index}`);
        }

        return Buffer.concat(chunks);
      });
    }

    // Concurrency control
    const buffers: Buffer[] = new Array(shards.length);
    let idx = 0;
    const running: Promise<void>[] = [];

    while (idx < tasks.length || running.length > 0) {
      while (idx < tasks.length && running.length < maxConcurrent) {
        const currentIndex = idx;
        const p = tasks[currentIndex]().then((buf) => {
          buffers[currentIndex] = buf;
        });
        running.push(p);
        idx++;
        p.finally(() => {
          const i = running.indexOf(p);
          if (i >= 0) running.splice(i, 1);
        });
      }
      if (running.length > 0) {
        await Promise.race(running);
      }
    }

    for (const buf of buffers) {
      if (buf) fileStream.write(buf);
    }
  } finally {
    progress.stop();
    fileStream.end();
  }
}
