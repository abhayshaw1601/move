# VersionFS 2-Minute Demo Guide

This guide walks you through the complete 2-minute demonstration of VersionFS for EU AI Act compliance.

## Prerequisites

1. **Build the project:**
   ```bash
   npm run build
   ```
suiprivkey1qzpj7utsapwa89c0zup3m493a2xru0y49vyrd9ketg4tqn7cgjg0jxetuc4
2. **Set environment variables:**
   ```powershell
   $env:SUI_PRIVATE_KEY = "your_alice_private_key_here"
   ```

3. **Ensure deployment-info.json exists** with your package ID, or pass it as a parameter:
   ```powershell
   .\demo-2min-pitch.ps1 -PackageId "0x..."
   ```

4. **Optional: For full demo including fork/purchase, prepare Bob's wallet:**
   ```powershell
   .\demo-2min-pitch.ps1 -BobPrivateKey "bob_private_key_here"
   ```

## Demo Script Structure

### Timeline (2 minutes)

- **0:00-1:00**: Pitch Introduction
  - EU AI Act compliance problem
  - VersionFS solution overview
  - Key features: TEE verification, DAG traceability, provenance

- **1:00-1:15**: Setup
  - Spin up Sui blockchain
  - Scan for deployment
  - Verify connection

- **1:15-1:30**: Create Repository
  - Create repository on blockchain
  - Get Repository ID and Capability ID

- **1:30-1:45**: Commit Model
  - Commit model with 80% accuracy
  - Highlight: "This is just liability"
  - Emphasize: `model_shards` vector for real-world scaling

- **1:45-2:00**: TEE Verification
  - Run `verify_reproducibility`
  - Show TEE signature verification
  - Wait for transaction confirmation

- **2:00-2:15**: Show Certificate
  - Badge turns Gold (trust score ≥ 100)
  - On-chain compliance certificate
  - "This model is now legal to deploy"

- **2:15-2:30**: Fork & Royalty Split
  - Second wallet forks repository
  - Purchase access to forked repo
  - Highlight: `calculate_royalty_split` function
  - Show 5% automatic royalty to upstream author

- **2:30-2:00**: Closing
  - "Hugging Face is a centralized silo. VersionFS is a verifiable economy."

## Running the Demo

### Basic Demo (Alice only):
```powershell
.\demo-2min-pitch.ps1
```

### Full Demo (with Bob's fork/purchase):
```powershell
.\demo-2min-pitch.ps1 -BobPrivateKey "bob_private_key_here"
```

### With Custom Package ID:
```powershell
.\demo-2min-pitch.ps1 -PackageId "0x7bb1869916ab70453bb935830d664cba9ea46889e69d42e20bfe025714da0bf8"
```

## Key Talking Points

### During Setup (1:00-1:15)
- "We're connecting to the Sui blockchain"
- "VersionFS is built on Sui for high throughput and low costs"

### During Commit (1:30-1:45)
- "Notice the `model_shards` vector. Even if we don't upload 10GB in the demo, this shows we thought about real-world AI scaling."
- "We're committing with 80% accuracy. This is just liability - we need to prove it's real."

### During Verification (1:45-2:00)
- "We run the conformity assessment through a TEE. The code verifies the signature..."
- "Article 15 demands proven accuracy. We use TEEs to cryptographically verify performance metrics."

### During Certificate (2:00-2:15)
- "The Badge turns Gold. This Gold Badge isn't just a PNG. It is an On-Chain Compliance Certificate."
- "We have verified the provenance and accuracy. This model is now legal to deploy."

### During Fork/Purchase (2:15-2:30)
- "User B just bought a forked version. Watch what happens."
- "The contract automatically routes 5% of the sale back to the original upstream author."
- "We just solved open-source AI monetization."
- "Highlight code: The `calculate_royalty_split` function."

### Closing (2:30-2:00)
- "Hugging Face is a centralized silo. VersionFS is a verifiable economy."
- "We are building the provenance layer for the world's AI, ensuring that if you build the truth, you get paid for it."

## Code Highlights

### 1. model_shards Vector
**Location:** `src/index.ts` (commit command), `sources/version_fs.move` (VersionNode struct)

**Talking Point:**
"Even if you don't upload 10GB of data in the demo, emphasize the model_shards vector in the code. It shows you thought about real-world AI scaling."

### 2. verify_reproducibility Function
**Location:** `src/verify.ts`, `sources/version_fs.move`

**Talking Point:**
"We run the conformity assessment through a TEE. The code verifies the signature..."

### 3. calculate_royalty_split Function
**Location:** `sources/version_fs.move` (lines 437-448)

**Talking Point:**
"User B just bought a forked version. Watch what happens. The contract automatically routes 5% of the sale back to the original upstream author. We just solved open-source AI monetization."

## Troubleshooting

### Issue: "SUI_PRIVATE_KEY not set"
**Solution:** Set the environment variable:
```powershell
$env:SUI_PRIVATE_KEY = "your_key_here"
```

### Issue: "PACKAGE_ID not found"
**Solution:** Either ensure `deployment-info.json` exists, or pass it as a parameter:
```powershell
.\demo-2min-pitch.ps1 -PackageId "0x..."
```

### Issue: "Could not extract REPO_ID and CAP_ID"
**Solution:** The script will prompt you to enter them manually. Look for the IDs in the output after creating the repository.

### Issue: Build fails
**Solution:** Ensure all dependencies are installed:
```bash
npm install
npm run build
```

## Manual Commands (if script fails)

If the automated script fails, you can run commands manually:

1. **Create Repository:**
   ```bash
   npm run cli -- create-repository --name "EUCompliantModel" --price 0
   ```
   Save the REPO_ID and CAP_ID from output.

2. **Commit Model:**
   ```bash
   npm run cli -- commit --repo <REPO_ID> --cap <CAP_ID> --branch main --message "EU Compliant AI Model v1.0" --file demo-model.bin --accuracy 80 --loss 0.15 --epochs 50 --f1-score 0.75
   ```

3. **Verify:**
   ```bash
   npm run cli -- verify --repo <REPO_ID>
   ```

4. **Show Certificate:**
   ```bash
   npm run cli -- certificate --repo <REPO_ID>
   ```

5. **Fork (Bob's wallet):**
   ```bash
   $env:SUI_PRIVATE_KEY = "bob_key"
   npm run cli -- fork --from <REPO_ID> --name "BobsFork" --price 1000000000
   ```

6. **Purchase (Bob's wallet):**
   ```bash
   npm run cli -- pull --repo <FORKED_REPO_ID> --output ./downloaded
   ```

## Notes

- The demo creates a 1MB model file (`demo-model.bin`) if it doesn't exist
- Transaction confirmations wait 3-4 seconds (adjustable in script)
- The script automatically extracts REPO_ID and CAP_ID from output when possible
- For the full royalty demonstration, you need a second wallet (Bob's key)

