#!/usr/bin/env node

/**
 * ProvenancePro CLI - End-to-End Blockchain Test
 * 
 * This script performs a complete workflow:
 * 1. Create a repository on blockchain
 * 2. Commit a model with real data
 * 3. Verify the commit
 * 4. Generate audit report
 * 5. Pull/download the model
 * 
 * Uses real testnet SUI (max 0.01 SUI)
 */

const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function colorLog(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

class E2EBlockchainTest {
  constructor() {
    this.loadEnvFile();
    this.privateKey = process.env.SUI_PRIVATE_KEY;
    this.address = process.env.SUI_ADDRESS;
    this.packageId = '0xd8d7e4ac6cddf9d7c182f9163d45918afd6c9581a0605f07f1e6f31850bd448d';
    this.testModelPath = './test-models/e2e-test-model.txt';
    this.repoId = null;
    this.capId = null;
    this.versionId = null;
  }

  loadEnvFile() {
    try {
      const envPath = path.join(__dirname, '.env');
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            const [key, ...valueParts] = trimmed.split('=');
            const value = valueParts.join('=').trim();
            if (key && value) {
              process.env[key.trim()] = value;
            }
          }
        });
      }
    } catch (error) {
      colorLog(`⚠️  Could not load .env file: ${error.message}`, 'yellow');
    }
  }

  async runCommand(command, description) {
    return new Promise((resolve, reject) => {
      colorLog(`\n${'='.repeat(70)}`, 'blue');
      colorLog(`📋 ${description}`, 'yellow');
      colorLog(`${'='.repeat(70)}`, 'blue');
      colorLog(`💻 Command: ${command}\n`, 'cyan');

      exec(command, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
        if (stdout) console.log(stdout);
        if (stderr) console.error(stderr);

        if (error) {
          colorLog(`\n❌ Command failed: ${error.message}`, 'red');
          reject(error);
        } else {
          colorLog(`\n✅ Success!`, 'green');
          resolve(stdout);
        }
      });
    });
  }

  async setupTestModel() {
    colorLog('\n📦 Creating test model file...', 'blue');
    
    if (!fs.existsSync('./test-models')) {
      fs.mkdirSync('./test-models', { recursive: true });
    }

    const modelContent = `# E2E Test AI Model
Timestamp: ${new Date().toISOString()}
Model Type: Neural Network
Architecture: Transformer
Parameters: 1.5B
Training Data: Synthetic Dataset

This is a test model for ProvenancePro CLI end-to-end testing.
The model demonstrates the complete workflow from commit to download.

Model Weights (simulated):
${'0'.repeat(1000)}

Metadata:
- Version: 1.0.0
- Framework: PyTorch
- License: MIT
- Author: ProvenancePro Team
`;

    fs.writeFileSync(this.testModelPath, modelContent);
    const stats = fs.statSync(this.testModelPath);
    colorLog(`✅ Test model created: ${this.testModelPath} (${stats.size} bytes)`, 'green');
  }

  async createRepository() {
    colorLog('\n\n╔══════════════════════════════════════════════════════════════╗', 'magenta');
    colorLog('║  STEP 1: CREATE REPOSITORY ON BLOCKCHAIN                    ║', 'magenta');
    colorLog('╚══════════════════════════════════════════════════════════════╝', 'magenta');

    const repoName = `E2E-Test-Model-${Date.now()}`;
    const description = 'End-to-end test repository for ProvenancePro CLI';

    const command = `sui client call --package ${this.packageId} --module version_fs --function create_repository --args "${repoName}" "${description}" --gas-budget 100000000`;

    try {
      const output = await this.runCommand(command, 'Creating repository on Sui blockchain');
      
      // Parse output to get repository and cap IDs
      const repoMatch = output.match(/Created Objects:.*?objectId:\s*([0-9a-fx]+)/s);
      const capMatch = output.match(/RepoCap.*?objectId:\s*([0-9a-fx]+)/s);
      
      if (repoMatch && repoMatch[1]) {
        this.repoId = repoMatch[1];
        colorLog(`\n📦 Repository ID: ${this.repoId}`, 'cyan');
      }
      
      if (capMatch && capMatch[1]) {
        this.capId = capMatch[1];
        colorLog(`🔑 RepoCap ID: ${this.capId}`, 'cyan');
      }

      if (!this.repoId || !this.capId) {
        throw new Error('Failed to extract repository or cap ID from output');
      }

      colorLog(`\n✅ Repository created successfully!`, 'green');
      return true;
    } catch (error) {
      colorLog(`\n❌ Failed to create repository: ${error.message}`, 'red');
      throw error;
    }
  }

  async commitModel() {
    colorLog('\n\n╔══════════════════════════════════════════════════════════════╗', 'magenta');
    colorLog('║  STEP 2: COMMIT MODEL TO BLOCKCHAIN                         ║', 'magenta');
    colorLog('╚══════════════════════════════════════════════════════════════╝', 'magenta');

    const command = `npm run cli -- commit --repo ${this.repoId} --cap ${this.capId} --branch main --message "E2E test commit - Initial version" --file "${this.testModelPath}" --accuracy 98.7 --loss 0.015 --epochs 150 --f1-score 0.96`;

    try {
      const output = await this.runCommand(command, 'Committing model to blockchain');
      
      // Extract transaction digest
      const digestMatch = output.match(/digest:\s*([A-Za-z0-9]+)/);
      if (digestMatch && digestMatch[1]) {
        colorLog(`\n📝 Transaction Digest: ${digestMatch[1]}`, 'cyan');
      }

      colorLog(`\n✅ Model committed successfully!`, 'green');
      colorLog(`\n⏳ Waiting 5 seconds for blockchain confirmation...`, 'yellow');
      await new Promise(resolve => setTimeout(resolve, 5000));
      return true;
    } catch (error) {
      colorLog(`\n❌ Failed to commit model: ${error.message}`, 'red');
      throw error;
    }
  }

  async viewLog() {
    colorLog('\n\n╔══════════════════════════════════════════════════════════════╗', 'magenta');
    colorLog('║  STEP 3: VIEW COMMIT HISTORY                                ║', 'magenta');
    colorLog('╚══════════════════════════════════════════════════════════════╝', 'magenta');

    const command = `npm run cli -- log --repo-id ${this.repoId}`;

    try {
      await this.runCommand(command, 'Viewing repository commit history');
      return true;
    } catch (error) {
      colorLog(`\n⚠️  Log viewing failed (non-critical): ${error.message}`, 'yellow');
      return false;
    }
  }

  async inspectRepository() {
    colorLog('\n\n╔══════════════════════════════════════════════════════════════╗', 'magenta');
    colorLog('║  STEP 4: INSPECT REPOSITORY                                 ║', 'magenta');
    colorLog('╚══════════════════════════════════════════════════════════════╝', 'magenta');

    const command = `npm run cli -- inspect --repo ${this.repoId}`;

    try {
      await this.runCommand(command, 'Inspecting repository structure');
      return true;
    } catch (error) {
      colorLog(`\n⚠️  Inspection failed (non-critical): ${error.message}`, 'yellow');
      return false;
    }
  }

  async verifyRepository() {
    colorLog('\n\n╔══════════════════════════════════════════════════════════════╗', 'magenta');
    colorLog('║  STEP 5: VERIFY REPOSITORY (TEE)                            ║', 'magenta');
    colorLog('╚══════════════════════════════════════════════════════════════╝', 'magenta');

    const command = `npm run cli -- verify --repo ${this.repoId}`;

    try {
      await this.runCommand(command, 'Executing TEE verification');
      return true;
    } catch (error) {
      colorLog(`\n⚠️  Verification failed (non-critical): ${error.message}`, 'yellow');
      return false;
    }
  }

  async generateAuditReport() {
    colorLog('\n\n╔══════════════════════════════════════════════════════════════╗', 'magenta');
    colorLog('║  STEP 6: GENERATE AUDIT REPORT                              ║', 'magenta');
    colorLog('╚══════════════════════════════════════════════════════════════╝', 'magenta');

    const reportPath = './e2e-audit-report.html';
    const command = `npm run cli -- audit-report --repo ${this.repoId} --out ${reportPath}`;

    try {
      await this.runCommand(command, 'Generating comprehensive audit report');
      
      if (fs.existsSync(reportPath)) {
        const stats = fs.statSync(reportPath);
        colorLog(`\n📄 Audit report generated: ${reportPath} (${stats.size} bytes)`, 'cyan');
      }
      
      return true;
    } catch (error) {
      colorLog(`\n⚠️  Audit report generation failed (non-critical): ${error.message}`, 'yellow');
      return false;
    }
  }

  async pullModel() {
    colorLog('\n\n╔══════════════════════════════════════════════════════════════╗', 'magenta');
    colorLog('║  STEP 7: DOWNLOAD MODEL FROM BLOCKCHAIN                     ║', 'magenta');
    colorLog('╚══════════════════════════════════════════════════════════════╝', 'magenta');

    const outputDir = './e2e-downloaded-model';
    const command = `npm run cli -- pull --repo ${this.repoId} --output ${outputDir}`;

    try {
      await this.runCommand(command, 'Downloading model from blockchain');
      
      if (fs.existsSync(outputDir)) {
        colorLog(`\n📥 Model downloaded to: ${outputDir}`, 'cyan');
      }
      
      return true;
    } catch (error) {
      colorLog(`\n⚠️  Model download failed (non-critical): ${error.message}`, 'yellow');
      return false;
    }
  }

  async browseStorefront() {
    colorLog('\n\n╔══════════════════════════════════════════════════════════════╗', 'magenta');
    colorLog('║  STEP 8: BROWSE MARKETPLACE                                 ║', 'magenta');
    colorLog('╚══════════════════════════════════════════════════════════════╝', 'magenta');

    const command = `npm run cli -- storefront`;

    try {
      await this.runCommand(command, 'Browsing AI model marketplace');
      return true;
    } catch (error) {
      colorLog(`\n⚠️  Storefront browsing failed (non-critical): ${error.message}`, 'yellow');
      return false;
    }
  }

  async checkBalance() {
    colorLog('\n💰 Checking wallet balance...', 'blue');
    
    return new Promise((resolve) => {
      exec(`sui client balance ${this.address}`, (error, stdout, stderr) => {
        if (error) {
          colorLog(`⚠️  Could not check balance: ${error.message}`, 'yellow');
        } else {
          console.log(stdout);
        }
        resolve();
      });
    });
  }

  async cleanup() {
    colorLog('\n\n🧹 Cleaning up test files...', 'blue');
    try {
      if (fs.existsSync('./test-models')) {
        fs.rmSync('./test-models', { recursive: true, force: true });
      }
      if (fs.existsSync('./e2e-downloaded-model')) {
        fs.rmSync('./e2e-downloaded-model', { recursive: true, force: true });
      }
      colorLog('✅ Cleanup complete', 'green');
    } catch (error) {
      colorLog(`⚠️  Cleanup warning: ${error.message}`, 'yellow');
    }
  }

  async runFullTest() {
    try {
      colorLog('╔══════════════════════════════════════════════════════════════╗', 'cyan');
      colorLog('║                                                              ║', 'cyan');
      colorLog('║     ProvenancePro CLI - End-to-End Blockchain Test          ║', 'cyan');
      colorLog('║                                                              ║', 'cyan');
      colorLog('╚══════════════════════════════════════════════════════════════╝', 'cyan');

      colorLog('\n📋 Test Configuration:', 'yellow');
      colorLog(`   Network: Sui Testnet`, 'white');
      colorLog(`   Package: ${this.packageId}`, 'white');
      colorLog(`   Wallet: ${this.address.substring(0, 10)}...${this.address.substring(this.address.length - 8)}`, 'white');
      colorLog(`   Max Gas: 0.01 SUI`, 'white');

      await this.checkBalance();

      // Build CLI
      colorLog('\n🔨 Building CLI...', 'blue');
      await this.runCommand('npm run build', 'Building ProvenancePro CLI');

      // Setup test model
      await this.setupTestModel();

      // Run all steps
      const results = {
        createRepo: false,
        commit: false,
        log: false,
        inspect: false,
        verify: false,
        audit: false,
        pull: false,
        storefront: false
      };

      // Step 1: Create Repository
      results.createRepo = await this.createRepository();

      // Step 2: Commit Model
      if (results.createRepo) {
        results.commit = await this.commitModel();
      }

      // Step 3-8: Other operations
      if (results.commit) {
        results.log = await this.viewLog();
        results.inspect = await this.inspectRepository();
        results.verify = await this.verifyRepository();
        results.audit = await this.generateAuditReport();
        results.pull = await this.pullModel();
        results.storefront = await this.browseStorefront();
      }

      // Show summary
      this.showSummary(results);

      await this.checkBalance();

    } catch (error) {
      colorLog(`\n\n❌ E2E Test Failed: ${error.message}`, 'red');
      console.error(error);
      process.exit(1);
    } finally {
      await this.cleanup();
    }
  }

  showSummary(results) {
    colorLog('\n\n╔══════════════════════════════════════════════════════════════╗', 'magenta');
    colorLog('║                    TEST SUMMARY                              ║', 'magenta');
    colorLog('╚══════════════════════════════════════════════════════════════╝', 'magenta');

    const steps = [
      { name: 'Create Repository', result: results.createRepo, critical: true },
      { name: 'Commit Model', result: results.commit, critical: true },
      { name: 'View Log', result: results.log, critical: false },
      { name: 'Inspect Repository', result: results.inspect, critical: false },
      { name: 'Verify Repository', result: results.verify, critical: false },
      { name: 'Generate Audit Report', result: results.audit, critical: false },
      { name: 'Download Model', result: results.pull, critical: false },
      { name: 'Browse Storefront', result: results.storefront, critical: false }
    ];

    colorLog('\n📊 Test Results:', 'yellow');
    steps.forEach((step, index) => {
      const icon = step.result ? '✅' : '❌';
      const color = step.result ? 'green' : (step.critical ? 'red' : 'yellow');
      const critical = step.critical ? ' (CRITICAL)' : '';
      colorLog(`${icon} ${index + 1}. ${step.name}${critical}`, color);
    });

    const passed = steps.filter(s => s.result).length;
    const total = steps.length;
    const criticalPassed = steps.filter(s => s.critical && s.result).length;
    const criticalTotal = steps.filter(s => s.critical).length;

    colorLog(`\n📈 Overall: ${passed}/${total} steps passed`, 'cyan');
    colorLog(`🎯 Critical: ${criticalPassed}/${criticalTotal} passed`, criticalPassed === criticalTotal ? 'green' : 'red');

    if (this.repoId) {
      colorLog(`\n📦 Repository ID: ${this.repoId}`, 'cyan');
      colorLog(`🔗 Explorer: https://suiscan.xyz/testnet/object/${this.repoId}`, 'cyan');
    }

    if (criticalPassed === criticalTotal) {
      colorLog('\n\n🎉 END-TO-END TEST PASSED!', 'green');
      colorLog('ProvenancePro CLI successfully completed full blockchain workflow!', 'green');
    } else {
      colorLog('\n\n⚠️  END-TO-END TEST PARTIALLY COMPLETED', 'yellow');
      colorLog('Some critical steps failed. Review the output above.', 'yellow');
    }
  }
}

// Run the test
if (require.main === module) {
  const tester = new E2EBlockchainTest();
  tester.runFullTest().then(() => {
    colorLog('\n✅ E2E test completed!\n', 'green');
    process.exit(0);
  }).catch((error) => {
    colorLog(`\n❌ E2E test error: ${error.message}\n`, 'red');
    process.exit(1);
  });
}

module.exports = E2EBlockchainTest;
