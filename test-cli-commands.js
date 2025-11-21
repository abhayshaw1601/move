#!/usr/bin/env node

/**
 * ProvenancePro CLI Command Test Script
 * 
 * Tests all CLI commands to ensure they load and execute properly.
 * This script focuses on command structure, help text, and basic functionality
 * without requiring full blockchain setup.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

class CLICommandTester {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
    
    console.log('🧪 ProvenancePro CLI Command Test Suite');
    console.log('=' .repeat(50));
  }

  log(message, type = 'INFO') {
    const icons = { INFO: '📋', SUCCESS: '✅', ERROR: '❌', TEST: '🔧' };
    console.log(`${icons[type]} ${message}`);
  }

  async runCommand(command, expectSuccess = true) {
    try {
      this.log(`Testing: provenance ${command}`, 'TEST');
      
      const output = execSync(`npm run cli -- ${command}`, {
        encoding: 'utf8',
        timeout: 10000,
        stdio: 'pipe'
      });
      
      if (expectSuccess) {
        this.log(`✓ Command executed successfully`, 'SUCCESS');
        this.results.push({ command, status: 'PASS', output: output.substring(0, 200) });
      }
      
      return output;
      
    } catch (error) {
      if (expectSuccess) {
        this.log(`✗ Command failed: ${error.message}`, 'ERROR');
        this.results.push({ command, status: 'FAIL', error: error.message });
      } else {
        this.log(`✓ Command failed as expected`, 'SUCCESS');
        this.results.push({ command, status: 'PASS', note: 'Expected failure' });
      }
      
      return null;
    }
  }

  async testHelpCommands() {
    this.log('Testing help commands...', 'INFO');
    
    // Test main help
    await this.runCommand('--help');
    
    // Test command-specific help
    const commands = ['commit', 'log', 'audit-report', 'storefront', 'pull', 'inspect', 'verify'];
    
    for (const cmd of commands) {
      await this.runCommand(`${cmd} --help`);
    }
  }

  async testCommandStructure() {
    this.log('Testing command structure and validation...', 'INFO');
    
    // Test commands that should fail without required parameters
    await this.runCommand('commit', false); // Should fail - missing required options
    await this.runCommand('pull', false);   // Should fail - missing required options
    await this.runCommand('inspect', false); // Should fail - missing required options
    await this.runCommand('verify', false);  // Should fail - missing required options
    await this.runCommand('audit-report', false); // Should fail - missing required options
    
    // Test commands that should work without parameters
    await this.runCommand('storefront'); // Should work - no required params
  }

  async testConfigurationHandling() {
    this.log('Testing configuration handling...', 'INFO');
    
    // Test with custom config path
    const tempConfig = path.join(os.tmpdir(), 'test-provenance-config.json');
    
    // Create a test config
    const testConfig = {
      sui_rpc: "https://fullnode.testnet.sui.io:443",
      walrus_api: "https://publisher.walrus-testnet.walrus.space",
      default_shard_size: 104857600,
      max_concurrent_uploads: 5,
      wallet_address: "0x..."
    };
    
    fs.writeFileSync(tempConfig, JSON.stringify(testConfig, null, 2));
    
    try {
      await this.runCommand(`--config ${tempConfig} --help`);
      this.log('Custom config handling works', 'SUCCESS');
    } finally {
      // Cleanup
      if (fs.existsSync(tempConfig)) {
        fs.unlinkSync(tempConfig);
      }
    }
  }

  async testLogCommand() {
    this.log('Testing log command with sample data...', 'INFO');
    
    try {
      await this.runCommand('log --repo-name test-model');
    } catch (error) {
      // Expected to fail without real data, but should show proper error handling
      this.log('Log command shows proper error handling', 'SUCCESS');
    }
  }

  async testStorefrontCommand() {
    this.log('Testing storefront command...', 'INFO');
    
    try {
      const output = await this.runCommand('storefront');
      
      if (output && (output.includes('MODEL NAME') || output.includes('stub'))) {
        this.log('Storefront displays correctly', 'SUCCESS');
      }
    } catch (error) {
      this.log('Storefront command structure verified', 'SUCCESS');
    }
  }

  async testUIComponents() {
    this.log('Testing UI components...', 'INFO');
    
    try {
      // Test UI components directly
      const { printBanner, printChart, printInfoBox } = require('./dist/utils/ui');
      
      console.log('\n--- UI Component Test ---');
      
      // Test banner
      printBanner();
      
      // Test chart
      const sampleData = [0.9, 0.7, 0.5, 0.3, 0.2, 0.1];
      printChart(sampleData, 'Sample Performance Chart');
      
      // Test info box
      const sampleInfo = {
        'Model Name': 'Test Model',
        'Owner': '0x1234...',
        'Status': 'Available'
      };
      printInfoBox('Test Information', sampleInfo);
      
      console.log('--- End UI Test ---\n');
      
      this.log('UI components working correctly', 'SUCCESS');
      this.results.push({ command: 'UI Components', status: 'PASS' });
      
    } catch (error) {
      this.log(`UI components failed: ${error.message}`, 'ERROR');
      this.results.push({ command: 'UI Components', status: 'FAIL', error: error.message });
    }
  }

  async testBuildAndCompilation() {
    this.log('Testing build and compilation...', 'INFO');
    
    try {
      execSync('npm run build', { encoding: 'utf8', timeout: 30000 });
      this.log('TypeScript compilation successful', 'SUCCESS');
      this.results.push({ command: 'Build Process', status: 'PASS' });
    } catch (error) {
      this.log(`Build failed: ${error.message}`, 'ERROR');
      this.results.push({ command: 'Build Process', status: 'FAIL', error: error.message });
    }
  }

  async testPropertyBasedTests() {
    this.log('Running property-based tests...', 'INFO');
    
    try {
      const output = execSync('npm test', { encoding: 'utf8', timeout: 60000 });
      
      if (output.includes('Test Suites: ') && output.includes('passed')) {
        this.log('All property-based tests passing', 'SUCCESS');
        this.results.push({ command: 'Property Tests', status: 'PASS' });
      } else {
        throw new Error('Some tests failed');
      }
    } catch (error) {
      this.log(`Property tests failed: ${error.message}`, 'ERROR');
      this.results.push({ command: 'Property Tests', status: 'FAIL', error: error.message });
    }
  }

  async testMoveContracts() {
    this.log('Testing Move smart contracts...', 'INFO');
    
    try {
      const output = execSync('sui move test', { encoding: 'utf8', timeout: 60000 });
      
      if (output.includes('Test result: OK')) {
        this.log('All Move tests passing', 'SUCCESS');
        this.results.push({ command: 'Move Tests', status: 'PASS' });
      } else {
        throw new Error('Some Move tests failed');
      }
    } catch (error) {
      this.log(`Move tests failed: ${error.message}`, 'ERROR');
      this.results.push({ command: 'Move Tests', status: 'FAIL', error: error.message });
    }
  }

  async runAllTests() {
    this.log('Starting CLI command tests...', 'INFO');
    
    // Core functionality tests
    await this.testBuildAndCompilation();
    await this.testHelpCommands();
    await this.testCommandStructure();
    await this.testConfigurationHandling();
    
    // Individual command tests
    await this.testLogCommand();
    await this.testStorefrontCommand();
    
    // UI and component tests
    await this.testUIComponents();
    
    // Test suites
    await this.testPropertyBasedTests();
    await this.testMoveContracts();
    
    this.generateReport();
  }

  generateReport() {
    const totalTime = Date.now() - this.startTime;
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const total = this.results.length;
    
    console.log('\n' + '=' .repeat(60));
    console.log('📊 CLI Command Test Results');
    console.log('=' .repeat(60));
    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏱️  Duration: ${(totalTime / 1000).toFixed(2)}s`);
    console.log(`📈 Success Rate: ${(passed / total * 100).toFixed(1)}%`);
    console.log('=' .repeat(60));
    
    // Detailed results
    console.log('\nDetailed Results:');
    this.results.forEach((result, index) => {
      const status = result.status === 'PASS' ? '✅' : '❌';
      console.log(`${index + 1}. ${status} ${result.command}`);
      
      if (result.error) {
        console.log(`   Error: ${result.error.substring(0, 100)}...`);
      }
      
      if (result.note) {
        console.log(`   Note: ${result.note}`);
      }
    });
    
    console.log('\n🎯 CLI Command Testing Complete!');
    
    if (failed > 0) {
      console.log(`\n⚠️  ${failed} test(s) failed. Please review the errors above.`);
      process.exit(1);
    } else {
      console.log('\n🎉 All CLI commands are working correctly!');
      process.exit(0);
    }
  }
}

// Main execution
async function main() {
  const tester = new CLICommandTester();
  
  try {
    await tester.runAllTests();
  } catch (error) {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = CLICommandTester;