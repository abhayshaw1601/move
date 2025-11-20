# Design Document: AI Provenance Pro

## Overview

ProvenancePro is a decentralized AI model provenance platform that solves the AI reproducibility crisis through immutable on-chain tracking, monetization, and compliance features. The system consists of three main components:

1. **Smart Contract Layer (Sui Move)**: Handles on-chain storage of metadata, version control, payments, and trust scoring
2. **CLI Application (Node.js/TypeScript)**: Provides developer-friendly commands for committing, cloning, browsing, and purchasing models
3. **Visualization Layer**: Generates HTML audit reports and terminal-based interfaces

The design extends the existing VersionFS contract with AI-specific features while maintaining backward compatibility.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                         CLI Layer                            │
│  (commit, log, pull, storefront, inspect, audit-report)     │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ├─── Sui RPC ───────────────────┐
                 │                                │
                 ├─── Walrus API ─────────────┐  │
                 │                             │  │
┌────────────────▼─────────────────┐  ┌───────▼──▼──────────┐
│      Walrus Storage              │  │   Sui Blockchain     │
│  (Model Blobs, Shards)           │  │  (Metadata, Events)  │
└──────────────────────────────────┘  └──────────────────────┘
```

### Data Flow

1. **Commit Flow**: CLI → Walrus (upload shards) → Sui (store metadata + metrics)
2. **Clone Flow**: CLI → Sui (check payment) → Walrus (download shards) → Local reassembly
3. **Purchase Flow**: CLI → Sui (payment + royalty split) → Event emission → Download unlock

## Components and Interfaces

### Smart Contract Extensions

#### Modified Repository Struct
```move
public struct Repository has key, store {
    id: UID,
    name: String,
    owner: address,
    branches: VecMap<String, ID>,
    versions: Table<ID, VersionNode>,
    version_count: u64,
    trust_score: u64,
    // NEW FIELDS
    price: u64,                    // Price in MIST (1 SUI = 10^9 MIST)
    upstream_author: address,       // Original creator for royalties
    total_revenue: u64,            // Lifetime earnings
}
```

#### Modified VersionNode Struct
```move
public struct VersionNode has store, drop, copy {
    root_blob_id: String,          // Deprecated for sharded models
    parents: vector<ID>,
    author: address,
    timestamp: u64,
    message: String,
    version_id: ID,
    // NEW FIELDS
    metrics: VecMap<String, String>,     // AI performance metrics
    model_shards: vector<String>,        // Multiple Walrus blob IDs
    dependencies: vector<ID>,            // Links to datasets/models
    shard_count: u64,                    // Number of shards
    total_size_bytes: u64,               // Combined size of all shards
}
```

#### New Events
```move
public struct AccessPurchased has copy, drop {
    repo_id: ID,
    buyer: address,
    amount: u64,
    timestamp: u64,
}

public struct RoyaltyPaid has copy, drop {
    repo_id: ID,
    upstream_author: address,
    amount: u64,
}

public struct MetricsRecorded has copy, drop {
    repo_id: ID,
    version_id: ID,
    metrics: VecMap<String, String>,
}

public struct ReproducibilityVerified has copy, drop {
    repo_id: ID,
    verifier: address,
    signature: vector<u8>,
    new_trust_score: u64,
    timestamp: u64,
}
```

#### New Smart Contract Functions

```move
/// Verify reproducibility and increment trust score
/// @param repo: Mutable reference to Repository
/// @param signature: Ed25519 signature from TEE attestation
/// @param ctx: Transaction context
public entry fun verify_reproducibility(
    repo: &mut Repository,
    signature: vector<u8>,
    ctx: &mut TxContext
) {
    // Verify signature length (64 bytes for Ed25519)
    assert!(vector::length(&signature) == 64, E_INVALID_SIGNATURE);
    
    // Increment trust score
    repo.trust_score = repo.trust_score + 1;
    
    // Emit verification event
    event::emit(ReproducibilityVerified {
        repo_id: object::id(repo),
        verifier: tx_context::sender(ctx),
        signature,
        new_trust_score: repo.trust_score,
        timestamp: tx_context::epoch_timestamp_ms(ctx),
    });
}
```

### CLI Commands

#### 1. Enhanced Commit Command
```bash
provenance commit --branch main --message "Trained GPT-4 replica" \
  --accuracy 98.5 --loss 0.02 --epochs 100 --f1-score 0.92 \
  --deps dataset-id-1,dataset-id-2 \
  --files ./model-weights/
