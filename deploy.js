"use strict";
/**
 * Smart Contract Deployment Script
 * Deploy VersionFS to Sui blockchain using TypeScript SDK
 */
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@mysten/sui/client");
var ed25519_1 = require("@mysten/sui/keypairs/ed25519");
var transactions_1 = require("@mysten/sui/transactions");
var cryptography_1 = require("@mysten/sui/cryptography");
var fs = __importStar(require("fs"));
var path = __importStar(require("path"));
// ==================== Configuration ====================
var NETWORK = 'testnet';
var PRIVATE_KEY = 'suiprivkey1qzpj7utsapwa89c0zup3m493a2xru0y49vyrd9ketg4tqn7cgjg0jxetuc4';
// ==================== Main Deployment Function ====================
function deployContract() {
    return __awaiter(this, void 0, void 0, function () {
        var rpcUrl, client, keypair, address, _a, schema, secretKey, expectedAddress, balance, suiBalance, error_1, buildPath, moduleFiles, modules, tx, upgradeCap, result, publishedChange, packageId, explorerUrl, deploymentInfo, error_2;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    console.log('🚀 VersionFS - Smart Contract Deployment\n');
                    console.log('═'.repeat(70));
                    rpcUrl = NETWORK === 'mainnet'
                        ? 'https://fullnode.mainnet.sui.io:443'
                        : 'https://fullnode.testnet.sui.io:443';
                    client = new client_1.SuiClient({ url: rpcUrl });
                    console.log("\u2705 Connected to Sui ".concat(NETWORK));
                    console.log("   RPC: ".concat(rpcUrl, "\n"));
                    try {
                        _a = (0, cryptography_1.decodeSuiPrivateKey)(PRIVATE_KEY), schema = _a.schema, secretKey = _a.secretKey;
                        keypair = ed25519_1.Ed25519Keypair.fromSecretKey(secretKey);
                        address = keypair.toSuiAddress();
                        console.log("\uD83D\uDCCD Deployer Address: ".concat(address));
                        expectedAddress = '0xaedc8923f06ab9e677377bfbebc527d806dd59a6f987555b6b192632d7f750cb';
                        if (address === expectedAddress) {
                            console.log("\u2705 Address verified!\n");
                        }
                        else {
                            console.log("\u26A0\uFE0F  Address mismatch (expected ".concat(expectedAddress, ")\n"));
                        }
                    }
                    catch (error) {
                        console.error('❌ Failed to import private key');
                        console.error('   Error:', error.message);
                        process.exit(1);
                    }
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, client.getBalance({ owner: address })];
                case 2:
                    balance = _c.sent();
                    suiBalance = Number(balance.totalBalance) / 1000000000;
                    console.log("\uD83D\uDCB0 Balance: ".concat(suiBalance.toFixed(4), " SUI\n"));
                    if (suiBalance < 0.1) {
                        console.error('❌ Insufficient balance (need at least 0.1 SUI)');
                        console.log('\n💡 Get testnet tokens:');
                        console.log('   https://discord.gg/sui (#testnet-faucet)');
                        console.log("   !faucet ".concat(address, "\n"));
                        process.exit(1);
                    }
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _c.sent();
                    console.error('❌ Failed to check balance:', error_1);
                    process.exit(1);
                    return [3 /*break*/, 4];
                case 4:
                    buildPath = path.join(__dirname, 'build', 'version_fs', 'bytecode_modules');
                    if (!fs.existsSync(buildPath)) {
                        console.error('❌ Contract not built!');
                        console.log('\n💡 Build first: sui move build\n');
                        process.exit(1);
                    }
                    moduleFiles = fs.readdirSync(buildPath)
                        .filter(function (f) { return f.endsWith('.mv') && !f.includes('test'); });
                    modules = moduleFiles.map(function (file) {
                        return Array.from(fs.readFileSync(path.join(buildPath, file)));
                    });
                    console.log("\uD83D\uDCE6 Found ".concat(modules.length, " module(s): ").concat(moduleFiles.join(', '), "\n"));
                    // 5. Create deployment transaction
                    console.log('🔄 Creating deployment transaction...');
                    tx = new transactions_1.Transaction();
                    tx.setGasBudget(100000000);
                    upgradeCap = tx.publish({
                        modules: modules,
                        dependencies: ['0x1', '0x2'],
                    })[0];
                    tx.transferObjects([upgradeCap], address);
                    // 6. Execute deployment
                    console.log('⏳ Deploying to blockchain (30-60 seconds)...\n');
                    _c.label = 5;
                case 5:
                    _c.trys.push([5, 7, , 8]);
                    return [4 /*yield*/, client.signAndExecuteTransaction({
                            signer: keypair,
                            transaction: tx,
                            options: {
                                showEffects: true,
                                showObjectChanges: true,
                                showEvents: true,
                            },
                        })];
                case 6:
                    result = _c.sent();
                    console.log('\nFull Result:', JSON.stringify(result, null, 2));
                    console.log('✅ DEPLOYMENT SUCCESSFUL!\n');
                    console.log('═'.repeat(70));
                    // 7. Extract info
                    console.log('\nObject Changes:', JSON.stringify(result.objectChanges, null, 2));
                    publishedChange = (_b = result.objectChanges) === null || _b === void 0 ? void 0 : _b.find(function (c) { return c.type === 'published'; });
                    packageId = publishedChange === null || publishedChange === void 0 ? void 0 : publishedChange.packageId;
                    // 8. Display results
                    console.log('\n📋 DEPLOYMENT INFORMATION:');
                    console.log('═'.repeat(70));
                    console.log("Package ID:  ".concat(packageId));
                    console.log("Transaction: ".concat(result.digest));
                    console.log('═'.repeat(70));
                    explorerUrl = "https://suiexplorer.com/txblock/".concat(result.digest, "?network=").concat(NETWORK);
                    console.log("\n\uD83D\uDD17 Explorer: ".concat(explorerUrl, "\n"));
                    deploymentInfo = {
                        network: NETWORK,
                        packageId: packageId,
                        deployerAddress: address,
                        transactionDigest: result.digest,
                        deployedAt: new Date().toISOString(),
                        explorerUrl: explorerUrl,
                    };
                    fs.writeFileSync('deployment-info.json', JSON.stringify(deploymentInfo, null, 2));
                    console.log('💾 Saved: deployment-info.json\n');
                    // 10. Next steps
                    console.log('📝 NEXT STEPS:\n');
                    console.log('Update your .env file:');
                    console.log("VITE_PACKAGE_ID=".concat(packageId, "\n"));
                    console.log('🎉 DEPLOYMENT COMPLETE!\n');
                    return [3 /*break*/, 8];
                case 7:
                    error_2 = _c.sent();
                    console.error('\n❌ DEPLOYMENT FAILED:', error_2.message || error_2);
                    process.exit(1);
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    });
}
deployContract().catch(console.error);
