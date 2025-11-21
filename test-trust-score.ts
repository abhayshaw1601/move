/**
 * Trust Score Test - Verify Repository Multiple Times
 * Tests Bronze → Silver → Gold badge progression
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

class TrustScoreTest {
  private client: SuiClient;
  private keypair: Ed25519Keypair;
  private address: string;
  private repoId: string = '';
  private capId: string = '';
  private sharedVersion: string = '';

  constructor() {
    this.client = new SuiClient({ url: 'https://fullnode.testnet.sui.io:443' });
    const { secretKey } = decodeSuiPrivateKey(PRIVATE_KEY);
    this.keypair = Ed25519Keypair.fromSecretKey(secretKey);
    this.address = this.keypair.toSuiAddress();
  }

  private log(msg: string, badge?: string) {
    const timestamp = new Date().toISOString();
    if (badge) {
      console.log(`[${timestamp}] ${msg} ${badge}`);
    } else {
      console.log(`[${timestamp}] ${msg}`);
    }
  }

  async run() {
    console.log('\n' + '='.repeat(80));
    console.log('  TRUST SCORE TEST - Bronze → Silver → Gold Progression');
    console.log('='.repeat(80) + '\n');

    try {
      // Step 1: Create repository
      await this.createRepository();
      
      // Step 2: Commit initial version
      await this.commitVersion();
      
      // Step 3: Check initial trust score (should be 0 - Bronze)
      await this.checkTrustScore('Initial');
      await this.generateReport('bronze');
      
      // Step 4: Verify 50 times to reach Silver (50-99)
      this.log('\n🔄 Verifying 50 times to reach SILVER badge...');
      for (let i = 1; i <= 50; i++) {
        await this.verifyReproducibility(i);
        if (i % 10 === 0) {
          await this.checkTrustScore(`After ${i} verifications`);
        }
      }
      await this.generateReport('silver');
      
      // Step 5: Verify 50 more times to reach Gold (100+)
      this.log('\n🔄 Verifying 50 more times to reach GOLD badge...');
      for (let i = 51; i <= 100; i++) {
        await this.verifyReproducibility(i);
        if (i % 10 === 0) {
          await this.checkTrustScore(`After ${i} verifications`);
        }
      }
      await this.generateReport('gold');
      
      // Step 6: Verify 10 more times to confirm Gold stays
      this.log('\n🔄 Verifying 10 more times to confirm GOLD badge...');
      for (let i = 101; i <= 110; i++) {
        await this.verifyReproducibility(i);
      }
      await this.checkTrustScore('Final');
      await this.generateReport('gold-final');

      console.log('\n' + '='.repeat(80));
      console.log('  SUCCESS! Trust Score Progression Complete');
      console.log('='.repeat(80));
      console.log(`\nRepository: https://suiscan.xyz/testnet/object/${this.repoId}`);
      console.log(`\nReports Generated:`);
      console.log(`  - trust-score-bronze.html (Score: 0)`);
      console.log(`  - trust-score-silver.html (Score: 50)`);
      console.log(`  - trust-score-gold.html (Score: 100)`);
      console.log(`  - trust-score-gold-final.html (Score: 110)\n`);

    } catch (error: any) {
      console.error(`\nERROR: ${error.message}`);
      throw error;
    }
  }

  async createRepository() {
    this.log('Creating repository for trust score test...');
    
    const tx = new Transaction();
    tx.setGasBudget(100_000_000);
    
    const encoder = new TextEncoder();
    const name = `TrustScore-Test-${Date.now()}`;
    const nameBytes = Array.from(encoder.encode(name));
    
    tx.moveCall({
      target: `${PACKAGE_ID}::version_fs::create_repository`,
      arguments: [
        tx.pure.vector('u8', nameBytes),
        tx.pure.u64(0), // Free
      ],
    });
    
    const result = await this.client.signAndExecuteTransaction({
      signer: this.keypair,
      transaction: tx,
      options: { showEffects: true, showObjectChanges: true },
    });
    
    const created = result.objectChanges?.filter((c: any) => c.type === 'created') || [];
    for (const obj of created) {
      const type = (obj as any).objectType || '';
      const id = (obj as any).objectId;
      
      if (type.includes('::Repository')) {
        this.repoId = id;
        const owner = (obj as any).owner;
        if (owner?.Shared) {
          this.sharedVersion = owner.Shared.initial_shared_version.toString();
        }
      } else if (type.includes('::RepoCap')) {
        this.capId = id;
      }
    }
    
    this.log(`Repository created: ${this.repoId}`);
    await new Promise(r => setTimeout(r, 2000));
  }

  async commitVersion() {
    this.log('Committing initial version...');
    
    const tx = new Transaction();
    tx.setGasBudget(100_000_000);
    
    const encoder = new TextEncoder();
    const branch = Array.from(encoder.encode('main'));
    const message = Array.from(encoder.encode('Trust score test model'));
    const rootBlob = Array.from(encoder.encode('trust-test-model'));
    
    const metricKeys = ['Accuracy', 'Loss'];
    const metricVals = ['95.0', '0.15'];
    const metricKeysBytes = metricKeys.map(k => Array.from(encoder.encode(k)));
    const metricValsBytes = metricVals.map(v => Array.from(encoder.encode(v)));
    
    const shardIds = [
      Array.from(encoder.encode('shard-1')),
      Array.from(encoder.encode('shard-2'))
    ];
    
    tx.moveCall({
      target: `${PACKAGE_ID}::version_fs::commit`,
      arguments: [
        tx.sharedObjectRef({
          objectId: this.repoId,
          initialSharedVersion: this.sharedVersion,
          mutable: true
        }),
        tx.object(this.capId),
        tx.pure.vector('u8', branch),
        tx.pure.vector('u8', rootBlob),
        tx.pure.vector('id', []),
        tx.pure.vector('u8', message),
        tx.pure.vector('vector<u8>', metricKeysBytes),
        tx.pure.vector('vector<u8>', metricValsBytes),
        tx.pure.vector('vector<u8>', shardIds),
        tx.pure.vector('id', []),
        tx.pure.u64(BigInt(1_000_000_000)),
      ],
    });
    
    await this.client.signAndExecuteTransaction({
      signer: this.keypair,
      transaction: tx,
      options: { showEffects: true },
    });
    
    this.log('Version committed');
    await new Promise(r => setTimeout(r, 2000));
  }

  async verifyReproducibility(count: number) {
    const tx = new Transaction();
    tx.setGasBudget(100_000_000);
    
    // Create a 64-byte signature (required by smart contract)
    const mockSignature = new Array(64).fill(0).map((_, i) => (count + i) % 256);
    
    tx.moveCall({
      target: `${PACKAGE_ID}::version_fs::verify_reproducibility`,
      arguments: [
        tx.sharedObjectRef({
          objectId: this.repoId,
          initialSharedVersion: this.sharedVersion,
          mutable: true
        }),
        tx.pure.vector('u8', mockSignature),
      ],
    });
    
    try {
      await this.client.signAndExecuteTransaction({
        signer: this.keypair,
        transaction: tx,
        options: { showEffects: true },
      });
      
      // Delay to allow blockchain to process
      await new Promise(r => setTimeout(r, 1000));
    } catch (error: any) {
      // If version conflict, wait longer and retry once
      if (error.message?.includes('not available for consumption')) {
        await new Promise(r => setTimeout(r, 3000));
        await this.client.signAndExecuteTransaction({
          signer: this.keypair,
          transaction: tx,
          options: { showEffects: true },
        });
        await new Promise(r => setTimeout(r, 1000));
      } else {
        throw error;
      }
    }
  }

  async checkTrustScore(label: string) {
    const repo = await this.client.getObject({
      id: this.repoId,
      options: { showContent: true }
    });
    
    if (repo.data?.content && repo.data.content.dataType === 'moveObject') {
      const fields = (repo.data.content as any).fields;
      const trustScore = parseInt(fields.trust_score || '0');
      
      let badge = '🥉 BRONZE';
      if (trustScore >= 100) badge = '🥇 GOLD';
      else if (trustScore >= 50) badge = '🥈 SILVER';
      
      this.log(`${label}: Trust Score = ${trustScore}`, badge);
    }
  }

  async generateReport(filename: string) {
    this.log(`Generating audit report: trust-score-${filename}.html`);
    
    try {
      await execAsync(
        `npm run cli -- audit-report --repo ${this.repoId} --out ./trust-score-${filename}.html`,
        { timeout: 60000 }
      );
      this.log(`Report generated successfully`);
    } catch (error: any) {
      this.log(`Warning: Report generation had issues: ${error.message}`);
    }
  }
}

// Run the test
const test = new TrustScoreTest();
test.run().catch(console.error);
