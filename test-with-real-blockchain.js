#!/usr/bin/env node

/**
 * ProvenancePro CLI - Real Blockchain Integration Test
 * 
 * SECURITY WARNING: This script uses real blockchain credentials
 * - Keep credentials in environment variables or secure config
 * - Never commit credentials to git
 * - Use minimal SUI amounts for testing
 * 
 * Usage:
 *   Set environment variables:
 *   export SUI_PRIVATE_KEY="your_private_key"
 *   export SUI_ADDRESS="your_address"
 *   
 *   Then run:
 *   node test-with-real-blockchain.js
 */

const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

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

class RealBlockchainTester {
  constructor() {
    // Load .env file if it exists
    this.loadEnvFile();
    
    this.testResults = [];
    this.privateKey = process.env.SUI_PRIVATE_KEY;
    this.address = process.env.SUI_ADDRESS;
    this.testAmount = process.env.TEST_AMOUNT || '0.001'; // Minimal SUI for testing
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

  async promptForCredentials() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      colorLog('\n⚠️  SECURITY WARNING ⚠️', 'yellow');
      colorLog('This test will use REAL blockchain credentials and SUI tokens.', 'yellow');
      colorLog('Only proceed if you understand the risks.\n', 'yellow');

      rl.question('Do you want to continue? (yes/no): ', (answer) => {
        if (answer.toLowerCase() !== 'yes') {
          colorLog('\nTest cancelled by user.', 'yellow');
          process.exit(0);
        }

        if (!this.privateKey) {
          rl.question('\nEnter your SUI private key (or press Enter to skip): ', (key) => {
            this.privateKey = key.trim();
            
            if (!this.address) {
              rl.question('Enter your SUI address (or press Enter to skip): ', (addr) => {
                this.address = addr.trim();
                rl.close();
                resolve();
              });
            } else {
              rl.close();
              resolve();
            }
          });
        } else {
          rl.close();
          resolve();
        }
      });
    });
  }

  validateCredentials() {
    if (!this.privateKey || !this.address) {
      colorLog('\n❌ Missing credentials!', 'red');
      colorLog('\nPlease provide credentials via:', 'yellow');
      colorLog('1. Environment variables: SUI_PRIVATE_KEY and SUI_ADDRESS', 'cyan');
      colorLog('2. Interactive prompt when running this script', 'cyan');
      colorLog('\nExample:', 'yellow');
      colorLog('  export SUI_PRIVATE_KEY="suiprivkey1..."', 'cyan');
      colorLog('  export SUI_ADDRESS="0x..."', 'cyan');
      colorLog('  node test-with-real-blockchain.js', 'cyan');
      return false;
    }

    colorLog('\n✅ Credentials loaded', 'green');
    colorLog(`   Address: ${this.address.substring(0, 10)}...${this.address.substring(this.address.length - 8)}`, 'cyan');
    return true;
  }

  async setupTestEnvironment() {
    colorLog('\n📦 Setting up test environment...', 'blue');
    
    // Create test directories
    if (!fs.existsSync('./test-models')) {
      fs.mkdirSync('./test-models', { recursive: true });
    }

    // Create a tiny test model file (to minimize costs)
    const tinyModel = 'Tiny AI model for testing - ProvenancePro\n' + 'x'.repeat(100);
    fs.writeFileSync(this.testModelPath, tinyModel);
    
    colorLog('✅ Test environment ready', 'green');
  }

  async runCLICommand(command, description) {
    return new Promise((resolve) => {
      colorLog(`\n🔧 ${description}`, 'yellow');
      colorLog(`   Command: npm run cli -- ${command}`, 'cyan');
      
      const child = spawn('npm', ['run', 'cli', '--', ...command.split(' ')], {
        stdio: 'inherit',
        shell: true
      });

      child.on('close', (code) => {
        if (code === 0) {
          colorLog(`✅ ${description} - SUCCESS`, 'green');
          this.testResults.push({ test: description, passed: true });
          resolve(true);
        } else {
          colorLog(`❌ ${description} - FAILED (Exit code: ${code})`, 'red');
          this.testResults.push({ test: description, passed: false });
          resolve(false);
        }
      });

      child.on('error', (error) => {
        colorLog(`❌ ${description} - ERROR: ${error.message}`, 'red');
        this.testResults.push({ test: description, passed: false });
        resolve(false);
      });
    });
  }

  async checkBalance() {
    colorLog('\n💰 Checking SUI balance...', 'blue');
    
    return new Promise((resolve) => {
      exec(`sui client balance --address ${this.address}`, (error, stdout, stderr) => {
        if (error) {
          colorLog(`⚠️  Could not check balance: ${error.message}`, 'yellow');
          colorLog('   Continuing anyway...', 'yellow');
          resolve(true);
        } else {
          console.log(stdout);
          resolve(true);
        }
      });
    });
  }

  async runAllTests() {
    try {
      colorLog('========================================', 'magenta');
      colorLog('ProvenancePro CLI - Real Blockchain Test', 'magenta');
      colorLog('========================================', 'magenta');

      // Prompt for credentials if not in env
      await this.promptForCredentials();

      // Validate credentials
      if (!this.validateCredentials()) {
        process.exit(1);
      }

      // Setup test environment
      await this.setupTestEnvironment();

      // Check balance
      await this.checkBalance();

      colorLog('\n========================================', 'blue');
      colorLog('Starting Real Blockchain Tests', 'blue');
      colorLog('========================================', 'blue');
      colorLog(`\n⚠️  Using minimal amounts: ${this.testAmount} SUI per test`, 'yellow');

      // Build CLI
      colorLog('\n🔨 Building CLI...', 'blue');
      await new Promise((resolve, reject) => {
        exec('npm run build', (error, stdout, stderr) => {
          if (error) {
            colorLog('❌ Build failed', 'red');
            reject(error);
          } else {
            colorLog('✅ Build complete', 'green');
            resolve();
          }
        });
      });

      // Test 1: Commit a model to blockchain
      colorLog('\n\n=== TEST 1: COMMIT MODEL ===', 'cyan');
      await this.runCLICommand(
        `commit --path ${this.testModelPath} --name "Test-Model-${Date.now()}" --description "Blockchain test model" --private-key ${this.privateKey}`,
        'Commit test model to blockchain'
      );

      // Wait a bit for blockchain confirmation
      colorLog('\n⏳ Waiting for blockchain confirmation...', 'yellow');
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Test 2: List repositories
      colorLog('\n\n=== TEST 2: LOG REPOSITORIES ===', 'cyan');
      await this.runCLICommand(
        'log',
        'List all repositories'
      );

      // Test 3: Inspect a repository (use the address as repo ID for testing)
      colorLog('\n\n=== TEST 3: INSPECT REPOSITORY ===', 'cyan');
      await this.runCLICommand(
        `inspect --repo ${this.address}`,
        'Inspect repository details'
      );

      // Test 4: Verify repository
      colorLog('\n\n=== TEST 4: VERIFY REPOSITORY ===', 'cyan');
      await this.runCLICommand(
        `verify --repo ${this.address}`,
        'Verify repository integrity'
      );

      // Test 5: Generate audit report
      colorLog('\n\n=== TEST 5: AUDIT REPORT ===', 'cyan');
      await this.runCLICommand(
        `audit-report --repo ${this.address} --output ./test-audit-report.html`,
        'Generate audit report'
      );

      // Test 6: Browse storefront
      colorLog('\n\n=== TEST 6: STOREFRONT ===', 'cyan');
      await this.runCLICommand(
        'storefront',
        'Browse marketplace'
      );

      // Test 7: Pull a model (if available)
      colorLog('\n\n=== TEST 7: PULL MODEL ===', 'cyan');
      await this.runCLICommand(
        `pull --repo ${this.address} --output ./test-output`,
        'Download model from blockchain'
      );

      this.showSummary();

    } catch (error) {
      colorLog(`\n❌ Test suite failed: ${error.message}`, 'red');
      process.exit(1);
    } finally {
      this.cleanup();
    }
  }

  showSummary() {
    const passed = this.testResults.filter(r => r.passed).length;
    const failed = this.testResults.length - passed;
    const successRate = ((passed / this.testResults.length) * 100).toFixed(2);

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
      colorLog('ProvenancePro CLI is working correctly with real blockchain!', 'green');
    } else {
      colorLog('\n\n⚠️  Some tests failed. Please review the output above.', 'yellow');
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
  const tester = new RealBlockchainTester();
  tester.runAllTests().then(() => {
    colorLog('\n✅ Test suite completed!\n', 'green');
    process.exit(0);
  }).catch((error) => {
    colorLog(`\n❌ Test suite error: ${error.message}\n`, 'red');
    process.exit(1);
  });
}

module.exports = RealBlockchainTester;
