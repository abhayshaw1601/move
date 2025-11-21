import * as fs from "fs";
import * as os from "os";
import * as path from "path";

export interface ProvenanceConfig {
  sui_rpc: string;
  walrus_api: string;
  default_shard_size: number;
  max_concurrent_uploads: number;
  wallet_address: string;
}

const DEFAULT_CONFIG: ProvenanceConfig = {
  sui_rpc: "https://fullnode.testnet.sui.io:443",
  walrus_api: "https://walrus-testnet.mystenlabs.com",
  default_shard_size: 104_857_600, // 100MB
  max_concurrent_uploads: 5,
  wallet_address: "0x..."
};

export function getDefaultConfigPath(): string {
  const home = os.homedir();
  return path.join(home, ".provenance", "config.json");
}

export async function ensureConfigFile(customPath?: string): Promise<void> {
  const configPath = customPath ?? getDefaultConfigPath();
  const dir = path.dirname(configPath);
  await fs.promises.mkdir(dir, { recursive: true });

  try {
    await fs.promises.access(configPath, fs.constants.F_OK);
  } catch {
    await fs.promises.writeFile(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2), "utf8");
  }
}

export async function loadConfig(customPath?: string): Promise<ProvenanceConfig> {
  const configPath = customPath ?? getDefaultConfigPath();
  try {
    const raw = await fs.promises.readFile(configPath, "utf8");
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch {
    return DEFAULT_CONFIG;
  }
}
