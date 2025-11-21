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
exports.getDefaultConfigPath = getDefaultConfigPath;
exports.ensureConfigFile = ensureConfigFile;
exports.loadConfig = loadConfig;
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const DEFAULT_CONFIG = {
    sui_rpc: "https://fullnode.testnet.sui.io:443",
    walrus_api: "https://walrus-testnet.mystenlabs.com",
    default_shard_size: 104857600, // 100MB
    max_concurrent_uploads: 5,
    wallet_address: "0x..."
};
function getDefaultConfigPath() {
    const home = os.homedir();
    return path.join(home, ".provenance", "config.json");
}
async function ensureConfigFile(customPath) {
    const configPath = customPath ?? getDefaultConfigPath();
    const dir = path.dirname(configPath);
    await fs.promises.mkdir(dir, { recursive: true });
    try {
        await fs.promises.access(configPath, fs.constants.F_OK);
    }
    catch {
        await fs.promises.writeFile(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2), "utf8");
    }
}
async function loadConfig(customPath) {
    const configPath = customPath ?? getDefaultConfigPath();
    try {
        const raw = await fs.promises.readFile(configPath, "utf8");
        const parsed = JSON.parse(raw);
        return { ...DEFAULT_CONFIG, ...parsed };
    }
    catch {
        return DEFAULT_CONFIG;
    }
}