```

**Behavior**:
- Splits large files into 100MB shards
- Uploads each shard to Walrus in parallel
- Prompts for metrics if not provided via flags
- Stores shard IDs and metrics on-chain
- Links dependencies

#### 2. Rich Log Command
```bash
provenance log --model my-llm-experiment
```

**Output**:
```
COMMIT: 0x123abc...
├── 📊 METRICS:
│   ├── Accuracy: 98.5%
│   ├── Loss: 0.02
│   └── Epochs: 100
├── 📦 WALRUS SHARDS: 3 shards (4.5 GB total)
│   ├── Shard 1: w7z9k...
│   ├── Shard 2: x8a1m...
│   └── Shard 3: y9b2n...
└── 🔗 DEPENDENCIES:
    └── Dataset: 0xabc... (ImageNet-2024)
```

#### 3. Audit Report Command
```bash
provenance audit-report --repo 0x123... --output report.html
```

**Generates**: HTML file with:
- Chart.js line graphs showing loss curves and accuracy trends
- Data table of all versions with metrics
- Visual diff section comparing current version with parent commit
  - Green highlighting for added lines
  - Red highlighting for removed lines
  - Side-by-side or unified diff view

#### 4. Storefront Command
```bash
provenance storefront
```

**Output** (using cli-table3):
```
┌─────────────────────┬──────────────┬────────┬───────┬─────────┐
│ MODEL NAME          │ AUTHOR       │ SIZE   │ TRUST │ PRICE   │
├─────────────────────┼──────────────┼────────┼───────┼─────────┤
│ GPT-4-Replica       │ 0xABC...     │ 4.5 GB │ 🟢 95 │ 100 SUI │
│ BERT-Fine-Tuned     │ 0xDEF...     │ 1.2 GB │ 🔴 12 │ FREE    │
│ Stable-Diffusion-XL │ 0x123...     │ 6.8 GB │ 🟢 150│ 250 SUI │
└─────────────────────┴──────────────┴────────┴───────┴─────────┘
```

#### 5. Pull Command (with Payment)
```bash
provenance pull --repo 0x123... --output ./models/
```

**Behavior**:
- Checks if repo has price > 0
- If premium, displays QR code for payment
- Polls for AccessPurchased event
- Downloads all shards in parallel with progress bars
- Reassembles shards into original file

#### 6. Inspect Command (Lineage Graph)
```bash
provenance inspect --repo 0x123...
```

**Output**:
```
Repository: GPT-4-Replica
Owner: 0xABC...
Trust Score: 95
Price: 100 SUI

LINEAGE GRAPH:
[GPT-4-Replica v3] 0x123...
    ↓ trained_on
[ImageNet-2024] 0xABC...
    ↓ derived_from
[ImageNet-Original] 0xDEF...
```

#### 7. Verify Command (TEE Simulation)
```bash
provenance verify --repo 0x123...
```

**Behavior**:
- Simulates TEE (Trusted Execution Environment) reproducibility check
- Generates Ed25519 signature locally (dummy attestation)
- Submits transaction to `verify_reproducibility` contract function
- Increments trust_score on-chain
- Displays: "✅ Verified by Nautilus TEE | New Trust Score: 100"
- Automatically generates HTML audit report with updated score

**Output**:
```
🔐 Simulating TEE Verification...
📝 Generating Ed25519 Attestation Signature...
   Signature: 0x8f3a2b1c...

