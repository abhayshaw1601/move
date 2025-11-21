"use strict";
// Feature: ai-provenance-pro, Property 17: Shard Reassembly Round-Trip
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
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const fast_check_1 = __importDefault(require("fast-check"));
// We don't export DEFAULT_CONFIG today; this will be wired later when needed.
// NOTE: This is a stub property test. Walrus HTTP calls should be mocked in
// a real test environment; here we focus on wiring and file splitting logic.
describe("Property 17: Shard Reassembly Round-Trip", () => {
    it("round-trips file content through shard split and reassembly (stub)", async () => {
        await fast_check_1.default.assert(fast_check_1.default.asyncProperty(fast_check_1.default.uint8Array({ minLength: 1, maxLength: 1024 * 2 }), async (data) => {
            const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "prop17-"));
            const srcPath = path.join(tmpDir, "src.bin");
            const outPath = path.join(tmpDir, "out.bin");
            await fs.promises.writeFile(srcPath, Buffer.from(data));
            // In a real test, mock Walrus API and reuse split logic only.
            const cfg = { ...INTERNAL_DEFAULT_CONFIG, walrus_api: "http://localhost:0" };
            // Here we bypass actual network calls and only verify splitting behavior.
            const stat = await fs.promises.stat(srcPath);
            expect(stat.size).toBe(data.length);
            // TODO: replace with pure split/merge helpers that do not hit network.
        }), { numRuns: 10 });
    });
});
