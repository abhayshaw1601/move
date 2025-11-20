# Requirements Document

## Introduction

ProvenancePro is a decentralized AI model provenance and reproducibility platform built on Sui blockchain with Walrus storage. The system addresses the multi-billion dollar AI reproducibility crisis by providing immutable tracking of AI models, datasets, and their lineage while enabling monetization and compliance with regulations like the EU AI Act. The platform transforms blockchain from a simple ledger into a searchable database of AI model performance with built-in marketplace functionality, automated royalties, and trust scoring.

## Glossary

- **ProvenancePro**: The complete AI provenance tracking system including smart contracts, CLI, and visualization tools
- **Repository**: A version-controlled container for AI models or datasets stored on-chain
- **VersionNode**: A single commit/snapshot in the version history containing metadata and blob references
- **Walrus**: Decentralized storage system for large binary objects (models, datasets)
- **Blob**: A stored file or directory in Walrus, referenced by a unique blob ID
- **Shard**: A portion of a large model split across multiple Walrus blobs for efficient storage
- **Trust Score**: An on-chain metric tracking the number of successful TEE (Trusted Execution Environment) verifications
- **AI Metrics**: Performance indicators like accuracy, loss, F1-score, and epochs stored on-chain
- **TEE**: Trusted Execution Environment providing cryptographic proof of reproducibility
- **Lineage Graph**: The dependency chain showing relationships between models and datasets
- **Upstream Author**: The original creator of a model in a fork chain
- **CLI**: Command-line interface for interacting with ProvenancePro
- **Audit Report**: HTML visualization showing model history, metrics, and trust scores
- **Pay-to-Clone**: Monetization feature requiring payment to download premium repositories
- **Dynamic NFT**: Repository representation with visual badges that change based on trust score

## Requirements

### Requirement 1: Structured AI Metadata Storage

**User Story:** As an AI engineer, I want to store performance metrics (accuracy, loss, epochs, F1-score) on-chain with each model version, so that I can verify model quality and track improvements over time without relying on external documentation.

#### Acceptance Criteria

1. WHEN a user commits a new model version THEN the system SHALL store arbitrary key-value metric pairs in a VecMap on-chain
2. WHEN storing metrics THEN the system SHALL support at minimum the keys "Accuracy", "Loss", "Epochs", and "F1-Score" with string values
3. WHEN a user queries a version THEN the system SHALL return all stored metrics as part of the version metadata
4. WHEN metrics are stored THEN the system SHALL emit an event containing the version ID and all metric key-value pairs
5. WHEN the CLI commits a version THEN the system SHALL prompt the user to enter Accuracy, Loss, and Epochs values

### Requirement 2: Rich Log Visualization

**User Story:** As a data scientist, I want to view model history with embedded performance metrics in a tree structure, so that I can quickly understand model evolution and performance trends.

#### Acceptance Criteria

1. WHEN a user executes the log command THEN the system SHALL display a tree structure showing all commits with their metrics
2. WHEN displaying commit information THEN the system SHALL render metrics in a formatted section with icons (📊 for metrics, 📦 for blobs)
3. WHEN showing a commit THEN the system SHALL display the commit ID, author, timestamp, message, Walrus blob ID, and all metrics
4. WHEN metrics exist for a commit THEN the system SHALL format percentage values with "%" suffix and numeric values with appropriate precision
5. WHEN the log command includes a model filter THEN the system SHALL display only commits matching that repository name

### Requirement 3: HTML Audit Report Generation

**User Story:** As a compliance officer, I want to generate visual audit reports showing model performance and exact code changes, so that I can demonstrate regulatory compliance and track implementation evolution.

#### Acceptance Criteria

1. WHEN a user requests an audit report THEN the system SHALL generate an HTML file with embedded Chart.js visualizations
2. WHEN the report is generated THEN the system SHALL include a line graph plotting Loss values across commit history
3. WHEN comparing versions THEN the report SHALL include a "Visual Diff" section showing added lines in green and removed lines in red between the current and parent commit
4. WHEN displaying metrics THEN the system SHALL render a data table showing all metrics for each version
5. WHEN the HTML file is opened THEN the system SHALL display a professional layout with repository name, trust score, interactive charts, and code diff visualization

### Requirement 4: Pay-to-Clone Monetization

**User Story:** As a model creator, I want to set a price for accessing my repository, so that I can monetize my AI models while maintaining provenance tracking.

#### Acceptance Criteria

1. WHEN creating a repository THEN the system SHALL allow the owner to set a price field in SUI tokens
2. WHEN a user attempts to clone a premium repository THEN the system SHALL check if payment has been made
3. WHEN payment is required THEN the CLI SHALL pause and display a payment QR code in the terminal
4. WHEN payment is completed THEN the system SHALL emit an AccessPurchased event with buyer address and amount
5. WHEN the AccessPurchased event is detected THEN the CLI SHALL proceed with downloading the model from Walrus

