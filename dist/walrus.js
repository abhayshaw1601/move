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
exports.walrusService = exports.WalrusService = void 0;
exports.uploadShards = uploadShards;
exports.downloadShards = downloadShards;
exports.uploadToWalrus = uploadToWalrus;
exports.fetchFromWalrus = fetchFromWalrus;
const fs = __importStar(require("fs"));
const crypto = __importStar(require("crypto"));
const path = __importStar(require("path"));
// eslint-disable-next-line @typescript-eslint/no-var-requires
const cliProgress = require("cli-progress");
/**
 * Walrus Storage Service
 * Handles file upload and download to/from Walrus decentralized storage
 */
const WALRUS_PUBLISHER = "https://publisher.walrus-testnet.walrus.space";
const WALRUS_AGGREGATOR = "https://aggregator.walrus-testnet.walrus.space";
class WalrusService {
    constructor(publisherUrl = WALRUS_PUBLISHER, aggregatorUrl = WALRUS_AGGREGATOR) {
        this.publisherUrl = publisherUrl;
        this.aggregatorUrl = aggregatorUrl;
    }
    /**
     * Upload a file to Walrus
     * @param data - File data (Uint8Array, Blob, or string)
     * @param epochs - Number of epochs to store (default: 3)
     * @returns Blob ID
     */
    async uploadFile(data, epochs = 3) {
        try {
            let blob;
            if (typeof data === "string") {
                blob = new Blob([new TextEncoder().encode(data)]);
            }
            else if (data instanceof Uint8Array) {
                blob = new Blob([data]);
            }
            else {
                blob = data;
            }
            console.log(`📤 Uploading ${blob.size} bytes to Walrus...`);
            const response = await fetch(`${this.publisherUrl}/v1/blobs?epochs=${epochs}`, {
                method: "PUT",
                body: blob,
                headers: {
                    "Content-Type": "application/octet-stream",
                },
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Upload failed: ${response.status} - ${errorText}`);
            }
            const result = (await response.json());
            let blobId;
            if (result.newlyCreated) {
                blobId = result.newlyCreated.blobObject.blobId;
                console.log("✅ File uploaded successfully!");
                console.log(`📦 Blob ID: ${blobId}`);
                console.log(`💰 Cost: ${result.newlyCreated.cost} MIST`);
            }
            else if (result.alreadyCertified) {
                blobId = result.alreadyCertified.blobId;
                console.log("✅ File already exists on Walrus!");
                console.log(`📦 Blob ID: ${blobId}`);
            }
            else {
                throw new Error("Unexpected response format");
            }
            return blobId;
        }
        catch (error) {
            console.error("❌ Upload error:", error);
            throw error;
        }
    }
    /**
     * Download a file from Walrus
     * @param blobId - The blob ID to download
     * @returns File data as Uint8Array
     */
    async downloadFile(blobId) {
        try {
            console.log(`📥 Downloading blob: ${blobId}`);
            const response = await fetch(`${this.aggregatorUrl}/v1/blobs/${blobId}`);
            if (!response.ok) {
                throw new Error(`Download failed: ${response.status} - ${response.statusText}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            const data = new Uint8Array(arrayBuffer);
            console.log(`✅ Downloaded ${data.length} bytes`);
            return data;
        }
        catch (error) {
            console.error("❌ Download error:", error);
            throw error;
        }
    }
    /**
     * Check if a blob exists on Walrus
     * @param blobId - The blob ID to check
     * @returns true if exists, false otherwise
     */
    async blobExists(blobId) {
        try {
            const response = await fetch(`${this.aggregatorUrl}/v1/blobs/${blobId}`, {
                method: "HEAD",
            });
            return response.ok;
        }
        catch {
            return false;
        }
    }
}
exports.WalrusService = WalrusService;
// Export singleton instance
exports.walrusService = new WalrusService();
async function sha256Stream(stream) {
    const hash = crypto.createHash("sha256");
    return new Promise((resolve, reject) => {
        stream.on("data", (chunk) => hash.update(chunk));
        stream.on("error", reject);
        stream.on("end", () => resolve(hash.digest("hex")));
    });
}
async function uploadShards(filePath, config) {
    const stat = await fs.promises.stat(filePath);
    const shardSize = config.default_shard_size;
    const totalShards = Math.max(1, Math.ceil(stat.size / shardSize));
    const results = [];
    const tasks = [];
    const walrus = new WalrusService();
    for (let i = 0; i < totalShards; i++) {
        const start = i * shardSize;
        const end = Math.min(stat.size, start + shardSize) - 1;
        tasks.push(async () => {
            const stream = fs.createReadStream(filePath, { start, end });
            const hash = crypto.createHash("sha256");
            const chunks = [];
            await new Promise((resolve, reject) => {
                stream.on("data", (chunk) => {
                    hash.update(chunk);
                    chunks.push(chunk);
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
    const running = [];
    while (idx < tasks.length || running.length > 0) {
        while (idx < tasks.length && running.length < maxConcurrent) {
            const p = tasks[idx++]();
            running.push(p);
            p.finally(() => {
                const i = running.indexOf(p);
                if (i >= 0)
                    running.splice(i, 1);
            });
        }
        if (running.length > 0) {
            await Promise.race(running);
        }
    }
    // Ensure deterministic order by index
    return results.sort((a, b) => a.index - b.index);
}
async function downloadShards(shards, outputPath, config) {
    const dir = path.dirname(outputPath);
    await fs.promises.mkdir(dir, { recursive: true });
    const progress = new cliProgress.MultiBar({
        clearOnComplete: false,
        hideCursor: true
    }, cliProgress.Presets.shades_grey);
    const fileStream = fs.createWriteStream(outputPath);
    const walrus = new WalrusService();
    try {
        const maxConcurrent = config.max_concurrent_uploads ?? 5;
        const tasks = [];
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
        const buffers = new Array(shards.length);
        let idx = 0;
        const running = [];
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
                    if (i >= 0)
                        running.splice(i, 1);
                });
            }
            if (running.length > 0) {
                await Promise.race(running);
            }
        }
        for (const buf of buffers) {
            if (buf)
                fileStream.write(buf);
        }
    }
    finally {
        progress.stop();
        fileStream.end();
    }
}
// Convenience functions using the WalrusService
async function uploadToWalrus(file) {
    return exports.walrusService.uploadFile(file, 5);
}
async function fetchFromWalrus(blobId) {
    const data = await exports.walrusService.downloadFile(blobId);
    return new TextDecoder().decode(data);
}
