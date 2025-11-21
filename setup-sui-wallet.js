#!/usr/bin/env node

/**
 * Setup Sui Wallet for Testing
 * Configures the Sui CLI with the testnet wallet
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function colorLog(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function runCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}

async function setupWallet() {
  colorLog('\n╔══════════════════════════════════════════════════════════════╗', 'cyan');
  colorLog('║          Sui Wallet Setup for ProvenancePro CLI             ║', 'cyan');
  colorLog('╚══════════════════════════════════════════════════════════════╝', 'cyan');

  // Load environment variables
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    colorLog('\n❌ .env file not found!', 'red');
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  let privateKey = null;
  let address = null;

  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('SUI_PRIVATE_KEY=')) {
      privateKey = trimmed.split('=')[1].trim();
    }
    if (trimmed.startsWith('SUI_ADDRESS=')) {
      address = trimmed.split('=')[1].trim();
    }
  });

  if (!privateKey || !address) {
    colorLog('\n❌ Missing SUI_PRIVATE_KEY or SUI_ADDRESS in .env file!', 'red');
    process.exit(1);
  }

  colorLog('\n✅ Loaded credentials from .env', 'green');
  colorLog(`   Address: ${address.substring(0, 10)}...${address.substring(address.length - 8)}`, 'cyan');

  // Create Sui config directory
  const suiConfigDir = path.join(os.homedir(), '.sui', 'sui_config');
  if (!fs.existsSync(suiConfigDir)) {
    fs.mkdirSync(suiConfigDir, { recursive: true });
    colorLog('\n📁 Created Sui config directory', 'blue');
  }

  // Create client.yaml
  const clientYaml = `---
keystore:
  File: ${path.join(suiConfigDir, 'sui.keystore').replace(/\\/g, '/')}
envs:
  - alias: testnet
    rpc: "https://fullnode.testnet.sui.io:443"
    ws: ~
    basic_auth: ~
active_env: testnet
active_address: "${address}"
`;

  const clientYamlPath = path.join(suiConfigDir, 'client.yaml');
  fs.writeFileSync(clientYamlPath, clientYaml);
  colorLog('✅ Created client.yaml', 'green');

  // Create keystore file (array of private keys, one per line)
  const keystorePath = path.join(suiConfigDir, 'sui.keystore');
  const keystoreContent = JSON.stringify([privateKey]);
  fs.writeFileSync(keystorePath, keystoreContent);
  colorLog('✅ Created sui.keystore', 'green');

  // Test the configuration
  colorLog('\n🧪 Testing Sui CLI configuration...', 'blue');
  
  try {
    const activeAddress = await runCommand('sui client active-address');
    colorLog(`✅ Active address: ${activeAddress.trim()}`, 'green');

    const balance = await runCommand(`sui client balance ${address}`);
    colorLog('\n💰 Wallet Balance:', 'yellow');
    console.log(balance);

    colorLog('\n🎉 Sui wallet setup complete!', 'green');
    colorLog('\nYou can now run:', 'cyan');
    colorLog('  node e2e-blockchain-test.js', 'white');
    
  } catch (error) {
    colorLog(`\n⚠️  Warning: ${error.message}`, 'yellow');
    colorLog('Configuration created but verification failed.', 'yellow');
    colorLog('You may need to request testnet tokens from the faucet.', 'yellow');
  }
}

setupWallet().catch(error => {
  colorLog(`\n❌ Setup failed: ${error.message}`, 'red');
  process.exit(1);
});
