import * as fs from "fs";
import * as crypto from "crypto";
import * as path from "path";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const cliProgress: any = require("cli-progress");

import { ProvenanceConfig } from "./config";

/**
 * Walrus Storage Service
 * Handles file upload and download to/from Walrus decentralized storage
 */
const WALRUS_PUBLISHER = "https://publisher.walrus-testnet.walrus.space";
const WALRUS_AGGREGATOR = "https://aggregator.walrus-testnet.walrus.space";


export interface WalrusUploadResponse {
  newlyCreated?: {
    blobObject: {
      id: string;
      registeredEpoch: number;
      blobId: string;
      size: number;
      encodingType: string;
      certifiedEpoch: number | null;
      storage: any;
      deletable: boolean;
    };
    resourceOperation: any;
    cost: number;
  };
  alreadyCertified?: {
    blobId: string;
    event: any;
    endEpoch: number;
  };
}

export interface FileMetadata {
  name: string;
  path: string;
  size: number;
  type: string;
  blobId?: string;
}

export class WalrusService {
  private publisherUrl: string;
  private aggregatorUrl: string;

  constructor(
    publisherUrl: string = WALRUS_PUBLISHER,
    aggregatorUrl: string = WALRUS_AGGREGATOR
  ) {
    this.publisherUrl = publisherUrl;
    this.aggregatorUrl = aggregatorUrl;
  }

  /**
   * Upload a file to Walrus
   * @param data - File data (Uint8Array, Blob, or string)
   * @param epochs - Number of epochs to store (default: 3)
   * @returns Blob ID
   */
  async uploadFile(
    data: Uint8Array | Blob | string,
    epochs: number = 3
  ): Promise<string> {
    try {
      let blob: Blob;
      if (typeof data === "string") {
        blob = new Blob([new TextEncoder().encode(data)]);
      } else if (data instanceof Uint8Array) {
        blob = new Blob([data as Uint8Array<ArrayBuffer>]);
      } else {
        blob = data;
      }

      console.log(`📤 Uploading ${blob.size} bytes to Walrus...`);

      const response = await fetch(
        `${this.publisherUrl}/v1/blobs?epochs=${epochs}`,
        {
          method: "PUT",
          body: blob,
          headers: {
            "Content-Type": "application/octet-stream",
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }

      const result: WalrusUploadResponse = (await response.json()) as WalrusUploadResponse;
      let blobId: string;

      if (result.newlyCreated) {
        blobId = result.newlyCreated.blobObject.blobId;
        console.log("✅ File uploaded successfully!");
        console.log(`📦 Blob ID: ${blobId}`);
        console.log(`💰 Cost: ${result.newlyCreated.cost} MIST`);
      } else if (result.alreadyCertified) {
        blobId = result.alreadyCertified.blobId;
        console.log("✅ File already exists on Walrus!");
        console.log(`📦 Blob ID: ${blobId}`);
      } else {
        throw new Error("Unexpected response format");
      }

      return blobId;
    } catch (error) {
      console.error("❌ Upload error:", error);
      throw error;
    }
  }

  /**
   * Download a file from Walrus
   * @param blobId - The blob ID to download
   * @returns File data as Uint8Array
   */
  async downloadFile(blobId: string): Promise<Uint8Array> {
    try {
      console.log(`📥 Downloading blob: ${blobId}`);

      const response = await fetch(`${this.aggregatorUrl}/v1/blobs/${blobId}`);

      if (!response.ok) {
        throw new Error(
          `Download failed: ${response.status} - ${response.statusText}`
        );
      }

      const arrayBuffer = await response.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);

      console.log(`✅ Downloaded ${data.length} bytes`);
      return data;
    } catch (error) {
      console.error("❌ Download error:", error);
      throw error;
    }
  }

  /**
   * Check if a blob exists on Walrus
   * @param blobId - The blob ID to check
   * @returns true if exists, false otherwise
   */
  async blobExists(blobId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.aggregatorUrl}/v1/blobs/${blobId}`, {
        method: "HEAD",
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const walrusService = new WalrusService();

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
  const walrus = new WalrusService();

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

      // Use the new WalrusService
      const blobId = await walrus.uploadFile(new Uint8Array(buffer), 5);

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
  const walrus = new WalrusService();

  try {
    const maxConcurrent = config.max_concurrent_uploads ?? 5;
    const tasks: (() => Promise<Buffer>)[] = [];

    for (const shard of shards) {
      tasks.push(async () => {
        const bar = progress.create(shard.sizeBytes, 0, { shard: shard.index });

        // Use the new WalrusService
        const data = await walrus.downloadFile(shard.blobId);
        
        bar.increment(data.length);
        bar.stop();

        const hash = crypto.createHash("sha256");
        hash.update(data);
        const sha256 = hash.digest("hex");
        
        if (shard.sha256 && shard.sha256 !== sha256) {
          throw new Error(`SHA256 mismatch for shard ${shard.index}`);
        }

        return Buffer.from(data);
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

// Convenience functions using the WalrusService
export async function uploadToWalrus(file: Blob): Promise<string> {
  return walrusService.uploadFile(file, 5);
}

export async function fetchFromWalrus(blobId: string): Promise<string> {
  const data = await walrusService.downloadFile(blobId);
  return new TextDecoder().decode(data);
}