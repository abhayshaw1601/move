# Implementation Plan

- [x] 1. Extend smart contract with AI metadata and monetization features



  - Add new fields to Repository struct (price, upstream_author, total_revenue)
  - Add new fields to VersionNode struct (metrics, model_shards, dependencies, shard_count, total_size_bytes)
  - Implement new event structs (AccessPurchased, RoyaltyPaid, MetricsRecorded, ReproducibilityVerified)
  - Add error constants for validation
  - _Requirements: 1.1, 4.1, 5.1, 7.1, 8.1, 9.1_

- [x] 2. Implement metrics storage and retrieval functions




- [x] 2.1 Create commit function with metrics parameter


  - Modify commit function to accept VecMap<String, String> for metrics
  - Store metrics in VersionNode on-chain
  - Emit MetricsRecorded event with version ID and metrics
  - _Requirements: 1.1, 1.4_


- [x] 2.2 Write property test for metrics round-trip


  - **Property 1: Metrics Round-Trip Consistency**
  - **Validates: Requirements 1.1, 1.3**



- [-] 2.3 Write property test for metrics event emission


  - **Property 2: Metrics Event Emission**
  - **Validates: Requirements 1.4**

- [x] 3. Implement sharded model storage


- [x] 3.1 Add shard vector support to commit function

  - Accept vector<String> for model_shards instead of single blob_id
  - Store shard_count and total_size_bytes
  - Validate shard count > 0
  - _Requirements: 7.1, 7.2_

- [x] 3.2 Write property test for shard storage consistency


  - **Property 16: Shard Storage Consistency**
  - **Validates: Requirements 7.1, 7.2**

- [x] 4. Implement dependency tracking




- [x] 4.1 Add dependency vector to commit function


  - Accept vector<ID> for dependencies
  - Validate all dependency IDs exist on-chain
  - Store dependencies in VersionNode
  - _Requirements: 5.1, 5.2_


- [x] 4.2 Write property test for dependency validation


  - **Property 12: Dependency Validation**
  - **Validates: Requirements 5.2**



- [x] 4.3 Write property test for dependency storage


  - **Property 11: Dependency Storage Consistency**
  - **Validates: Requirements 5.1**

- [x] 5. Implement pay-to-clone monetization



- [x] 5.1 Create buy_access function

  - Accept payment in SUI tokens
  - Verify payment amount matches repository price
  - Emit AccessPurchased event
  - Transfer funds to repository owner
  - _Requirements: 4.1, 4.2, 4.4_

- [x] 5.2 Write property test for price storage


  - **Property 8: Repository Price Storage**
  - **Validates: Requirements 4.1**

- [x] 5.3 Write property test for access purchase event


  - **Property 10: Access Purchase Event Emission**
  - **Validates: Requirements 4.4**

- [ ] 6. Implement automated royalty distribution
- [ ] 6.1 Add fork function with upstream_author tracking
  - Create new repository with upstream_author set to original owner
  - Copy relevant metadata from original repository
  - _Requirements: 8.1_

- [ ] 6.2 Modify buy_access to split payments
  - Calculate 95% for current owner, 5% for upstream_author
  - Handle zero address case (100% to owner)
  - Emit RoyaltyPaid event
  - _Requirements: 8.2, 8.3, 8.5_

- [ ] 6.3 Write property test for upstream author recording
  - **Property 18: Fork Upstream Author Recording**
  - **Validates: Requirements 8.1**

- [ ] 6.4 Write property test for royalty split
  - **Property 19: Royalty Payment Split**
  - **Validates: Requirements 8.2**

- [ ] 6.5 Write property test for royalty event
  - **Property 20: Royalty Event Emission**
  - **Validates: Requirements 8.3**

- [ ] 7. Implement TEE verification function
- [ ] 7.1 Create verify_reproducibility function
  - Accept Ed25519 signature (vector<u8>)
  - Validate signature length (64 bytes)
  - Increment trust_score by 1
  - Emit ReproducibilityVerified event
  - _Requirements: 10.2, 10.3, 10.4_

- [ ] 7.2 Write property test for trust score increment
  - **Property 25: Trust Score Increment**
  - **Validates: Requirements 10.4**

- [ ] 8. Implement dynamic NFT display metadata
- [ ] 8.1 Create display initialization function
  - Initialize Sui Display standard for Repository
  - Set dynamic image_url based on trust_score
  - Bronze (0-49), Silver (50-99), Gold (100+)
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 8.2 Write property tests for badge tier mapping
  - **Property 21: Badge Tier Mapping (Bronze)**
  - **Property 22: Badge Tier Mapping (Silver)**
  - **Property 23: Badge Tier Mapping (Gold)**
  - **Validates: Requirements 9.2, 9.3, 9.4**

- [ ] 8.3 Write property test for dynamic badge updates
  - **Property 24: Dynamic Badge Updates**
  - **Validates: Requirements 9.5**

