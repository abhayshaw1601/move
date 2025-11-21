#!/usr/bin/env node

/**
 * ProvenancePro CLI - Interactive Demo
 * Demonstrates all CLI features with real blockchain integration
 */

const { spawn } = require('child_process');
const readline = require('readline');
const fs = require('fs');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  white: '\x1b[37m'
};

function colorLog(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function printBanner() {
  console.clear();
  colorLog('\n╔══════════════════════════════════════════════════════════════╗', 'cyan');
  colorLog('║                                                              ║', 'cyan');
  colorLog('║              ProvenancePro CLI - Interactive Demo            ║', 'cyan');
  colorLog('║                                                              ║', 'cyan');
  colorLog('║         AI Model Provenance & Marketplace Platform          ║', 'cyan');
  colorLog('║                                                              ║', 'cyan');
  colorLog('╚══════════════════════════════════════════════════════════════╝', 'cyan');
  console.log('');
}

async function runCommand(command, description) {
  return new Promise((resolve) => {
    colorLog(`\n${'='.repeat(60)}`, 'blue');
    colorLog(`📋 ${description}`, 'yellow');
    colorLog(`${'='.repeat(60)}`, 'blue');
    colorLog(`\n💻 Command: ${command}`, 'cyan');
    console.log('');

    const args = command.split(' ');
    const child = spawn(args[0], args.slice(1), {
      stdio: 'inherit',
      shell: true
    });

    child.on('close', (code) => {
      if (code === 0) {
        colorLog(`\n✅ Success!`, 'green');
      } else {
        colorLog(`\n⚠️  Command completed with code ${code}`, 'yellow');
      }
      resolve(code === 0);
    });

    child.on('error', (error) => {
      colorLog(`\n❌ Error: ${error.message}`, 'red');
      resolve(false);
    });
  });
}

async function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(colorLog(question, 'yellow'), (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function waitForEnter() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    colorLog('\n⏸️  Press Enter to continue...', 'cyan');
    rl.question('', () => {
      rl.close();
      resolve();
    });
  });
}

