"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPackageId = getPackageId;
exports.getSuiClient = getSuiClient;
exports.getKeypairFromEnv = getKeypairFromEnv;
const client_1 = require("@mysten/sui/client");
const ed25519_1 = require("@mysten/sui/keypairs/ed25519");
const cryptography_1 = require("@mysten/sui/cryptography");
const deployment_info_json_1 = __importDefault(require("../deployment-info.json"));
function getPackageId() {
    const info = deployment_info_json_1.default;
    if (!info.packageId) {
        throw new Error("packageId missing in deployment-info.json");
    }
    return info.packageId;
}
function getSuiClient(config) {
    return new client_1.SuiClient({ url: config.sui_rpc });
}
function getKeypairFromEnv() {
    const priv = process.env.SUI_PRIVATE_KEY;
    if (!priv) {
        throw new Error("SUI_PRIVATE_KEY env var not set; please export your Sui private key.");
    }
    const { secretKey } = (0, cryptography_1.decodeSuiPrivateKey)(priv);
    return ed25519_1.Ed25519Keypair.fromSecretKey(secretKey);
}