### Requirement 5: Dataset Lineage Tracking

**User Story:** As an AI researcher, I want to link models to the datasets they were trained on, so that I can trace the complete provenance chain and satisfy EU AI Act requirements.

#### Acceptance Criteria

1. WHEN committing a model version THEN the system SHALL accept a vector of dependency IDs referencing other repositories
2. WHEN dependencies are specified THEN the system SHALL verify that all referenced repository IDs exist on-chain
3. WHEN a user inspects a repository THEN the system SHALL display the complete dependency graph showing linked datasets and models
4. WHEN visualizing dependencies THEN the CLI SHALL render arrows showing relationships (e.g., [Model v2] --trained_on--> [Dataset v5])
5. WHEN querying a repository THEN the system SHALL return all upstream and downstream dependencies

### Requirement 6: Terminal Marketplace Interface

**User Story:** As a developer, I want to browse available models in a professional terminal interface, so that I can discover and evaluate models before purchasing.

#### Acceptance Criteria

1. WHEN a user executes the storefront command THEN the system SHALL display an ASCII table with columns: MODEL NAME, AUTHOR, SIZE, TRUST, PRICE
2. WHEN displaying trust scores THEN the system SHALL use ANSI color codes (Green for scores ≥50, Red for scores <50)
3. WHEN showing repository size THEN the system SHALL calculate total size from all shards and display in human-readable format (GB, MB)
4. WHEN the table is rendered THEN the system SHALL use the cli-table3 library for professional grid formatting
5. WHEN a repository has price 0 THEN the system SHALL display "FREE" instead of "0 SUI"

### Requirement 7: Sharded Model Storage

**User Story:** As an ML engineer, I want to store large models (>1GB) split across multiple Walrus blobs, so that I can efficiently upload and download models without hitting size limits.

#### Acceptance Criteria

1. WHEN committing a model THEN the system SHALL accept a vector of shard blob IDs instead of a single blob ID
2. WHEN storing shards THEN the system SHALL record the shard order and individual blob IDs on-chain
3. WHEN downloading a sharded model THEN the CLI SHALL fetch all shards in parallel with progress indicators
4. WHEN all shards are downloaded THEN the CLI SHALL reassemble them in the correct order into a single file
5. WHEN displaying download progress THEN the system SHALL show per-shard progress bars and total completion percentage

### Requirement 8: Automated Royalty Distribution

**User Story:** As an original model creator, I want to automatically receive royalties when someone forks and sells my model, so that I am compensated for my intellectual property.

#### Acceptance Criteria

1. WHEN a repository is forked THEN the system SHALL record the upstream_author address in the new repository
2. WHEN a user purchases access to a forked repository THEN the system SHALL split payment: 95% to current owner, 5% to upstream_author
3. WHEN royalty payment is made THEN the system SHALL emit a RoyaltyPaid event with recipient address and amount
4. WHEN the CLI completes a purchase THEN the system SHALL display "💸 Royalties Sent: X SUI" in the transaction receipt
5. WHEN the upstream_author is the zero address THEN the system SHALL send 100% of payment to the current owner

### Requirement 9: Dynamic Trust Badge NFTs

**User Story:** As a repository owner, I want my repository NFT to display visual badges that change based on trust score, so that high-quality models are easily recognizable.

#### Acceptance Criteria

1. WHEN a repository is created THEN the system SHALL initialize Sui Display standard metadata with dynamic image_url
2. WHEN trust_score is 0-49 THEN the NFT image_url SHALL point to a bronze badge asset
3. WHEN trust_score is 50-99 THEN the NFT image_url SHALL point to a silver badge asset
4. WHEN trust_score is ≥100 THEN the NFT image_url SHALL point to a gold glowing badge asset
5. WHEN trust_score is updated THEN the NFT metadata SHALL automatically reflect the new badge tier without manual updates

### Requirement 10: TEE Verification Command

**User Story:** As an auditor, I want to verify the reproducibility of a model using a TEE (Trusted Execution Environment) simulation to increase its Trust Score, so that I can provide cryptographic proof of model integrity.

#### Acceptance Criteria

1. WHEN a user executes the verify command with a repository ID THEN the system SHALL simulate a TEE reproducibility check
2. WHEN verifying THEN the CLI SHALL generate a dummy Ed25519 signature locally simulating the TEE attestation
3. WHEN the signature is generated THEN the CLI SHALL submit a transaction to the verify_reproducibility smart contract function
4. WHEN the transaction succeeds THEN the system SHALL increment the repository trust_score by 1 and display the new score
5. WHEN the verification is complete THEN the CLI SHALL automatically generate and open the HTML Audit Report showing the updated trust score
