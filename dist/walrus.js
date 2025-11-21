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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadShards = uploadShards;
exports.downloadShards = downloadShards;
const fs = __importStar(require("fs"));
const crypto = __importStar(require("crypto"));
const path = __importStar(require("path"));
const axios_1 = __importDefault(require("axios"));
// eslint-disable-next-line @typescript-eslint/no-var-requires
const cliProgress = require("cli-progress");
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
            const resp = await axios_1.default.post(`${config.walrus_api}/v1/blobs`, buffer, {
                headers: { "Content-Type": "application/octet-stream" }
            });
            const blobId = resp.data.id ?? resp.data.blobId ?? resp.data.digest ?? "";
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
    try {
        const maxConcurrent = config.max_concurrent_uploads ?? 5;
        const tasks = [];
        for (const shard of shards) {
            tasks.push(async () => {
                const bar = progress.create(shard.sizeBytes, 0, { shard: shard.index });
                const resp = await axios_1.default.get(`${config.walrus_api}/v1/blobs/${shard.blobId}`, {
                    responseType: "stream"
                });
                const hash = crypto.createHash("sha256");
                const chunks = [];
                await new Promise((resolve, reject) => {
                    resp.data.on("data", (chunk) => {
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
