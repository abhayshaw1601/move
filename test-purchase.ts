/**
 * Purchase Access Test - Buy Premium Repository Access
 * Tests buy_access function with payment processing
 */

import { SuiClient } from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";
import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";

const PRIVATE_KEY = 'suiprivkey1qzpj7utsapwa89c0zup3m493a2xru0y49vyrd9ketg4tqn7cgjg0jxetuc4';
const PACKAGE_ID = '0xd8d7e4ac6cddf9d7c182f9163d45918afd6c9581a0605f07f1e6f31850bd448d';

class PurchaseTest {
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

  private log(msg: string, icon: string = '📋') {
    console.log(`${icon} ${msg}`);
  }

  async run() {
    console.log('\n' + '='.repeat(80));
    console.log('  PURCHASE ACCESS TEST - Buy Premium Repository');
    console.log('='.repeat(80) + '\n');

    try {
      // Check initial balance
      await this.checkBalance('Initial');

      // Create a PAID repository (0.01 SUI)
      await this.createPaidRepository();

      // Commit a version to the repository
      await this.commitVersion();

      // Check repository details
      await this.checkRepositoryDetails();

      // Purchase access to the repository
      await this.purchaseAccess();

      // Check final balance
      await this.checkBalance('After Purchase');

      // Verify purchase was recorded
      await this.verifyPurchase();

      console.log('\n' + '='.repeat(80));
      console.log('  ✅ SUCCESS! Purchase completed successfully');
      console.log('='.repeat(80));
      console.log(`\nRepository: https://suiscan.xyz/testnet/object/${this.repoId}\n`);

    } catch (error: any) {
      console.error(`\n❌ ERROR: ${error.message}`);
      throw error;
    }
  }

  async checkBalance(label: string) {
    const balance = await this.client.getBalance({ owner: this.address });
    const sui = Number(balance.totalBalance) / 1_000_000_000;
    
    this.log(`${label} Balance: ${sui.toFixed(4)} SUI`, '💰');
  }

