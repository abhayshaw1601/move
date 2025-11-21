#!/usr/bin/env node

/**
 * ProvenancePro CLI - Automated Blockchain Test
 * Runs without interactive prompts for CI/CD
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

class AutoBlockchainTester {
  constructor() {
    this.loadEnvFile();
    this.testResults = [];
    this.privateKey = process.env.SUI_PRIVATE_KEY;
    this.address = process.env.SUI_ADDRESS;
    this.testAmount = process.env.TEST_AMOUNT || '0.001';
    this.testModelPath = './test-models/tiny-model.txt';
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
        colorLog('✅ Loaded .env file', 'green');
      }
    } catch (error) {
      colorLog(`⚠️  Could not load .env file: ${error.message}`, 'yellow');
    }
  }

  validateCredentials() {
    if (!this.privateKey || !this.address) {
      colorLog('\n❌ Missing credentials in .env file!', 'red');
      return false;
    }

    colorLog('\n✅ Credentials loaded from .env', 'green');
    colorLog(`   Address: ${this.address.substring(0, 10)}...${this.address.substring(this.address.length - 8)}`, 'cyan');
    return true;
  }

  async setupTestEnvironment() {
    colorLog('\n📦 Setting up test environment...', 'blue');
    
    if (!fs.existsSync('./test-models')) {
      fs.mkdirSync('./test-models', { recursive: true });
    }

    // Create a tiny test model
    const tinyModel = `Tiny AI model for testing - ProvenancePro
Timestamp: ${new Date().toISOString()}
Test data: ${'x'.repeat(100)}`;
    fs.writeFileSync(this.testModelPath, tinyModel);
    
    colorLog('✅ Test environment ready', 'green');
  }

  async runCLICommand(command, description, expectFailure = false) {
    return new Promise((resolve) => {
      colorLog(`\n🔧 ${description}`, 'yellow');
      colorLog(`   Command: npm run cli -- ${command}`, 'cyan');
      
      const args = command.split(' ');
      const child = spawn('npm', ['run', 'cli', '--', ...args], {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        process.stdout.write(output);
      });

      child.stderr.on('data', (data) => {
        const output = data.toString();
        stderr += output;
        process.stderr.write(output);
      });

      child.on('close', (code) => {
        const success = expectFailure ? code !== 0 : code === 0;
        
        if (success) {
          colorLog(`✅ ${description} - SUCCESS`, 'green');
          this.testResults.push({ test: description, passed: true, code });
          resolve(true);
        } else {
          colorLog(`❌ ${description} - FAILED (Exit code: ${code})`, 'red');
          this.testResults.push({ test: description, passed: false, code });
          resolve(false);
        }
      });

      child.on('error', (error) => {
        colorLog(`❌ ${description} - ERROR: ${error.message}`, 'red');
        this.testResults.push({ test: description, passed: false, error: error.message });
        resolve(false);
      });
    });
  }

  async runAllTests() {
    try {
      colorLog('========================================', 'magenta');
      colorLog('ProvenancePro CLI - Automated Blockchain Test', 'magenta');
      colorLog('========================================', 'magenta');

      if (!this.validateCredentials()) {
        process.exit(1);
      }

      await this.setupTestEnvironment();

      colorLog('\n========================================', 'blue');
      colorLog('Starting Blockchain Tests', 'blue');
      colorLog('========================================', 'blue');
      colorLog(`\n⚠️  Using testnet with minimal amounts: ${this.testAmount} SUI`, 'yellow');

      // Build CLI
      colorLog('\n🔨 Building CLI...', 'blue');
      await new Promise((resolve, reject) => {
        exec('npm run build', (error, stdout, stderr) => {
          if (error) {
            colorLog('❌ Build failed', 'red');
            console.error(stderr);
            reject(error);
          } else {
            colorLog('✅ Build complete', 'green');
            resolve();
          }
        });
      });

      // Test 1: Help commands (should always work)
      colorLog('\n\n=== TEST 1: BASIC COMMANDS ===', 'cyan');
      await this.runCLICommand('--help', 'Display help');
      await this.runCLICommand('--version', 'Display version');

      // Test 2: Commit a model
      colorLog('\n\n=== TEST 2: COMMIT MODEL ===', 'cyan');
      const modelName = `TestModel-${Date.now()}`;
      await this.runCLICommand(
        `commit --path "${this.testModelPath}" --name "${modelName}" --description "Automated test model" --private-key "${this.privateKey}"`,
        'Commit test model to blockchain'
      );

      // Wait for blockchain confirmation
      colorLog('\n⏳ Waiting 10 seconds for blockchain confirmation...', 'yellow');
      await new Promise(resolve => setTimeout(resolve, 10000));

      // Test 3: List repositories
      colorLog('\n\n=== TEST 3: LOG REPOSITORIES ===', 'cyan');
      await this.runCLICommand('log', 'List all repositories');

      // Test 4: Log with filter
      colorLog('\n\n=== TEST 4: LOG WITH FILTER ===', 'cyan');
      await this.runCLICommand(`log --repo-name "${modelName}"`, 'List filtered repositories');

      // Test 5: Inspect repository
      colorLog('\n\n=== TEST 5: INSPECT REPOSITORY ===', 'cyan');
      await this.runCLICommand(
        `inspect --repo ${this.address}`,
        'Inspect repository details'
      );

      // Test 6: Verify repository
      colorLog('\n\n=== TEST 6: VERIFY REPOSITORY ===', 'cyan');
      await this.runCLICommand(
        `verify --repo ${this.address}`,
        'Verify repository integrity'
      );

      // Test 7: Audit report
      colorLog('\n\n=== TEST 7: AUDIT REPORT ===', 'cyan');
      await this.runCLICommand(
        `audit-report --repo ${this.address} --out ./test-audit-report.html`,
        'Generate audit report'
      );

      // Test 8: Storefront
      colorLog('\n\n=== TEST 8: STOREFRONT ===', 'cyan');
      await this.runCLICommand('storefront', 'Browse marketplace');

      // Test 9: Pull model
      colorLog('\n\n=== TEST 9: PULL MODEL ===', 'cyan');
      if (!fs.existsSync('./test-output')) {
        fs.mkdirSync('./test-output', { recursive: true });
      }
      await this.runCLICommand(
        `pull --repo ${this.address} --output ./test-output`,
        'Download model from blockchain'
      );

      this.showSummary();

    } catch (error) {
      colorLog(`\n❌ Test suite failed: ${error.message}`, 'red');
      console.error(error);
      process.exit(1);
    } finally {
      this.cleanup();
    }
  }

  showSummary() {
    const passed = this.testResults.filter(r => r.passed).length;
    const failed = this.testResults.length - passed;
    const successRate = this.testResults.length > 0 
      ? ((passed / this.testResults.length) * 100).toFixed(2)
      : '0.00';

    colorLog('\n\n========================================', 'magenta');
    colorLog('TEST SUMMARY', 'magenta');
    colorLog('========================================', 'magenta');

    colorLog(`\nTotal Tests: ${this.testResults.length}`, 'cyan');
    colorLog(`Passed: ${passed}`, 'green');
    colorLog(`Failed: ${failed}`, failed > 0 ? 'red' : 'green');
    colorLog(`Success Rate: ${successRate}%`, 'cyan');

    colorLog('\n\nDetailed Results:', 'yellow');
    this.testResults.forEach((result, index) => {
      const icon = result.passed ? '✅' : '❌';
      const color = result.passed ? 'green' : 'red';
      colorLog(`${icon} ${index + 1}. ${result.test}`, color);
    });

    if (failed === 0) {
      colorLog('\n\n🎉 All blockchain tests passed!', 'green');
      colorLog('ProvenancePro CLI is working correctly with testnet!', 'green');
    } else {
      colorLog('\n\n⚠️  Some tests failed. Review output above.', 'yellow');
    }
  }

  cleanup() {
    colorLog('\n\n🧹 Cleaning up test files...', 'blue');
    try {
      if (fs.existsSync('./test-models')) {
        fs.rmSync('./test-models', { recursive: true, force: true });
      }
      if (fs.existsSync('./test-output')) {
        fs.rmSync('./test-output', { recursive: true, force: true });
      }
      if (fs.existsSync('./test-audit-report.html')) {
        fs.unlinkSync('./test-audit-report.html');
      }
      colorLog('✅ Cleanup complete', 'green');
    } catch (error) {
      colorLog(`⚠️  Cleanup warning: ${error.message}`, 'yellow');
    }
  }
}

// Main execution
if (require.main === module) {
  const tester = new AutoBlockchainTester();
  tester.runAllTests().then(() => {
    colorLog('\n✅ Automated test suite completed!\n', 'green');
    process.exit(0);
  }).catch((error) => {
    colorLog(`\n❌ Test suite error: ${error.message}\n`, 'red');
    console.error(error);
    process.exit(1);
  });
}

module.exports = AutoBlockchainTester;
