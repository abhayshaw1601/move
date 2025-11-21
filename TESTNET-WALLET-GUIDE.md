# ProvenancePro CLI - Testnet Wallet Guide

## 🔐 Testnet Wallet Information

**⚠️ TESTNET ONLY - NO REAL VALUE**

This wallet is configured for Sui testnet testing only. It contains no real assets.

### Wallet Details
```
Address: 0xaedc8923f06ab9e677377bfbebc527d806dd59a6f987555b6b192632d7f750cb
Private Key: suiprivkey1qzpj7utsapwa89c0zup3m493a2xru0y49vyrd9ketg4tqn7cgjg0jxetuc4
Network: Sui Testnet
```

---

## 🚀 Quick Start

### 1. Check Wallet Balance
```bash
sui client balance --address 0xaedc8923f06ab9e677377bfbebc527d806dd59a6f987555b6b192632d7f750cb
```

### 2. Get Testnet SUI Tokens
If balance is low, request testnet tokens:
```bash
curl --location --request POST 'https://faucet.testnet.sui.io/gas' \
--header 'Content-Type: application/json' \
--data-raw '{
    "FixedAmountRequest": {
        "recipient": "0xaedc8923f06ab9e677377bfbebc527d806dd59a6f987555b6b192632d7f750cb"
    }
}'
```

Or use the web faucet:
https://discord.com/channels/916379725201563759/971488439931392130

### 3. Configure CLI
The wallet is already configured in `.env`:
```bash
SUI_PRIVATE_KEY=suiprivkey1qzpj7utsapwa89c0zup3m493a2xru0y49vyrd9ketg4tqn7cgjg0jxetuc4
SUI_ADDRESS=0xaedc8923f06ab9e677377bfbebc527d806dd59a6f987555b6b192632d7f750cb
```

---

## 📋 Testing Workflow

### Step 1: Create a Repository
First, you need to create a repository on the blockchain:

```bash
# Using Sui CLI
sui client call \
  --package <YOUR_PACKAGE_ID> \
  --module version_fs \
  --function create_repository \
  --args "MyTestModel" "A test AI model for ProvenancePro" \
  --gas-budget 100000000
```

**Save the output!** You'll need:
- Repository Object ID (e.g., `0x123abc...`)
- RepoCap Object ID (e.g., `0x456def...`)

### Step 2: Commit a Model
```bash
npm run cli -- commit \
  --repo <REPO_ID_FROM_STEP1> \
  --cap <CAP_ID_FROM_STEP1> \
  --branch main \
  --message "Initial commit" \
  --file ./test-models/tiny-model.txt \
  --accuracy 98.5 \
  --loss 0.02 \
  --epochs 100
```

### Step 3: View Repository History
```bash
npm run cli -- log --repo-name "MyTestModel"
```

### Step 4: Inspect Repository
```bash
npm run cli -- inspect --repo <REPO_ID>
```

### Step 5: Verify Repository
```bash
npm run cli -- verify --repo <REPO_ID>
```

### Step 6: Generate Audit Report
```bash
npm run cli -- audit-report --repo <REPO_ID> --out ./my-audit-report.html
```

### Step 7: Pull Model
```bash
npm run cli -- pull --repo <REPO_ID> --output ./downloaded-model
```

---

## 🧪 Running Automated Tests

### Full Test Suite
```bash
node test-blockchain-auto.js
```

### Quick Tests (No Blockchain)
```bash
node test-all-cli-functions.js
```

### Unit Tests
```bash
npm test
```

---

## 💰 Gas Budget Guidelines

For testnet testing, use these gas budgets:

| Operation | Gas Budget | Estimated Cost |
|-----------|------------|----------------|
| Create Repository | 100,000,000 | ~0.01 SUI |
| Commit Model | 100,000,000 | ~0.01 SUI |
| Verify Repository | 50,000,000 | ~0.005 SUI |
| Query Operations | 10,000,000 | ~0.001 SUI |

**Total for full test:** ~0.05 SUI

---

## 🔍 Troubleshooting

### "Insufficient gas" Error
```bash
# Request more testnet SUI
curl --location --request POST 'https://faucet.testnet.sui.io/gas' \
--header 'Content-Type: application/json' \
--data-raw '{
    "FixedAmountRequest": {
        "recipient": "0xaedc8923f06ab9e677377bfbebc527d806dd59a6f987555b6b192632d7f750cb"
    }
}'
```

### "Repository not found" Error
- Make sure you created a repository first (Step 1)
- Verify the repository ID is correct
- Check that the transaction succeeded

### "Invalid private key" Error
- Verify `.env` file exists and contains correct key
- Check that private key starts with `suiprivkey1`
- Ensure no extra spaces or quotes

### "Network timeout" Error
- Check internet connection
- Verify testnet RPC is accessible: https://fullnode.testnet.sui.io:443
- Try again after a few seconds

---

## 📊 Monitoring Your Tests

### View Transactions
Visit Sui Explorer to see your transactions:
```
https://suiscan.xyz/testnet/account/0xaedc8923f06ab9e677377bfbebc527d806dd59a6f987555b6b192632d7f750cb
```

### Check Repository Objects
```bash
sui client object <REPO_ID>
```

### View Events
```bash
sui client events --package <PACKAGE_ID>
```

---

## 🎯 Test Scenarios

### Scenario 1: Basic Model Upload
1. Create repository
2. Commit small model (< 1MB)
3. Verify commit succeeded
4. View in log

### Scenario 2: Model with Dependencies
1. Create two repositories
2. Commit to first repository
3. Commit to second repository with `--deps <FIRST_REPO_ID>`
4. Inspect dependency graph

### Scenario 3: Multiple Versions
1. Create repository
2. Commit version 1
3. Commit version 2 with different metrics
4. View history with log command
5. Generate audit report

### Scenario 4: Premium Model
1. Create repository
2. Set price on repository
3. Test pull command (should require payment)
4. Verify access control

---

## 🔒 Security Notes

### Testnet Safety
- ✅ This wallet is for testnet only
- ✅ No real value at risk
- ✅ Safe to share for testing purposes
- ✅ Can be reset anytime

### Best Practices
- 🔐 Never use testnet keys on mainnet
- 🔐 Keep mainnet keys in secure hardware wallets
- 🔐 Use environment variables for keys
- 🔐 Never commit private keys to git (already in .gitignore)

---

## 📚 Additional Resources

### Sui Documentation
- Testnet Faucet: https://docs.sui.io/build/faucet
- Sui CLI: https://docs.sui.io/references/cli
- Move Language: https://move-language.github.io/move/

### Walrus Documentation
- Walrus Testnet: https://docs.walrus.site/
- Storage API: https://docs.walrus.site/usage/web-api.html

### ProvenancePro
- Main README: ./README.md
- Test Results: ./BLOCKCHAIN-TEST-RESULTS.md
- Test Suite: ./test-blockchain-auto.js

---

## ✅ Pre-Flight Checklist

Before running tests, ensure:

- [ ] `.env` file exists with wallet credentials
- [ ] Sui CLI is installed and configured
- [ ] Testnet SUI balance > 0.1 SUI
- [ ] Package is deployed to testnet
- [ ] Package ID is configured
- [ ] Internet connection is stable
- [ ] Node.js and npm are installed
- [ ] Project dependencies are installed (`npm install`)
- [ ] Project is built (`npm run build`)

---

## 🎉 Ready to Test!

You're all set! Run the automated test suite:

```bash
node test-blockchain-auto.js
```

Or test individual commands manually using the workflow above.

**Happy Testing! 🚀**