async function main() {
  printBanner();

  colorLog('Welcome to the ProvenancePro CLI Interactive Demo!', 'green');
  colorLog('\nThis demo will walk you through all the features of the CLI.', 'white');
  colorLog('You can interact with the Sui blockchain testnet in real-time.', 'white');

  await waitForEnter();

  // Demo 1: Help Command
  printBanner();
  colorLog('📚 DEMO 1: Getting Help', 'magenta');
  colorLog('\nLet\'s start by viewing all available commands:', 'white');
  await waitForEnter();
  await runCommand('npm run cli -- --help', 'Display all available commands');
  await waitForEnter();

  // Demo 2: Version
  printBanner();
  colorLog('📌 DEMO 2: Version Information', 'magenta');
  colorLog('\nCheck the CLI version:', 'white');
  await waitForEnter();
  await runCommand('npm run cli -- --version', 'Display CLI version');
  await waitForEnter();

  // Demo 3: Storefront
  printBanner();
  colorLog('🏪 DEMO 3: Browse Marketplace', 'magenta');
  colorLog('\nBrowse the AI model marketplace:', 'white');
  colorLog('This queries real repositories from the Sui blockchain.', 'cyan');
  await waitForEnter();
  await runCommand('npm run cli -- storefront', 'Browse AI model marketplace');
  await waitForEnter();

  // Demo 4: Log
  printBanner();
  colorLog('📜 DEMO 4: View Repository History', 'magenta');
  colorLog('\nView commit history from the blockchain:', 'white');
  await waitForEnter();
  await runCommand('npm run cli -- log', 'Display all repository commits');
  await waitForEnter();

  // Demo 5: Inspect
  printBanner();
  colorLog('🔍 DEMO 5: Inspect Repository', 'magenta');
  colorLog('\nAnalyze repository dependencies and structure:', 'white');
  
  const repoId = await prompt('\nEnter a repository ID to inspect (or press Enter to skip): ');
  
  if (repoId) {
    await runCommand(`npm run cli -- inspect --repo ${repoId}`, 'Inspect repository details');
  } else {
    colorLog('\n⏭️  Skipped - No repository ID provided', 'yellow');
  }
  await waitForEnter();

  // Demo 6: Verify
  printBanner();
  colorLog('🔐 DEMO 6: TEE Verification', 'magenta');
  colorLog('\nExecute Trusted Execution Environment verification:', 'white');
  colorLog('This is the ONLY command that uses mock data for demo purposes.', 'cyan');
  
  const verifyRepoId = await prompt('\nEnter a repository ID to verify (or press Enter to skip): ');
  
  if (verifyRepoId) {
    await runCommand(`npm run cli -- verify --repo ${verifyRepoId}`, 'Verify repository integrity');
  } else {
    colorLog('\n⏭️  Skipped - No repository ID provided', 'yellow');
  }
  await waitForEnter();

  // Demo 7: Audit Report
  printBanner();
  colorLog('📊 DEMO 7: Generate Audit Report', 'magenta');
  colorLog('\nGenerate comprehensive HTML audit report:', 'white');
  
  const auditRepoId = await prompt('\nEnter a repository ID for audit (or press Enter to skip): ');
  
  if (auditRepoId) {
    await runCommand(
      `npm run cli -- audit-report --repo ${auditRepoId} --out ./demo-audit-report.html`,
      'Generate audit report'
    );
    colorLog('\n📄 Report saved to: ./demo-audit-report.html', 'green');
  } else {
    colorLog('\n⏭️  Skipped - No repository ID provided', 'yellow');
  }
  await waitForEnter();

  // Demo 8: Pull
  printBanner();
  colorLog('⬇️  DEMO 8: Download Model', 'magenta');
  colorLog('\nDownload an AI model from the blockchain:', 'white');
  
  const pullRepoId = await prompt('\nEnter a repository ID to download (or press Enter to skip): ');
  
  if (pullRepoId) {
    await runCommand(
      `npm run cli -- pull --repo ${pullRepoId} --output ./demo-downloaded-model`,
      'Download model from blockchain'
    );
  } else {
    colorLog('\n⏭️  Skipped - No repository ID provided', 'yellow');
  }
  await waitForEnter();

  // Demo 9: Commit (Advanced)
  printBanner();
  colorLog('📤 DEMO 9: Commit Model (Advanced)', 'magenta');
  colorLog('\nCommit a new AI model version to the blockchain:', 'white');
  colorLog('⚠️  This requires:', 'yellow');
  colorLog('   - Existing repository ID', 'yellow');
  colorLog('   - RepoCap ID', 'yellow');
  colorLog('   - Model file to upload', 'yellow');
  colorLog('   - Testnet SUI for gas fees', 'yellow');
  
  const doCommit = await prompt('\nWould you like to try committing? (yes/no): ');
  
  if (doCommit.toLowerCase() === 'yes') {
    const commitRepoId = await prompt('Repository ID: ');
    const capId = await prompt('RepoCap ID: ');
    const modelPath = await prompt('Model file path: ');
    
    if (commitRepoId && capId && modelPath) {
      await runCommand(
        `npm run cli -- commit --repo ${commitRepoId} --cap ${capId} --branch main --message "Demo commit" --file ${modelPath}`,
        'Commit model to blockchain'
      );
    } else {
      colorLog('\n⏭️  Skipped - Missing required information', 'yellow');
    }
  } else {
    colorLog('\n⏭️  Skipped', 'yellow');
  }
  await waitForEnter();

  // Summary
  printBanner();
  colorLog('🎉 DEMO COMPLETE!', 'green');
  colorLog('\n' + '='.repeat(60), 'cyan');
  colorLog('Summary of ProvenancePro CLI Features:', 'yellow');
  colorLog('='.repeat(60), 'cyan');
  console.log('');
  colorLog('✅ Help & Version - View documentation and version info', 'white');
  colorLog('✅ Storefront - Browse AI model marketplace', 'white');
  colorLog('✅ Log - View repository commit history', 'white');
  colorLog('✅ Inspect - Analyze dependencies and topology', 'white');
  colorLog('✅ Verify - TEE verification and trust scoring', 'white');
  colorLog('✅ Audit Report - Generate comprehensive HTML reports', 'white');
  colorLog('✅ Pull - Download models from blockchain', 'white');
  colorLog('✅ Commit - Upload new model versions', 'white');
  console.log('');
  colorLog('='.repeat(60), 'cyan');
  colorLog('\n📚 For more information:', 'yellow');
  colorLog('   - README.md - Full documentation', 'cyan');
  colorLog('   - TESTNET-WALLET-GUIDE.md - Wallet setup guide', 'cyan');
  colorLog('   - BLOCKCHAIN-TEST-RESULTS.md - Test results', 'cyan');
  console.log('');
  colorLog('🚀 Ready to use ProvenancePro CLI in production!', 'green');
  console.log('');
}

// Run the demo
if (require.main === module) {
  main().then(() => {
    colorLog('\n👋 Thank you for trying ProvenancePro CLI!\n', 'green');
    process.exit(0);
  }).catch((error) => {
    colorLog(`\n❌ Demo error: ${error.message}\n`, 'red');
    process.exit(1);
  });
}

module.exports = { runCommand, prompt };