📤 Submitting to Smart Contract...
   Transaction: 0xDEF456...

✅ Verified by Nautilus TEE
   Previous Trust Score: 99
   New Trust Score: 100

📊 Generating Audit Report...
   Saved to: audit-report-0x123.html
   Opening in browser...
```

### Walrus Integration

**Shard Upload Strategy**:
- Split files into 100MB chunks using Node.js streams
- Upload chunks in parallel (max 5 concurrent)
- Store blob IDs in order
- Calculate SHA-256 hash of each shard for integrity

**Shard Download Strategy**:
- Fetch all shards concurrently
- Display per-shard progress using `cli-progress` library
- Verify SHA-256 hashes
- Concatenate shards using streams to avoid memory issues

### Visual Diff Implementation

**Code Comparison Strategy**:
- Download both current and parent version blobs from Walrus
- Use `diff` library (e.g., `diff` npm package) to compute line-by-line differences
- Generate HTML with syntax highlighting using `highlight.js`
- Color coding:
  - Green background (#d4edda) for added lines with "+" prefix
  - Red background (#f8d7da) for removed lines with "-" prefix
  - White background for unchanged context lines
- Display in unified diff format with line numbers
- Include file path headers for multi-file diffs

**HTML Report Structure**:
```html
<section class="diff-section">
  <h2>Code Changes: v2 → v3</h2>
  <div class="file-diff">
    <h3>model.py</h3>
    <pre class="diff-content">
      <span class="line-number">10</span> <span class="unchanged">def train():</span>
      <span class="line-number">11</span> <span class="removed">-     epochs = 50</span>
      <span class="line-number">12</span> <span class="added">+     epochs = 100</span>
      <span class="line-number">13</span> <span class="added">+     learning_rate = 0.001</span>
    </pre>
  </div>
</section>
```

### TEE Verification Simulation

**Ed25519 Signature Generation**:
- Use `@noble/ed25519` library for cryptographic operations
- Generate ephemeral keypair for simulation
- Sign payload: `SHA256(repo_id + version_id + timestamp)`
- Return 64-byte signature as hex string

**Verification Flow**:
1. CLI generates signature locally
2. Submit transaction with signature to `verify_reproducibility`
3. Contract validates signature length (64 bytes)
4. Increment trust_score atomically
5. Emit `ReproducibilityVerified` event
6. CLI polls for event confirmation
7. Trigger audit report generation
8. Open HTML file in default browser

## Data Models

### On-Chain Data Structure

```
Repository (Shared Object)
├── Metadata (name, owner, price, upstream_author)
├── Branches (VecMap<String, ID>)
└── Versions (Table<ID, VersionNode>)
    └── VersionNode
        ├── Metrics (VecMap<String, String>)
        ├── Shards (vector<String>)
        └── Dependencies (vector<ID>)
