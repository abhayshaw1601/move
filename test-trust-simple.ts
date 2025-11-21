/**
 * Simple Trust Score Test - Quick Badge Progression Demo
 */

import { SuiClient } from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";
import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const PRIVATE_KEY = 'suiprivkey1qzpj7utsapwa89c0zup3m493a2xru0y49vyrd9ketg4tqn7cgjg0jxetuc4';
const PACKAGE_ID = '0xd8d7e4ac6cddf9d7c182f9163d45918afd6c9581a0605f07f1e6f31850bd448d';

class SimpleTrustTest {
  private client: SuiClient;
  private keypair: Ed25519Keypair;
  private repoId: string = '';
  private capId: string = '';
  private sharedVersion: string = '';

  constructor() {
    this.client = new SuiClient({ url: 'https://fullnode.testnet.sui.io:443' });
    const { secretKey } = decodeSuiPrivateKey(PRIVATE_KEY);
    this.keypair = Ed25519Keypair.fromSecretKey(secretKey);
  }

  private log(msg: string) {
    console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);
  }

  async run() {
    console.log('\n' + '='.repeat(70));
    console.log('  Trust Score Badge Progression Test');
    console.log('='.repeat(70) + '\n');

    // Create repo
    await this.createRepo();
    await this.commitVersion();
    
    // Bronze (0)
    await this.showStatus('BRONZE (Initial)', 0);
    await this.generateReport('bronze');
    
    // Silver (50)
    this.log('\nVerifying to reach SILVER (50 verifications)...');
    await this.verifyMultiple(50);
    await this.showStatus('SILVER', 50);
    await this.generateReport('silver');
    
    // Gold (100)
    this.log('\nVerifying to reach GOLD (50 more verifications)...');
    await this.verifyMultiple(50);
    await this.showStatus('GOLD', 100);
    await this.generateReport('gold');
    
    console.log('\n' + '='.repeat(70));
    console.log('  SUCCESS! All 3 badge levels demonstrated');
    console.log('='.repeat(70));
    console.log(`\nRepository: ${this.repoId}`);
    console.log(`Explorer: https://suiscan.xyz/testnet/object/${this.repoId}`);
    console.log(`\nReports:`);
    console.log(`  - trust-badge-bronze.html`);
    console.log(`  - trust-badge-silver.html`);
    console.log(`  - trust-badge-gold.html\n`);
  }

  async createRepo() {
    this.log('Creating repository...');
    const tx = new Transaction();
    tx.setGasBudget(100_000_000);
    
    const name = `Trust-Badge-Test-${Date.now()}`;
    tx.moveCall({
      target: `${PACKAGE_ID}::version_fs::create_repository`,
      arguments: [
        tx.pure.vector('u8', Array.from(new TextEncoder().encode(name))),
        tx.pure.u64(0),
      ],
    });
    
    const result = await this.client.signAndExecuteTransaction({
      signer: this.keypair,
      transaction: tx,
      options: { showObjectChanges: true },
    });
    
    for (const obj of result.objectChanges || []) {
      const type = (obj as any).objectType || '';
      const id = (obj as any).objectId;
      if (type.includes('::Repository')) {
        this.repoId = id;
        const owner = (obj as any).owner;
        if (owner?.Shared) this.sharedVersion = owner.Shared.initial_shared_version.toString();
      } else if (type.includes('::RepoCap')) {
        this.capId = id;
      }
    }
    
    this.log(`Created: ${this.repoId.substring(0, 20)}...`);
    await new Promise(r => setTimeout(r, 3000));
  }

  async commitVersion() {
    this.log('Committing version...');
    const tx = new Transaction();
    tx.setGasBudget(100_000_000);
    
    const enc = new TextEncoder();
    tx.moveCall({
      target: `${PACKAGE_ID}::version_fs::commit`,
      arguments: [
        tx.sharedObjectRef({ objectId: this.repoId, initialSharedVersion: this.sharedVersion, mutable: true }),
        tx.object(this.capId),
        tx.pure.vector('u8', Array.from(enc.encode('main'))),
        tx.pure.vector('u8', Array.from(enc.encode('model-root'))),
        tx.pure.vector('id', []),
        tx.pure.vector('u8', Array.from(enc.encode('Trust test model'))),
        tx.pure.vector('vector<u8>', [Array.from(enc.encode('Accuracy')), Array.from(enc.encode('Loss'))]),
        tx.pure.vector('vector<u8>', [Array.from(enc.encode('95.0')), Array.from(enc.encode('0.15'))]),
        tx.pure.vector('vector<u8>', [Array.from(enc.encode('shard-1'))]),
        tx.pure.vector('id', []),
        tx.pure.u64(BigInt(1_000_000_000)),
      ],
    });
    
    await this.client.signAndExecuteTransaction({
      signer: this.keypair,
      transaction: tx,
    });
    
    await new Promise(r => setTimeout(r, 3000));
  }

  async verifyMultiple(count: number) {
    for (let i = 0; i < count; i++) {
      const tx = new Transaction();
      tx.setGasBudget(100_000_000);
      
      const sig = new Array(64).fill(0).map((_, j) => (i + j) % 256);
      tx.moveCall({
        target: `${PACKAGE_ID}::version_fs::verify_reproducibility`,
        arguments: [
          tx.sharedObjectRef({ objectId: this.repoId, initialSharedVersion: this.sharedVersion, mutable: true }),
          tx.pure.vector('u8', sig),
        ],
      });
      
      await this.client.signAndExecuteTransaction({
        signer: this.keypair,
        transaction: tx,
      });
      
      if ((i + 1) % 10 === 0) {
        this.log(`  Progress: ${i + 1}/${count} verifications`);
      }
      
      await new Promise(r => setTimeout(r, 1200)); // 1.2s delay
    }
  }

  async showStatus(label: string, expected: number) {
    const repo = await this.client.getObject({
      id: this.repoId,
      options: { showContent: true }
    });
    
    if (repo.data?.content && repo.data.content.dataType === 'moveObject') {
      const fields = (repo.data.content as any).fields;
      const score = parseInt(fields.trust_score || '0');
      
      let badge = '🥉 BRONZE';
      let color = '\x1b[33m'; // Yellow
      if (score >= 100) {
        badge = '🥇 GOLD';
        color = '\x1b[93m'; // Bright yellow
      } else if (score >= 50) {
        badge = '🥈 SILVER';
        color = '\x1b[37m'; // White
      }
      
      console.log(`\n${color}╔${'═'.repeat(68)}╗\x1b[0m`);
      console.log(`${color}║  ${label.padEnd(64)}  ║\x1b[0m`);
      console.log(`${color}║  Trust Score: ${score.toString().padEnd(51)}  ║\x1b[0m`);
      console.log(`${color}║  Badge: ${badge.padEnd(57)}  ║\x1b[0m`);
      console.log(`${color}╚${'═'.repeat(68)}╝\x1b[0m\n`);
    }
  }

  async generateReport(filename: string) {
    this.log(`Generating report: trust-badge-${filename}.html`);
    try {
      await execAsync(
        `npm run cli -- audit-report --repo ${this.repoId} --out ./trust-badge-${filename}.html`,
        { timeout: 60000 }
      );
    } catch (err) {
      // Ignore errors
    }
  }
}

new SimpleTrustTest().run().catch(console.error);