- [ ] 9. Checkpoint - Ensure all smart contract tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Set up CLI project structure
  - Initialize Node.js/TypeScript project
  - Install dependencies: @mysten/sui.js, @noble/ed25519, cli-table3, cli-progress, diff, highlight.js, chart.js
  - Create configuration file structure (~/.provenance/config.json)
  - Set up command parser (commander.js or yargs)
  - _Requirements: All_

- [ ] 11. Implement Walrus integration utilities
- [ ] 11.1 Create shard upload module
  - Split files into 100MB chunks using streams
  - Upload shards in parallel (max 5 concurrent)
  - Calculate SHA-256 hash for each shard
  - Return array of blob IDs
  - _Requirements: 7.1, 7.2_

- [ ] 11.2 Create shard download module
  - Fetch shards concurrently from Walrus
  - Display per-shard progress bars
  - Verify SHA-256 hashes
  - Reassemble shards using streams
  - _Requirements: 7.3, 7.4_

- [ ] 11.3 Write property test for shard reassembly
  - **Property 17: Shard Reassembly Round-Trip**
  - **Validates: Requirements 7.4**

- [ ] 12. Implement enhanced commit command
- [ ] 12.1 Create commit command handler
  - Parse command-line flags (branch, message, accuracy, loss, epochs, f1-score, deps, files)
  - Prompt for missing metrics interactively
  - Split and upload files to Walrus
  - Submit transaction with metrics and shard IDs
  - Display transaction confirmation
  - _Requirements: 1.1, 1.2, 1.5, 5.1, 7.1_

- [ ] 13. Implement rich log command
- [ ] 13.1 Create log command handler
  - Query repository versions from blockchain
  - Format output as tree structure with icons
  - Display metrics, shards, and dependencies
  - Apply repository name filter if provided
  - Format percentage values with "%" suffix
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 13.2 Write property test for log display completeness
  - **Property 3: Log Display Completeness**
  - **Validates: Requirements 2.3**

- [ ] 13.3 Write property test for percentage formatting
  - **Property 4: Percentage Formatting**
  - **Validates: Requirements 2.4**

- [ ] 13.4 Write property test for log filtering
  - **Property 5: Log Filtering Accuracy**
  - **Validates: Requirements 2.5**

- [ ] 14. Implement visual diff generation
- [ ] 14.1 Create diff computation module
  - Download current and parent version blobs from Walrus
  - Use diff library to compute line-by-line differences
  - Generate HTML with syntax highlighting (highlight.js)
  - Apply color coding (green for added, red for removed)
  - _Requirements: 3.3_

- [ ] 14.2 Write property test for diff color coding
  - **Property 6: Visual Diff Color Coding**
  - **Validates: Requirements 3.3**

- [ ] 15. Implement HTML audit report generation
- [ ] 15.1 Create audit report command handler
  - Query all versions and metrics from blockchain
  - Generate Chart.js line graphs (loss curves, accuracy trends)
  - Create data table with all metrics
  - Embed visual diff section
  - Write HTML file with professional layout
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 15.2 Write property test for metrics table completeness
  - **Property 7: Metrics Table Completeness**
  - **Validates: Requirements 3.4**

- [ ] 16. Implement storefront command
- [ ] 16.1 Create storefront command handler
  - Query all repositories from blockchain
  - Calculate total size from shards
  - Apply ANSI color codes based on trust score
  - Format price (display "FREE" for price 0)
  - Render ASCII table using cli-table3
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 16.2 Write property test for trust score colors
  - **Property 14: Trust Score Color Coding**
  - **Validates: Requirements 6.2**

- [ ] 16.3 Write property test for shard size calculation
  - **Property 15: Shard Size Calculation**
  - **Validates: Requirements 6.3**

- [ ] 17. Implement pull command with payment
- [ ] 17.1 Create pull command handler
  - Query repository to check price
  - If premium, generate and display payment QR code
  - Submit buy_access transaction
  - Poll for AccessPurchased event
  - Download shards from Walrus
  - Reassemble and save to output directory
  - _Requirements: 4.2, 4.3, 4.4, 4.5, 7.3, 7.4_

- [ ] 17.2 Write property test for premium access control
  - **Property 9: Premium Access Control**
  - **Validates: Requirements 4.2**

- [ ] 18. Implement inspect command
- [ ] 18.1 Create inspect command handler
  - Query repository metadata
  - Recursively query all dependencies
  - Build dependency graph structure
  - Render tree with arrows showing relationships
  - Display repository details (owner, trust score, price)
  - _Requirements: 5.3, 5.4, 5.5_

- [ ] 18.2 Write property test for dependency query
  - **Property 13: Dependency Query Completeness**
  - **Validates: Requirements 5.5**

- [ ] 19. Implement verify command
- [ ] 19.1 Create verify command handler
  - Generate Ed25519 signature using @noble/ed25519
  - Create payload: SHA256(repo_id + version_id + timestamp)
  - Sign payload with ephemeral keypair
  - Submit transaction to verify_reproducibility
  - Poll for ReproducibilityVerified event
  - Display verification success with new trust score
  - Automatically trigger audit report generation
  - Open HTML file in default browser
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 20. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