```

### Off-Chain Data (Walrus)

```
Blob Storage
├── Shard 1 (100 MB)
├── Shard 2 (100 MB)
└── Shard N (remaining bytes)
```

### CLI Configuration File (~/.provenance/config.json)

```json
{
  "sui_rpc": "https://fullnode.testnet.sui.io:443",
  "walrus_api": "https://walrus-testnet.mystenlabs.com",
  "default_shard_size": 104857600,
  "max_concurrent_uploads": 5,
  "wallet_address": "0x..."
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Metrics Round-Trip Consistency
*For any* commit with arbitrary key-value metric pairs, storing those metrics on-chain and then querying the version should return all metrics unchanged.
**Validates: Requirements 1.1, 1.3**

### Property 2: Metrics Event Emission
*For any* commit operation that stores metrics, the system should emit a MetricsRecorded event containing the exact version ID and all metric key-value pairs.
**Validates: Requirements 1.4**

### Property 3: Log Display Completeness
*For any* commit, the log command output should contain all required fields: commit ID, author, timestamp, message, Walrus blob ID, and all stored metrics.
**Validates: Requirements 2.3**

### Property 4: Percentage Formatting
*For any* metric value that represents a percentage, the log display should append a "%" suffix to the value.
**Validates: Requirements 2.4**

### Property 5: Log Filtering Accuracy
*For any* repository name filter, all commits returned by the log command should belong to repositories matching that name.
**Validates: Requirements 2.5**

### Property 6: Visual Diff Color Coding
*For any* two versions being compared, the HTML diff section should display added lines with green styling and removed lines with red styling.
**Validates: Requirements 3.3**

### Property 7: Metrics Table Completeness
*For any* audit report, the data table should include all metrics from all versions in the repository.
**Validates: Requirements 3.4**

### Property 8: Repository Price Storage
*For any* repository creation with a specified price, querying the repository should return the exact price value stored on-chain.
**Validates: Requirements 4.1**

### Property 9: Premium Access Control
*For any* repository with price > 0, attempting to clone without a valid AccessPurchased event should be blocked.
**Validates: Requirements 4.2**

### Property 10: Access Purchase Event Emission
*For any* successful payment transaction, the system should emit an AccessPurchased event containing the buyer address and exact payment amount.
**Validates: Requirements 4.4**

### Property 11: Dependency Storage Consistency
*For any* commit with a vector of dependency IDs, storing and then querying the version should return all dependency IDs in the same order.
**Validates: Requirements 5.1**

### Property 12: Dependency Validation
*For any* commit with dependency IDs, all referenced repository IDs must exist on-chain, otherwise the transaction should fail.
**Validates: Requirements 5.2**

### Property 13: Dependency Query Completeness
*For any* repository with dependencies, querying should return all upstream and downstream dependency relationships.
**Validates: Requirements 5.5**

### Property 14: Trust Score Color Coding
*For any* trust score value, the storefront display should use green ANSI codes for scores ≥50 and red ANSI codes for scores <50.
**Validates: Requirements 6.2**

### Property 15: Shard Size Calculation
*For any* repository with multiple shards, the total displayed size should equal the sum of all individual shard sizes.
**Validates: Requirements 6.3**

### Property 16: Shard Storage Consistency
*For any* commit with multiple shard blob IDs, storing and then querying should return all shard IDs in the exact same order.
**Validates: Requirements 7.1, 7.2**

### Property 17: Shard Reassembly Round-Trip
*For any* file split into shards, uploading the shards and then downloading and reassembling them should produce a file identical to the original.
**Validates: Requirements 7.4**

### Property 18: Fork Upstream Author Recording
*For any* fork operation, the new repository's upstream_author field should be set to the original repository's owner address.
**Validates: Requirements 8.1**

### Property 19: Royalty Payment Split
*For any* purchase of a forked repository, the payment split should send exactly 95% to the current owner and 5% to the upstream_author, with the sum equaling the total payment.
**Validates: Requirements 8.2**

### Property 20: Royalty Event Emission
*For any* royalty payment, the system should emit a RoyaltyPaid event with the upstream_author address and the exact 5% amount.
**Validates: Requirements 8.3**

### Property 21: Badge Tier Mapping (Bronze)
*For any* repository with trust_score in range 0-49, the NFT image_url should point to the bronze badge asset.
**Validates: Requirements 9.2**

### Property 22: Badge Tier Mapping (Silver)
*For any* repository with trust_score in range 50-99, the NFT image_url should point to the silver badge asset.
**Validates: Requirements 9.3**

### Property 23: Badge Tier Mapping (Gold)
*For any* repository with trust_score ≥100, the NFT image_url should point to the gold badge asset.
**Validates: Requirements 9.4**

### Property 24: Dynamic Badge Updates
*For any* repository, when the trust_score changes, the NFT image_url should automatically update to reflect the new badge tier without manual intervention.
**Validates: Requirements 9.5**

### Property 25: Trust Score Increment
*For any* successful verify_reproducibility transaction, the repository trust_score should increase by exactly 1.
**Validates: Requirements 10.4**

## Error Handling

### Smart Contract Error Codes
```move
const E_INVALID_SIGNATURE: u64 = 1001;
const E_INSUFFICIENT_PAYMENT: u64 = 1002;
const E_DEPENDENCY_NOT_FOUND: u64 = 1003;
const E_UNAUTHORIZED: u64 = 1004;
const E_INVALID_SHARD_COUNT: u64 = 1005;
const E_ZERO_PRICE_PURCHASE: u64 = 1006;
```

### CLI Error Handling
- Network failures: Retry with exponential backoff (max 3 attempts)
- Invalid blob IDs: Display clear error message with blob ID
- Payment timeouts: Cancel operation after 5 minutes, refund if applicable
- Shard download failures: Retry failed shards individually
- Invalid signatures: Display validation error with expected format

### Validation Rules
- Signature length must be exactly 64 bytes (Ed25519)
- Shard count must be > 0 and match vector length
- Price must be ≥ 0 (in MIST)
- Dependency IDs must reference existing repositories
- Metric keys must be non-empty strings

## Testing Strategy

### Unit Testing
- Test individual smart contract functions with specific inputs
- Test CLI command parsing and validation logic
- Test shard splitting and reassembly with known file sizes
- Test HTML generation with sample data
- Test diff algorithm with known code changes
- Test Ed25519 signature generation format

### Property-Based Testing
- Use **fast-check** library for TypeScript/JavaScript property tests
- Use **Move Prover** for smart contract property verification where applicable
- Configure each property test to run minimum 100 iterations
- Tag each property test with format: `**Feature: ai-provenance-pro, Property {N}: {description}**`
- Each correctness property must be implemented by a single property-based test

### Integration Testing
- Test complete commit → query → display flow
- Test payment → event → download flow
- Test fork → royalty split flow
- Test verify → trust score update → audit report flow
- Test multi-shard upload → download → reassembly flow

### Test Coverage Requirements
- Smart contract functions: 100% coverage
- CLI commands: Core logic 90%+ coverage
- Error handling paths: 80%+ coverage
- Property tests must cover all 25 correctness properties

### Property 1: Metrics Storage Round-Trip
*For any* commit operation with arbitrary key-value metric pairs, storing those metrics on-chain and then querying the version should return all metrics unchanged.
**Validates: Requirements 1.1, 1.3**

### Property 2: Event Emission for Metrics
*For any* commit with metrics, the system should emit a MetricsRecorded event containing the version ID and all metric key-value pairs.
**Validates: Requirements 1.4**

### Property 3: Log Output Completeness
*For any* commit, the log command output should contain the commit ID, author, timestamp, message, Walrus blob ID, and all stored metrics.
**Validates: Requirements 2.3**

### Property 4: Percentage Formatting
*For any* metric value that represents a percentage, the log display should append a "%" suffix to the value.
**Validates: Requirements 2.4**

### Property 5: Log Filtering Accuracy
*For any* repository name filter, all commits returned by the log command should belong to that repository.
**Validates: Requirements 2.5**

### Property 6: Visual Diff Correctness
*For any* two versions (current and parent), the diff section should mark all added lines with green styling and all removed lines with red styling.
**Validates: Requirements 3.3**

### Property 7: Audit Report Metrics Completeness
*For any* repository, the audit report data table should include all metrics from all versions.
**Validates: Requirements 3.4**

### Property 8: Price Storage Integrity
*For any* repository creation with a specified price, querying the repository should return the exact price value that was set.
**Validates: Requirements 4.1**

### Property 9: Premium Access Control
*For any* repository with price > 0, attempting to clone without completing payment should be blocked until an AccessPurchased event is emitted.
**Validates: Requirements 4.2**

### Property 10: Payment Event Emission
*For any* successful payment transaction, the system should emit an AccessPurchased event containing the buyer address and exact payment amount.
**Validates: Requirements 4.4**

### Property 11: Dependency Storage Integrity
*For any* commit with a vector of dependency IDs, querying the version should return all dependency IDs in the same order.
**Validates: Requirements 5.1**

### Property 12: Dependency Validation
*For any* commit with dependencies, all referenced repository IDs must exist on-chain, otherwise the transaction should fail.
**Validates: Requirements 5.2**

### Property 13: Dependency Graph Completeness
*For any* repository with dependencies, querying should return all upstream and downstream dependencies.
**Validates: Requirements 5.5**

### Property 14: Trust Score Color Coding
*For any* trust score ≥50, the storefront display should use green ANSI color codes; for scores <50, it should use red color codes.
**Validates: Requirements 6.2**

### Property 15: Shard Size Calculation
*For any* repository with multiple shards, the total displayed size should equal the sum of all individual shard sizes.
**Validates: Requirements 6.3**

### Property 16: Shard Storage Integrity
*For any* commit with multiple shard blob IDs, querying the version should return all shard IDs in the exact order they were stored.
**Validates: Requirements 7.1, 7.2**

### Property 17: Shard Reassembly Round-Trip
*For any* file split into shards, uploading the shards and then downloading and reassembling them should produce a file identical to the original.
**Validates: Requirements 7.4**

### Property 18: Fork Attribution
*For any* repository fork operation, the new repository's upstream_author field should be set to the original repository's owner address.
**Validates: Requirements 8.1**

### Property 19: Royalty Payment Split
*For any* payment on a forked repository, 95% should go to the current owner and 5% should go to the upstream_author, and the sum should equal the total payment.
**Validates: Requirements 8.2**

### Property 20: Royalty Event Emission
*For any* royalty payment, the system should emit a RoyaltyPaid event with the upstream_author address and the exact royalty amount (5% of payment).
**Validates: Requirements 8.3**

### Property 21: Dynamic Badge Tier - Bronze
*For any* repository with trust_score in range 0-49, the NFT image_url should point to the bronze badge asset.
**Validates: Requirements 9.2**

### Property 22: Dynamic Badge Tier - Silver
*For any* repository with trust_score in range 50-99, the NFT image_url should point to the silver badge asset.
**Validates: Requirements 9.3**

### Property 23: Dynamic Badge Tier - Gold
*For any* repository with trust_score ≥100, the NFT image_url should point to the gold badge asset.
**Validates: Requirements 9.4**

### Property 24: Badge Auto-Update
*For any* repository, when the trust_score is updated, the NFT image_url should automatically reflect the correct badge tier without requiring manual updates.
**Validates: Requirements 9.5**

### Property 25: Trust Score Increment
*For any* successful verify_reproducibility transaction, the repository trust_score should increase by exactly 1.
**Validates: Requirements 10.4**

## Error Handling

### Smart Contract Error Codes
- `E_INVALID_SIGNATURE`: Signature length is not 64 bytes
- `E_UNAUTHORIZED`: Caller is not the repository owner
- `E_INSUFFICIENT_PAYMENT`: Payment amount is less than repository price
- `E_DEPENDENCY_NOT_FOUND`: Referenced dependency ID does not exist
- `E_INVALID_SHARD_COUNT`: Shard count does not match vector length

### CLI Error Handling
- Network failures: Retry with exponential backoff (max 3 attempts)
- Walrus upload failures: Display error and allow retry
- Payment timeout: Display QR code for 5 minutes, then timeout
- Invalid repository ID: Display user-friendly error message
- Signature generation failure: Log error and exit gracefully

## Testing Strategy

### Unit Testing
- Test individual smart contract functions with various inputs
- Test CLI command parsing and validation
- Test metric formatting functions
- Test shard splitting and reassembly logic
- Test HTML generation with mock data

### Property-Based Testing
- Use **fast-check** library for TypeScript/JavaScript property tests
- Use **Move Prover** for smart contract property verification where applicable
- Configure each property test to run minimum 100 iterations
- Each property-based test must reference its corresponding correctness property using format: `**Feature: ai-provenance-pro, Property {number}: {property_text}**`

### Integration Testing
- Test complete commit → query → display flow
- Test payment → event → download flow
- Test fork → royalty distribution flow
- Test verify → trust score update → audit report generation flow

### Test Coverage Goals
- Smart contract functions: 100% line coverage
- CLI commands: 90% line coverage
- Critical paths (payment, verification): 100% coverage

### Property 1: Metrics Storage Round-Trip
*For any* commit operation with arbitrary key-value metric pairs, storing those metrics on-chain and then querying the version should return all metrics unchanged.
**Validates: Requirements 1.1, 1.3**

### Property 2: Commit Display Completeness
*For any* commit, the rendered log output should contain the commit ID, author, timestamp, message, Walrus blob ID, and all stored metrics.
**Validates: Requirements 2.3**

### Property 3: Percentage Formatting
*For any* metric value that represents a percentage, the formatted output should include a "%" suffix.
**Validates: Requirements 2.4**

### Property 4: Log Filtering Accuracy
*For any* repository name filter, all commits returned by the log command should belong to repositories matching that name.
**Validates: Requirements 2.5**

### Property 5: Visual Diff Color Coding
*For any* two versions being compared, added lines in the diff should have green styling and removed lines should have red styling.
**Validates: Requirements 3.3**

### Property 6: Metrics Table Completeness
*For any* set of versions in an audit report, the data table should contain all metrics from all versions.
**Validates: Requirements 3.4**

### Property 7: Price Storage Integrity
*For any* repository created with a price value, querying that repository should return the same price value.
**Validates: Requirements 4.1**

### Property 8: Premium Access Control
*For any* repository with price > 0, attempting to clone without a valid AccessPurchased event should be blocked.
**Validates: Requirements 4.2**

### Property 9: Payment Event Emission
*For any* successful payment transaction, an AccessPurchased event should be emitted containing the buyer address and exact payment amount.
**Validates: Requirements 4.4**

### Property 10: Dependency Storage Integrity
*For any* commit with a vector of dependency IDs, querying that version should return all dependency IDs in the same order.
**Validates: Requirements 5.1**

### Property 11: Dependency Validation
*For any* commit with dependencies, all referenced repository IDs must exist on-chain, otherwise the transaction should fail.
**Validates: Requirements 5.2**

### Property 12: Dependency Graph Completeness
*For any* repository with dependencies, querying should return both upstream (dependencies) and downstream (dependents) relationships.
**Validates: Requirements 5.5**

### Property 13: Trust Score Color Coding
*For any* trust score value, scores ≥50 should use green ANSI color codes and scores <50 should use red ANSI color codes.
**Validates: Requirements 6.2**

### Property 14: Shard Size Calculation
*For any* repository with multiple shards, the total displayed size should equal the sum of all individual shard sizes.
**Validates: Requirements 6.3**

### Property 15: Shard Storage Integrity
*For any* commit with multiple shard blob IDs, querying the version should return all shard IDs in the original order.
**Validates: Requirements 7.1, 7.2**

### Property 16: Shard Reassembly Round-Trip
*For any* file split into shards and stored, downloading and reassembling those shards should produce a file identical to the original (verified by SHA-256 hash).
**Validates: Requirements 7.4**

### Property 17: Fork Attribution
*For any* forked repository, the upstream_author field should be set to the address of the original repository owner.
**Validates: Requirements 8.1**

### Property 18: Royalty Payment Split
*For any* payment on a forked repository, 95% should go to the current owner and 5% should go to the upstream_author, with both amounts summing to the total payment.
**Validates: Requirements 8.2**

### Property 19: Royalty Event Emission
*For any* royalty payment, a RoyaltyPaid event should be emitted containing the upstream_author address and the exact royalty amount (5% of total).
**Validates: Requirements 8.3**

### Property 20: Badge Tier Mapping
*For any* repository, the NFT image_url should map to bronze badge for trust_score 0-49, silver badge for 50-99, and gold badge for ≥100.
**Validates: Requirements 9.2, 9.3, 9.4**

### Property 21: Badge Auto-Update
*For any* repository where trust_score changes, the NFT image_url should automatically update to reflect the new badge tier without requiring manual updates.
**Validates: Requirements 9.5**

### Property 22: Trust Score Increment
*For any* successful verify_reproducibility transaction, the repository trust_score should increase by exactly 1.
**Validates: Requirements 10.4**

## Error Handling

### Smart Contract Error Codes
```move
const E_INVALID_SIGNATURE: u64 = 1;
const E_INSUFFICIENT_PAYMENT: u64 = 2;
const E_UNAUTHORIZED: u64 = 3;
const E_DEPENDENCY_NOT_FOUND: u64 = 4;
const E_INVALID_SHARD_COUNT: u64 = 5;
const E_REPO_NOT_FOUND: u64 = 6;
```

### Error Handling Strategy

**On-Chain Errors**:
- Invalid signature length in verification → Abort with E_INVALID_SIGNATURE
- Payment amount less than repo price → Abort with E_INSUFFICIENT_PAYMENT
- Non-owner attempting privileged operation → Abort with E_UNAUTHORIZED
- Dependency ID doesn't exist → Abort with E_DEPENDENCY_NOT_FOUND

**CLI Errors**:
- Network failures → Retry up to 3 times with exponential backoff
- Walrus upload failures → Display error and suggest checking blob size/network
- Transaction failures → Parse error code and display user-friendly message
- File not found → Display clear error with expected file path

**Graceful Degradation**:
- If Walrus is unavailable, allow metadata-only commits
- If Chart.js fails to load in audit report, display raw data table
- If QR code generation fails, display payment address as text

## Testing Strategy

### Unit Testing

**Smart Contract Tests** (Move):
- Test each public entry function with valid inputs
- Test error conditions (invalid signatures, insufficient payment, unauthorized access)
- Test event emission for all state-changing operations
- Test edge cases (zero price, empty dependencies, single shard)

**CLI Tests** (TypeScript/Jest):
- Test command parsing and validation
- Test Walrus API integration with mocked responses
- Test Sui RPC integration with mocked blockchain state
- Test file splitting and reassembly logic
- Test HTML report generation with sample data

### Property-Based Testing

**Framework**: Use `fast-check` library for TypeScript property-based testing

**Configuration**: Each property test should run a minimum of 100 iterations

**Test Tagging**: Each property-based test must include a comment with format:
```typescript
// Feature: ai-provenance-pro, Property 1: Metrics Storage Round-Trip
```

**Key Properties to Test**:
1. Metrics round-trip (store arbitrary metrics, retrieve unchanged)
2. Shard reassembly (split file, reassemble, verify hash match)
3. Payment split calculation (95%/5% split always sums to 100%)
4. Trust score color mapping (all scores map to correct color)
5. Badge tier mapping (all trust scores map to correct badge)

### Integration Testing

**End-to-End Scenarios**:
1. Full commit workflow: Upload to Walrus → Store metadata → Verify on-chain
2. Purchase flow: Create premium repo → Attempt clone → Pay → Download
3. Verification flow: Verify repo → Check trust score increment → Generate report
4. Fork flow: Fork repo → Purchase forked repo → Verify royalty payment

**Test Environment**:
- Use Sui testnet for blockchain interactions
- Use Walrus testnet for storage
- Mock TEE signatures for verification tests

### Performance Testing

**Benchmarks**:
- Shard upload time for 1GB, 5GB, 10GB models
- Parallel download performance with 2, 5, 10 shards
- HTML report generation time for 10, 50, 100 versions
- Smart contract gas costs for each operation

**Targets**:
- Shard upload: <30 seconds per 100MB shard
- Report generation: <5 seconds for 100 versions
- Transaction confirmation: <3 seconds on testnet