  async createPaidRepository() {
    this.log('Creating PAID repository (Price: 0.01 SUI)...', '🏪');
    
    const tx = new Transaction();
    tx.setGasBudget(100_000_000);
    
    const encoder = new TextEncoder();
    const name = `Premium-Model-${Date.now()}`;
    const nameBytes = Array.from(encoder.encode(name));
    const price = 10_000_000; // 0.01 SUI
    
    tx.moveCall({
      target: `${PACKAGE_ID}::version_fs::create_repository`,
      arguments: [
        tx.pure.vector('u8', nameBytes),
        tx.pure.u64(price),
      ],
    });
    
    const result = await this.client.signAndExecuteTransaction({
      signer: this.keypair,
      transaction: tx,
      options: { showEffects: true, showObjectChanges: true, showEvents: true },
    });
    
    this.log(`Transaction: ${result.digest}`, '📝');
    
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
        this.log(`Repository ID: ${id}`, '🆔');
      } else if (type.includes('::RepoCap')) {
        this.capId = id;
        this.log(`Capability ID: ${id}`, '🔑');
      }
    }
    
    await new Promise(r => setTimeout(r, 3000));
  }

  async commitVersion() {
    this.log('Committing premium model version...', '📦');
    
    const tx = new Transaction();
    tx.setGasBudget(100_000_000);
    
    const encoder = new TextEncoder();
    const branch = Array.from(encoder.encode('main'));
    const message = Array.from(encoder.encode('Premium AI Model v1.0'));
    const rootBlob = Array.from(encoder.encode('premium-model-root'));
    
    const metricKeys = ['Accuracy', 'Loss', 'F1-Score', 'Precision'];
    const metricVals = ['98.5', '0.08', '0.97', '0.98'];
    const metricKeysBytes = metricKeys.map(k => Array.from(encoder.encode(k)));
    const metricValsBytes = metricVals.map(v => Array.from(encoder.encode(v)));
    
    const shardIds = [
      Array.from(encoder.encode('premium-shard-1')),
      Array.from(encoder.encode('premium-shard-2')),
      Array.from(encoder.encode('premium-shard-3'))
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
        tx.pure.u64(BigInt(5_000_000_000)), // 5 GB
      ],
    });
    
    const result = await this.client.signAndExecuteTransaction({
      signer: this.keypair,
      transaction: tx,
      options: { showEffects: true },
    });
    
    this.log(`Version committed: ${result.digest}`, '✅');
    await new Promise(r => setTimeout(r, 3000));
  }

  async checkRepositoryDetails() {
    this.log('Checking repository details...', '🔍');
    
    const repo = await this.client.getObject({
      id: this.repoId,
      options: { showContent: true }
    });
    
    if (repo.data?.content && repo.data.content.dataType === 'moveObject') {
      const fields = (repo.data.content as any).fields;
      
      console.log('\n┌─────────────────────────────────────────┐');
      console.log('│  Repository Information                 │');
      console.log('├─────────────────────────────────────────┤');
      console.log(`│  Name: ${fields.name.padEnd(30)} │`);
      console.log(`│  Owner: ${fields.owner.substring(0, 10)}...${fields.owner.substring(fields.owner.length - 8).padEnd(17)} │`);
      console.log(`│  Price: ${(Number(fields.price) / 1_000_000_000).toFixed(3)} SUI${' '.repeat(24)} │`);
      console.log(`│  Trust Score: ${fields.trust_score.padEnd(24)} │`);
      console.log(`│  Version Count: ${fields.version_count.padEnd(22)} │`);
      console.log(`│  Total Revenue: ${(Number(fields.total_revenue) / 1_000_000_000).toFixed(3)} SUI${' '.repeat(17)} │`);
      console.log('└─────────────────────────────────────────┘\n');
    }
  }

  async purchaseAccess() {
    this.log('Purchasing access to premium repository...', '💳');
    
    const tx = new Transaction();
    tx.setGasBudget(100_000_000);
    
    // Split coins for payment (0.01 SUI = 10,000,000 MIST)
    const paymentAmount = 10_000_000;
    const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(paymentAmount)]);
    
    tx.moveCall({
      target: `${PACKAGE_ID}::version_fs::buy_access`,
      arguments: [
        tx.sharedObjectRef({
          objectId: this.repoId,
          initialSharedVersion: this.sharedVersion,
          mutable: true
        }),
        paymentCoin,
      ],
    });
    
    const result = await this.client.signAndExecuteTransaction({
      signer: this.keypair,
      transaction: tx,
      options: { showEffects: true, showEvents: true, showObjectChanges: true },
    });
    
    this.log(`Purchase Transaction: ${result.digest}`, '✅');
    this.log(`Gas Used: ${result.effects?.gasUsed?.computationCost} MIST`, '⛽');
    
    // Check events
    if (result.events && result.events.length > 0) {
      this.log(`\nEvents emitted: ${result.events.length}`, '📢');
      result.events.forEach((event: any, i: number) => {
        const eventType = event.type.split('::').pop();
        this.log(`  Event ${i + 1}: ${eventType}`, '  📌');
        
        if (event.parsedJson) {
          if (event.parsedJson.buyer) {
            this.log(`    Buyer: ${event.parsedJson.buyer.substring(0, 20)}...`, '    👤');
          }
          if (event.parsedJson.amount) {
            this.log(`    Amount: ${Number(event.parsedJson.amount) / 1_000_000_000} SUI`, '    💵');
          }
        }
      });
    }
    
    await new Promise(r => setTimeout(r, 3000));
  }

  async verifyPurchase() {
    this.log('Verifying purchase was recorded...', '🔎');
    
    const repo = await this.client.getObject({
      id: this.repoId,
      options: { showContent: true }
    });
    
    if (repo.data?.content && repo.data.content.dataType === 'moveObject') {
      const fields = (repo.data.content as any).fields;
      const revenue = Number(fields.total_revenue) / 1_000_000_000;
      
      if (revenue > 0) {
        this.log(`✅ Purchase verified! Repository revenue: ${revenue.toFixed(3)} SUI`, '💰');
      } else {
        this.log(`⚠️  Warning: Revenue not updated yet (may take a moment)`, '⚠️');
      }
    }
    
    // Query AccessPurchased events
    try {
      const events = await this.client.queryEvents({
        query: { MoveEventType: `${PACKAGE_ID}::version_fs::AccessPurchased` },
        limit: 10
      });
      
      const repoEvents = events.data.filter((e: any) => 
        e.parsedJson?.repo_id === this.repoId
      );
      
      this.log(`\nTotal purchases for this repository: ${repoEvents.length}`, '📊');
    } catch (error) {
      this.log('Could not query purchase events', '⚠️');
    }
  }
}

// Run the test
const test = new PurchaseTest();
test.run().catch(console.error);
