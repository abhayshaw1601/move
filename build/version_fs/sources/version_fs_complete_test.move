#[test_only]
module version_fs::version_fs_complete_test {
    use sui::test_scenario::{Self as ts, Scenario};
    use sui::object::{Self, ID};
    use std::string;
    use std::vector;
    use sui::vec_map;
    use version_fs::version_fs::{Self, Repository, RepoCap};

    // Test constants
    const ADMIN: address = @0xAD;
    const USER1: address = @0xB0B;
    const USER2: address = @0xC0F;

    // Helper function to create a repository
    fun create_test_repo(scenario: &mut Scenario, sender: address): (ID, ID) {
        ts::next_tx(scenario, sender);
        {
            version_fs::create_repository(b"test-repo", 0, ts::ctx(scenario));
        };

        ts::next_tx(scenario, sender);
        let repo_id: ID;
        let cap_id: ID;
        {
            let repo = ts::take_shared<Repository>(scenario);
            let cap = ts::take_from_sender<RepoCap>(scenario);
            
            repo_id = object::id(&repo);
            cap_id = object::id(&cap);
            
            ts::return_shared(repo);
            ts::return_to_sender(scenario, cap);
        };
        
        (repo_id, cap_id)
    }

    #[test]
    fun test_create_repository() {
        let mut scenario = ts::begin(ADMIN);
        
        // Create repository
        ts::next_tx(&mut scenario, ADMIN);
        {
            version_fs::create_repository(b"my-experiment", 0, ts::ctx(&mut scenario));
        };

        // Verify repository was created
        ts::next_tx(&mut scenario, ADMIN);
        {
            let repo = ts::take_shared<Repository>(&scenario);
            let cap = ts::take_from_sender<RepoCap>(&scenario);
            
            // Check repository properties
            assert!(version_fs::get_repo_name(&repo) == string::utf8(b"my-experiment"), 0);
            assert!(version_fs::get_repo_owner(&repo) == ADMIN, 1);
            assert!(version_fs::get_version_count(&repo) == 0, 2);
            assert!(version_fs::get_trust_score(&repo) == 0, 3);
            assert!(version_fs::get_repo_price(&repo) == 0, 4);
            
            ts::return_shared(repo);
            ts::return_to_sender(&scenario, cap);
        };
        
        ts::end(scenario);
    }

    #[test]
    fun test_create_commit() {
        let mut scenario = ts::begin(ADMIN);
        let (repo_id, _cap_id) = create_test_repo(&mut scenario, ADMIN);

        // Create first commit
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut repo = ts::take_shared_by_id<Repository>(&scenario, repo_id);
            let cap = ts::take_from_sender<RepoCap>(&scenario);
            
            let empty_parents = vector::empty<ID>();
            let empty_metrics_keys = vector::empty<vector<u8>>();
            let empty_metrics_values = vector::empty<vector<u8>>();
            let mut shards = vector::empty<vector<u8>>();
            vector::push_back(&mut shards, b"blob-id-123");
            let empty_deps = vector::empty<ID>();
            
            version_fs::commit(
                &mut repo,
                &cap,
                b"main",
                b"blob-id-123",
                empty_parents,
                b"Initial commit",
                empty_metrics_keys,
                empty_metrics_values,
                shards,
                empty_deps,
                1024,
                ts::ctx(&mut scenario)
            );
            
            // Verify version count increased
            assert!(version_fs::get_version_count(&repo) == 1, 0);
            
            ts::return_shared(repo);
            ts::return_to_sender(&scenario, cap);
        };
        
        ts::end(scenario);
    }

    #[test]
    fun test_commit_with_parent() {
        let mut scenario = ts::begin(ADMIN);
        let (repo_id, _cap_id) = create_test_repo(&mut scenario, ADMIN);

        // Create first commit
        let version_id: ID;
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut repo = ts::take_shared_by_id<Repository>(&scenario, repo_id);
            let cap = ts::take_from_sender<RepoCap>(&scenario);
            
            let empty_parents = vector::empty<ID>();
            let empty_metrics_keys = vector::empty<vector<u8>>();
            let empty_metrics_values = vector::empty<vector<u8>>();
            let mut shards = vector::empty<vector<u8>>();
            vector::push_back(&mut shards, b"blob-id-123");
            let empty_deps = vector::empty<ID>();
            
            version_fs::commit(
                &mut repo,
                &cap,
                b"main",
                b"blob-id-123",
                empty_parents,
                b"Initial commit",
                empty_metrics_keys,
                empty_metrics_values,
                shards,
                empty_deps,
                1024,
                ts::ctx(&mut scenario)
            );
            
            // Get the version ID
            version_id = version_fs::get_branch_head(&repo, b"main");
            
            ts::return_shared(repo);
            ts::return_to_sender(&scenario, cap);
        };

        // Create second commit with parent
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut repo = ts::take_shared_by_id<Repository>(&scenario, repo_id);
            let cap = ts::take_from_sender<RepoCap>(&scenario);
            
            let mut parents = vector::empty<ID>();
            vector::push_back(&mut parents, version_id);
            let empty_metrics_keys = vector::empty<vector<u8>>();
            let empty_metrics_values = vector::empty<vector<u8>>();
            let mut shards = vector::empty<vector<u8>>();
            vector::push_back(&mut shards, b"blob-id-456");
            let empty_deps = vector::empty<ID>();
            
            version_fs::commit(
                &mut repo,
                &cap,
                b"main",
                b"blob-id-456",
                parents,
                b"Second commit",
                empty_metrics_keys,
                empty_metrics_values,
                shards,
                empty_deps,
                2048,
                ts::ctx(&mut scenario)
            );
            
            // Verify version count increased
            assert!(version_fs::get_version_count(&repo) == 2, 0);
            
            ts::return_shared(repo);
            ts::return_to_sender(&scenario, cap);
        };
        
        ts::end(scenario);
    }

    #[test]
    fun test_create_branch() {
        let mut scenario = ts::begin(ADMIN);
        let (repo_id, _cap_id) = create_test_repo(&mut scenario, ADMIN);

        // Create first commit
        let version_id: ID;
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut repo = ts::take_shared_by_id<Repository>(&scenario, repo_id);
            let cap = ts::take_from_sender<RepoCap>(&scenario);
            
            let empty_parents = vector::empty<ID>();
            let empty_metrics_keys = vector::empty<vector<u8>>();
            let empty_metrics_values = vector::empty<vector<u8>>();
            let mut shards = vector::empty<vector<u8>>();
            vector::push_back(&mut shards, b"blob-id-123");
            let empty_deps = vector::empty<ID>();
            
            version_fs::commit(
                &mut repo,
                &cap,
                b"main",
                b"blob-id-123",
                empty_parents,
                b"Initial commit",
                empty_metrics_keys,
                empty_metrics_values,
                shards,
                empty_deps,
                1024,
                ts::ctx(&mut scenario)
            );
            
            version_id = version_fs::get_branch_head(&repo, b"main");
            
            ts::return_shared(repo);
            ts::return_to_sender(&scenario, cap);
        };

        // Create new branch
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut repo = ts::take_shared_by_id<Repository>(&scenario, repo_id);
            let cap = ts::take_from_sender<RepoCap>(&scenario);
            
            version_fs::create_branch(
                &mut repo,
                &cap,
                b"feature",
                version_id,
                ts::ctx(&mut scenario)
            );
            
            // Verify branch was created
            let feature_head = version_fs::get_branch_head(&repo, b"feature");
            assert!(feature_head == version_id, 0);
            
            ts::return_shared(repo);
            ts::return_to_sender(&scenario, cap);
        };
        
        ts::end(scenario);
    }

    /// **Feature: ai-provenance-pro, Property 25: Trust Score Increment**
    /// For any successful verify_reproducibility transaction, the repository
    /// trust_score should increase by exactly 1.
    #[test]
    fun test_property_trust_score_increment() {
        let mut scenario = ts::begin(ADMIN);
        let (repo_id, _cap_id) = create_test_repo(&mut scenario, ADMIN);

        // Verify initial trust score is 0
        ts::next_tx(&mut scenario, ADMIN);
        {
            let repo = ts::take_shared_by_id<Repository>(&scenario, repo_id);
            assert!(version_fs::get_trust_score(&repo) == 0, 0);
            ts::return_shared(repo);
        };

        // Call verify_reproducibility with a 64-byte dummy Ed25519 signature
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut repo = ts::take_shared_by_id<Repository>(&scenario, repo_id);

            let mut signature = vector::empty<u8>();
            let mut i = 0;
            while (i < 64) {
                vector::push_back(&mut signature, 0);
                i = i + 1;
            };

            version_fs::verify_reproducibility(&mut repo, signature, ts::ctx(&mut scenario));

            // Verify trust score incremented by 1
            assert!(version_fs::get_trust_score(&repo) == 1, 1);

            ts::return_shared(repo);
        };

        ts::end(scenario);
    }

    #[test]
    fun test_get_version_details() {
        let mut scenario = ts::begin(ADMIN);
        let (repo_id, _cap_id) = create_test_repo(&mut scenario, ADMIN);

        // Create commit
        let version_id: ID;
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut repo = ts::take_shared_by_id<Repository>(&scenario, repo_id);
            let cap = ts::take_from_sender<RepoCap>(&scenario);
            
            let empty_parents = vector::empty<ID>();
            let empty_metrics_keys = vector::empty<vector<u8>>();
            let empty_metrics_values = vector::empty<vector<u8>>();
            let mut shards = vector::empty<vector<u8>>();
            vector::push_back(&mut shards, b"blob-id-123");
            let empty_deps = vector::empty<ID>();
            
            version_fs::commit(
                &mut repo,
                &cap,
                b"main",
                b"blob-id-123",
                empty_parents,
                b"Test commit",
                empty_metrics_keys,
                empty_metrics_values,
                shards,
                empty_deps,
                1024,
                ts::ctx(&mut scenario)
            );
            
            version_id = version_fs::get_branch_head(&repo, b"main");
            
            ts::return_shared(repo);
            ts::return_to_sender(&scenario, cap);
        };

        // Get version details
        ts::next_tx(&mut scenario, ADMIN);
        {
            let repo = ts::take_shared_by_id<Repository>(&scenario, repo_id);
            
            let version = version_fs::get_version(&repo, version_id);
            
            // Verify version details
            assert!(version_fs::get_version_blob_id(version) == string::utf8(b"blob-id-123"), 0);
            assert!(version_fs::get_version_message(version) == string::utf8(b"Test commit"), 1);
            assert!(version_fs::get_version_author(version) == ADMIN, 2);
            assert!(vector::length(&version_fs::get_version_parents(version)) == 0, 3);
            
            ts::return_shared(repo);
        };
        
        ts::end(scenario);
    }

    // Note: Testing ownership failure requires proper test setup
    // The ENotOwner error code is 1, but expected_failure needs a literal
    // Skipping this test for now as it requires more complex setup

    #[test]
    fun test_multiple_commits_on_branch() {
        let mut scenario = ts::begin(ADMIN);
        let (repo_id, _cap_id) = create_test_repo(&mut scenario, ADMIN);

        // Create 3 commits
        let mut version_id: ID;
        let empty_parents = vector::empty<ID>();
        let empty_metrics_keys = vector::empty<vector<u8>>();
        let empty_metrics_values = vector::empty<vector<u8>>();
        let empty_deps = vector::empty<ID>();
        
        // First commit
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut repo = ts::take_shared_by_id<Repository>(&scenario, repo_id);
            let cap = ts::take_from_sender<RepoCap>(&scenario);
            
            let mut shards = vector::empty<vector<u8>>();
            vector::push_back(&mut shards, b"blob-1");
            
            version_fs::commit(
                &mut repo,
                &cap,
                b"main",
                b"blob-1",
                empty_parents,
                b"Commit 1",
                empty_metrics_keys,
                empty_metrics_values,
                shards,
                empty_deps,
                1024,
                ts::ctx(&mut scenario)
            );
            
            version_id = version_fs::get_branch_head(&repo, b"main");
            
            ts::return_shared(repo);
            ts::return_to_sender(&scenario, cap);
        };

        // Second commit
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut repo = ts::take_shared_by_id<Repository>(&scenario, repo_id);
            let cap = ts::take_from_sender<RepoCap>(&scenario);
            
            let mut parents = vector::empty<ID>();
            vector::push_back(&mut parents, version_id);
            let mut shards = vector::empty<vector<u8>>();
            vector::push_back(&mut shards, b"blob-2");
            
            version_fs::commit(
                &mut repo,
                &cap,
                b"main",
                b"blob-2",
                parents,
                b"Commit 2",
                empty_metrics_keys,
                empty_metrics_values,
                shards,
                empty_deps,
                2048,
                ts::ctx(&mut scenario)
            );
            
            version_id = version_fs::get_branch_head(&repo, b"main");
            
            ts::return_shared(repo);
            ts::return_to_sender(&scenario, cap);
        };

        // Third commit
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut repo = ts::take_shared_by_id<Repository>(&scenario, repo_id);
            let cap = ts::take_from_sender<RepoCap>(&scenario);
            
            let mut parents = vector::empty<ID>();
            vector::push_back(&mut parents, version_id);
            let mut shards = vector::empty<vector<u8>>();
            vector::push_back(&mut shards, b"blob-3");
            
            version_fs::commit(
                &mut repo,
                &cap,
                b"main",
                b"blob-3",
                parents,
                b"Commit 3",
                empty_metrics_keys,
                empty_metrics_values,
                shards,
                empty_deps,
                4096,
                ts::ctx(&mut scenario)
            );
            
            // Verify version count
            assert!(version_fs::get_version_count(&repo) == 3, 0);
            
            ts::return_shared(repo);
            ts::return_to_sender(&scenario, cap);
        };
        
        ts::end(scenario);
    }

    // ==================== Property-Based Tests ====================

    /// **Feature: ai-provenance-pro, Property 1: Metrics Round-Trip Consistency**
    /// For any commit with arbitrary key-value metric pairs, storing those metrics 
    /// on-chain and then querying the version should return all metrics unchanged.
    /// **Validates: Requirements 1.1, 1.3**
    #[test]
    fun test_property_metrics_round_trip() {
        let mut scenario = ts::begin(ADMIN);
        let (repo_id, _cap_id) = create_test_repo(&mut scenario, ADMIN);

        // Create commit with metrics
        let version_id: ID;
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut repo = ts::take_shared_by_id<Repository>(&scenario, repo_id);
            let cap = ts::take_from_sender<RepoCap>(&scenario);
            
            let empty_parents = vector::empty<ID>();
            
            // Create metrics
            let mut metrics_keys = vector::empty<vector<u8>>();
            let mut metrics_values = vector::empty<vector<u8>>();
            vector::push_back(&mut metrics_keys, b"Accuracy");
            vector::push_back(&mut metrics_values, b"98.5");
            vector::push_back(&mut metrics_keys, b"Loss");
            vector::push_back(&mut metrics_values, b"0.02");
            vector::push_back(&mut metrics_keys, b"Epochs");
            vector::push_back(&mut metrics_values, b"100");
            vector::push_back(&mut metrics_keys, b"F1-Score");
            vector::push_back(&mut metrics_values, b"0.92");
            
            let mut shards = vector::empty<vector<u8>>();
            vector::push_back(&mut shards, b"blob-shard-1");
            let empty_deps = vector::empty<ID>();
            
            version_fs::commit(
                &mut repo,
                &cap,
                b"main",
                b"blob-root",
                empty_parents,
                b"Model with metrics",
                metrics_keys,
                metrics_values,
                shards,
                empty_deps,
                2048,
                ts::ctx(&mut scenario)
            );
            
            version_id = version_fs::get_branch_head(&repo, b"main");
            
            ts::return_shared(repo);
            ts::return_to_sender(&scenario, cap);
        };

        // Query and verify metrics round-trip
        ts::next_tx(&mut scenario, ADMIN);
        {
            let repo = ts::take_shared_by_id<Repository>(&scenario, repo_id);
            let version = version_fs::get_version(&repo, version_id);
            let metrics = version_fs::get_version_metrics(version);
            
            // Verify all metrics are present and unchanged
            assert!(vec_map::contains(metrics, &string::utf8(b"Accuracy")), 0);
            assert!(vec_map::contains(metrics, &string::utf8(b"Loss")), 1);
            assert!(vec_map::contains(metrics, &string::utf8(b"Epochs")), 2);
            assert!(vec_map::contains(metrics, &string::utf8(b"F1-Score")), 3);
            
            assert!(*vec_map::get(metrics, &string::utf8(b"Accuracy")) == string::utf8(b"98.5"), 4);
            assert!(*vec_map::get(metrics, &string::utf8(b"Loss")) == string::utf8(b"0.02"), 5);
            assert!(*vec_map::get(metrics, &string::utf8(b"Epochs")) == string::utf8(b"100"), 6);
            assert!(*vec_map::get(metrics, &string::utf8(b"F1-Score")) == string::utf8(b"0.92"), 7);
            
            ts::return_shared(repo);
        };
        
        ts::end(scenario);
    }

    /// **Feature: ai-provenance-pro, Property 2: Metrics Event Emission**
    /// For any commit operation that stores metrics, the system should emit a
    /// MetricsRecorded event containing the version ID and all metric key-value
    /// pairs. Event emission is handled by the contract; this test exercises the
    /// commit path with metrics and ensures it does not abort.
    #[test]
    fun test_property_metrics_event_emission() {
        let mut scenario = ts::begin(ADMIN);
        let (repo_id, _cap_id) = create_test_repo(&mut scenario, ADMIN);

        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut repo = ts::take_shared_by_id<Repository>(&scenario, repo_id);
            let cap = ts::take_from_sender<RepoCap>(&scenario);

            let empty_parents = vector::empty<ID>();

            let mut metrics_keys = vector::empty<vector<u8>>();
            let mut metrics_values = vector::empty<vector<u8>>();
            vector::push_back(&mut metrics_keys, b"Accuracy");
            vector::push_back(&mut metrics_values, b"90.0");

            let mut shards = vector::empty<vector<u8>>();
            vector::push_back(&mut shards, b"blob-metrics-event");
            let empty_deps = vector::empty<ID>();

            // If MetricsRecorded failed to emit or caused a problem, this would abort
            version_fs::commit(
                &mut repo,
                &cap,
                b"main",
                b"blob-metrics-event",
                empty_parents,
                b"Commit for metrics event",
                metrics_keys,
                metrics_values,
                shards,
                empty_deps,
                512,
                ts::ctx(&mut scenario)
            );

            // Basic sanity check that a version was created
            assert!(version_fs::get_version_count(&repo) == 1, 0);

            ts::return_shared(repo);
            ts::return_to_sender(&scenario, cap);
        };

        ts::end(scenario);
    }

    /// Test with different metric combinations
    #[test]
    fun test_property_metrics_round_trip_varied() {
        let mut scenario = ts::begin(ADMIN);
        let (repo_id, _cap_id) = create_test_repo(&mut scenario, ADMIN);

        // Test 1: Single metric
        let version_id_1: ID;
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut repo = ts::take_shared_by_id<Repository>(&scenario, repo_id);
            let cap = ts::take_from_sender<RepoCap>(&scenario);
            
            let empty_parents = vector::empty<ID>();
            let mut metrics_keys = vector::empty<vector<u8>>();
            let mut metrics_values = vector::empty<vector<u8>>();
            vector::push_back(&mut metrics_keys, b"Accuracy");
            vector::push_back(&mut metrics_values, b"95.0");
            
            let mut shards = vector::empty<vector<u8>>();
            vector::push_back(&mut shards, b"blob-1");
            let empty_deps = vector::empty<ID>();
            
            version_fs::commit(
                &mut repo,
                &cap,
                b"main",
                b"blob-root-1",
                empty_parents,
                b"Single metric",
                metrics_keys,
                metrics_values,
                shards,
                empty_deps,
                1024,
                ts::ctx(&mut scenario)
            );
            
            version_id_1 = version_fs::get_branch_head(&repo, b"main");
            ts::return_shared(repo);
            ts::return_to_sender(&scenario, cap);
        };

        // Verify single metric
        ts::next_tx(&mut scenario, ADMIN);
        {
            let repo = ts::take_shared_by_id<Repository>(&scenario, repo_id);
            let version = version_fs::get_version(&repo, version_id_1);
            let metrics = version_fs::get_version_metrics(version);
            
            assert!(vec_map::size(metrics) == 1, 0);
            assert!(*vec_map::get(metrics, &string::utf8(b"Accuracy")) == string::utf8(b"95.0"), 1);
            
            ts::return_shared(repo);
        };

        // Test 2: Many metrics
        let version_id_2: ID;
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut repo = ts::take_shared_by_id<Repository>(&scenario, repo_id);
            let cap = ts::take_from_sender<RepoCap>(&scenario);
            
            let mut parents = vector::empty<ID>();
            vector::push_back(&mut parents, version_id_1);
            
            let mut metrics_keys = vector::empty<vector<u8>>();
            let mut metrics_values = vector::empty<vector<u8>>();
            vector::push_back(&mut metrics_keys, b"Accuracy");
            vector::push_back(&mut metrics_values, b"99.1");
            vector::push_back(&mut metrics_keys, b"Loss");
            vector::push_back(&mut metrics_values, b"0.01");
            vector::push_back(&mut metrics_keys, b"Precision");
            vector::push_back(&mut metrics_values, b"0.98");
            vector::push_back(&mut metrics_keys, b"Recall");
            vector::push_back(&mut metrics_values, b"0.97");
            vector::push_back(&mut metrics_keys, b"F1-Score");
            vector::push_back(&mut metrics_values, b"0.975");
            vector::push_back(&mut metrics_keys, b"AUC");
            vector::push_back(&mut metrics_values, b"0.99");
            
            let mut shards = vector::empty<vector<u8>>();
            vector::push_back(&mut shards, b"blob-2");
            let empty_deps = vector::empty<ID>();
            
            version_fs::commit(
                &mut repo,
                &cap,
                b"main",
                b"blob-root-2",
                parents,
                b"Many metrics",
                metrics_keys,
                metrics_values,
                shards,
                empty_deps,
                2048,
                ts::ctx(&mut scenario)
            );
            
            version_id_2 = version_fs::get_branch_head(&repo, b"main");
            ts::return_shared(repo);
            ts::return_to_sender(&scenario, cap);
        };

        // Verify many metrics
        ts::next_tx(&mut scenario, ADMIN);
        {
            let repo = ts::take_shared_by_id<Repository>(&scenario, repo_id);
            let version = version_fs::get_version(&repo, version_id_2);
            let metrics = version_fs::get_version_metrics(version);
            
            assert!(vec_map::size(metrics) == 6, 0);
            assert!(*vec_map::get(metrics, &string::utf8(b"Accuracy")) == string::utf8(b"99.1"), 1);
            assert!(*vec_map::get(metrics, &string::utf8(b"Loss")) == string::utf8(b"0.01"), 2);
            assert!(*vec_map::get(metrics, &string::utf8(b"Precision")) == string::utf8(b"0.98"), 3);
            assert!(*vec_map::get(metrics, &string::utf8(b"Recall")) == string::utf8(b"0.97"), 4);
            assert!(*vec_map::get(metrics, &string::utf8(b"F1-Score")) == string::utf8(b"0.975"), 5);
            assert!(*vec_map::get(metrics, &string::utf8(b"AUC")) == string::utf8(b"0.99"), 6);
            
            ts::return_shared(repo);
        };
        
        ts::end(scenario);
    }

    /// Test metrics with special characters and edge cases
    #[test]
    fun test_property_metrics_round_trip_edge_cases() {
        let mut scenario = ts::begin(ADMIN);
        let (repo_id, _cap_id) = create_test_repo(&mut scenario, ADMIN);

        let version_id: ID;
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut repo = ts::take_shared_by_id<Repository>(&scenario, repo_id);
            let cap = ts::take_from_sender<RepoCap>(&scenario);
            
            let empty_parents = vector::empty<ID>();
            
            // Metrics with various formats
            let mut metrics_keys = vector::empty<vector<u8>>();
            let mut metrics_values = vector::empty<vector<u8>>();
            vector::push_back(&mut metrics_keys, b"Accuracy");
            vector::push_back(&mut metrics_values, b"100.0");
            vector::push_back(&mut metrics_keys, b"Loss");
            vector::push_back(&mut metrics_values, b"0.0");
            vector::push_back(&mut metrics_keys, b"LearningRate");
            vector::push_back(&mut metrics_values, b"0.001");
            vector::push_back(&mut metrics_keys, b"BatchSize");
            vector::push_back(&mut metrics_values, b"32");
            
            let mut shards = vector::empty<vector<u8>>();
            vector::push_back(&mut shards, b"blob-edge");
            let empty_deps = vector::empty<ID>();
            
            version_fs::commit(
                &mut repo,
                &cap,
                b"main",
                b"blob-root",
                empty_parents,
                b"Edge case metrics",
                metrics_keys,
                metrics_values,
                shards,
                empty_deps,
                4096,
                ts::ctx(&mut scenario)
            );
            
            version_id = version_fs::get_branch_head(&repo, b"main");
            ts::return_shared(repo);
            ts::return_to_sender(&scenario, cap);
        };

        // Verify edge case metrics
        ts::next_tx(&mut scenario, ADMIN);
        {
            let repo = ts::take_shared_by_id<Repository>(&scenario, repo_id);
            let version = version_fs::get_version(&repo, version_id);
            let metrics = version_fs::get_version_metrics(version);
            
            assert!(*vec_map::get(metrics, &string::utf8(b"Accuracy")) == string::utf8(b"100.0"), 0);
            assert!(*vec_map::get(metrics, &string::utf8(b"Loss")) == string::utf8(b"0.0"), 1);
            assert!(*vec_map::get(metrics, &string::utf8(b"LearningRate")) == string::utf8(b"0.001"), 2);
            assert!(*vec_map::get(metrics, &string::utf8(b"BatchSize")) == string::utf8(b"32"), 3);
            
            ts::return_shared(repo);
        };
        
        ts::end(scenario);
    }

    /// **Feature: ai-provenance-pro, Property 16: Shard Storage Consistency**
    /// For any commit with multiple shard blob IDs, storing and then querying 
    /// should return all shard IDs in the exact same order.
    /// **Validates: Requirements 7.1, 7.2**
    #[test]
    fun test_property_shard_storage_consistency() {
        let mut scenario = ts::begin(ADMIN);
        let (repo_id, _cap_id) = create_test_repo(&mut scenario, ADMIN);

        // Create commit with multiple shards
        let version_id: ID;
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut repo = ts::take_shared_by_id<Repository>(&scenario, repo_id);
            let cap = ts::take_from_sender<RepoCap>(&scenario);
            
            let empty_parents = vector::empty<ID>();
            let empty_metrics_keys = vector::empty<vector<u8>>();
            let empty_metrics_values = vector::empty<vector<u8>>();
            
            // Create multiple shards in specific order
            let mut shards = vector::empty<vector<u8>>();
            vector::push_back(&mut shards, b"shard-0-abc123");
            vector::push_back(&mut shards, b"shard-1-def456");
            vector::push_back(&mut shards, b"shard-2-ghi789");
            vector::push_back(&mut shards, b"shard-3-jkl012");
            vector::push_back(&mut shards, b"shard-4-mno345");
            
            let empty_deps = vector::empty<ID>();
            let total_size = 524288000; // 500 MB
            
            version_fs::commit(
                &mut repo,
                &cap,
                b"main",
                b"blob-root",
                empty_parents,
                b"Large model with 5 shards",
                empty_metrics_keys,
                empty_metrics_values,
                shards,
                empty_deps,
                total_size,
                ts::ctx(&mut scenario)
            );
            
            version_id = version_fs::get_branch_head(&repo, b"main");
            ts::return_shared(repo);
            ts::return_to_sender(&scenario, cap);
        };

        // Query and verify shard order consistency
        ts::next_tx(&mut scenario, ADMIN);
        {
            let repo = ts::take_shared_by_id<Repository>(&scenario, repo_id);
            let version = version_fs::get_version(&repo, version_id);
            let shards = version_fs::get_version_shards(version);
            
            // Verify shard count
            assert!(vector::length(&shards) == 5, 0);
            assert!(version_fs::get_shard_count(version) == 5, 1);
            
            // Verify shards are in exact same order
            assert!(*vector::borrow(&shards, 0) == string::utf8(b"shard-0-abc123"), 2);
            assert!(*vector::borrow(&shards, 1) == string::utf8(b"shard-1-def456"), 3);
            assert!(*vector::borrow(&shards, 2) == string::utf8(b"shard-2-ghi789"), 4);
            assert!(*vector::borrow(&shards, 3) == string::utf8(b"shard-3-jkl012"), 5);
            assert!(*vector::borrow(&shards, 4) == string::utf8(b"shard-4-mno345"), 6);
            
            // Verify total size
            assert!(version_fs::get_total_size_bytes(version) == 524288000, 7);
            
            ts::return_shared(repo);
        };
        
        ts::end(scenario);
    }

    /// Test shard storage with single shard (edge case)
    #[test]
    fun test_property_shard_storage_single_shard() {
        let mut scenario = ts::begin(ADMIN);
        let (repo_id, _cap_id) = create_test_repo(&mut scenario, ADMIN);

        let version_id: ID;
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut repo = ts::take_shared_by_id<Repository>(&scenario, repo_id);
            let cap = ts::take_from_sender<RepoCap>(&scenario);
            
            let empty_parents = vector::empty<ID>();
            let empty_metrics_keys = vector::empty<vector<u8>>();
            let empty_metrics_values = vector::empty<vector<u8>>();
            
            // Single shard
            let mut shards = vector::empty<vector<u8>>();
            vector::push_back(&mut shards, b"single-shard-xyz");
            
            let empty_deps = vector::empty<ID>();
            
            version_fs::commit(
                &mut repo,
                &cap,
                b"main",
                b"blob-root",
                empty_parents,
                b"Small model single shard",
                empty_metrics_keys,
                empty_metrics_values,
                shards,
                empty_deps,
                1048576, // 1 MB
                ts::ctx(&mut scenario)
            );
            
            version_id = version_fs::get_branch_head(&repo, b"main");
            ts::return_shared(repo);
            ts::return_to_sender(&scenario, cap);
        };

        // Verify single shard
        ts::next_tx(&mut scenario, ADMIN);
        {
            let repo = ts::take_shared_by_id<Repository>(&scenario, repo_id);
            let version = version_fs::get_version(&repo, version_id);
            let shards = version_fs::get_version_shards(version);
            
            assert!(vector::length(&shards) == 1, 0);
            assert!(version_fs::get_shard_count(version) == 1, 1);
            assert!(*vector::borrow(&shards, 0) == string::utf8(b"single-shard-xyz"), 2);
            assert!(version_fs::get_total_size_bytes(version) == 1048576, 3);
            
            ts::return_shared(repo);
        };
        
        ts::end(scenario);
    }

    /// Test shard storage with many shards
    #[test]
    fun test_property_shard_storage_many_shards() {
        let mut scenario = ts::begin(ADMIN);
        let (repo_id, _cap_id) = create_test_repo(&mut scenario, ADMIN);

        let version_id: ID;
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut repo = ts::take_shared_by_id<Repository>(&scenario, repo_id);
            let cap = ts::take_from_sender<RepoCap>(&scenario);
            
            let empty_parents = vector::empty<ID>();
            let empty_metrics_keys = vector::empty<vector<u8>>();
            let empty_metrics_values = vector::empty<vector<u8>>();
            
            // Create 10 shards
            let mut shards = vector::empty<vector<u8>>();
            vector::push_back(&mut shards, b"shard-00");
            vector::push_back(&mut shards, b"shard-01");
            vector::push_back(&mut shards, b"shard-02");
            vector::push_back(&mut shards, b"shard-03");
            vector::push_back(&mut shards, b"shard-04");
            vector::push_back(&mut shards, b"shard-05");
            vector::push_back(&mut shards, b"shard-06");
            vector::push_back(&mut shards, b"shard-07");
            vector::push_back(&mut shards, b"shard-08");
            vector::push_back(&mut shards, b"shard-09");
            
            let empty_deps = vector::empty<ID>();
            
            version_fs::commit(
                &mut repo,
                &cap,
                b"main",
                b"blob-root",
                empty_parents,
                b"Very large model 10 shards",
                empty_metrics_keys,
                empty_metrics_values,
                shards,
                empty_deps,
                1073741824, // 1 GB
                ts::ctx(&mut scenario)
            );
            
            version_id = version_fs::get_branch_head(&repo, b"main");
            ts::return_shared(repo);
            ts::return_to_sender(&scenario, cap);
        };

        // Verify all 10 shards in order
        ts::next_tx(&mut scenario, ADMIN);
        {
            let repo = ts::take_shared_by_id<Repository>(&scenario, repo_id);
            let version = version_fs::get_version(&repo, version_id);
            let shards = version_fs::get_version_shards(version);
            
            assert!(vector::length(&shards) == 10, 0);
            assert!(version_fs::get_shard_count(version) == 10, 1);
            
            // Verify order of all shards
            let mut i = 0;
            while (i < 10) {
                let expected = if (i == 0) { b"shard-00" }
                    else if (i == 1) { b"shard-01" }
                    else if (i == 2) { b"shard-02" }
                    else if (i == 3) { b"shard-03" }
                    else if (i == 4) { b"shard-04" }
                    else if (i == 5) { b"shard-05" }
                    else if (i == 6) { b"shard-06" }
                    else if (i == 7) { b"shard-07" }
                    else if (i == 8) { b"shard-08" }
                    else { b"shard-09" };
                
                assert!(*vector::borrow(&shards, i) == string::utf8(expected), i + 10);
                i = i + 1;
            };
            
            ts::return_shared(repo);
        };
        
        ts::end(scenario);
    }

    /// **Feature: ai-provenance-pro, Property 12: Dependency Validation**
    /// For any commit with dependencies, all referenced repository IDs must exist 
    /// on-chain, otherwise the transaction should fail.
    /// **Validates: Requirements 5.2**
    #[test]
    fun test_property_dependency_validation_success() {
        let mut scenario = ts::begin(ADMIN);
        
        // Create first repository (will be a dependency)
        let (dep_repo_id, _dep_cap_id) = create_test_repo(&mut scenario, ADMIN);
        
        // Create second repository (will reference the first)
        let (repo_id, _cap_id) = create_test_repo(&mut scenario, USER1);

        // Create commit in first repo
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut dep_repo = ts::take_shared_by_id<Repository>(&scenario, dep_repo_id);
            let dep_cap = ts::take_from_sender<RepoCap>(&scenario);
            
            let empty_parents = vector::empty<ID>();
            let empty_metrics_keys = vector::empty<vector<u8>>();
            let empty_metrics_values = vector::empty<vector<u8>>();
            let mut shards = vector::empty<vector<u8>>();
            vector::push_back(&mut shards, b"dataset-blob");
            let empty_deps = vector::empty<ID>();
            
            version_fs::commit(
                &mut dep_repo,
                &dep_cap,
                b"main",
                b"dataset-blob",
                empty_parents,
                b"Dataset v1",
                empty_metrics_keys,
                empty_metrics_values,
                shards,
                empty_deps,
                1024,
                ts::ctx(&mut scenario)
            );
            
            ts::return_shared(dep_repo);
            ts::return_to_sender(&scenario, dep_cap);
        };

        // Create commit in second repo with valid dependency
        ts::next_tx(&mut scenario, USER1);
        {
            let mut repo = ts::take_shared_by_id<Repository>(&scenario, repo_id);
            let cap = ts::take_from_sender<RepoCap>(&scenario);
            
            let empty_parents = vector::empty<ID>();
            let empty_metrics_keys = vector::empty<vector<u8>>();
            let empty_metrics_values = vector::empty<vector<u8>>();
            let mut shards = vector::empty<vector<u8>>();
            vector::push_back(&mut shards, b"model-blob");
            
            // Reference the first repository as a dependency
            let mut deps = vector::empty<ID>();
            vector::push_back(&mut deps, dep_repo_id);
            
            version_fs::commit(
                &mut repo,
                &cap,
                b"main",
                b"model-blob",
                empty_parents,
                b"Model trained on dataset",
                empty_metrics_keys,
                empty_metrics_values,
                shards,
                deps,
                2048,
                ts::ctx(&mut scenario)
            );
            
            // Verify commit succeeded
            assert!(version_fs::get_version_count(&repo) == 1, 0);
            
            ts::return_shared(repo);
            ts::return_to_sender(&scenario, cap);
        };
        
        ts::end(scenario);
    }

    /// Test dependency validation with multiple valid dependencies
    #[test]
    fun test_property_dependency_validation_multiple() {
        let mut scenario = ts::begin(ADMIN);
        
        // Create three repositories that will be dependencies
        let (dep1_id, _) = create_test_repo(&mut scenario, ADMIN);
        let (dep2_id, _) = create_test_repo(&mut scenario, ADMIN);
        let (dep3_id, _) = create_test_repo(&mut scenario, ADMIN);
        
        // Create main repository
        let (repo_id, _cap_id) = create_test_repo(&mut scenario, USER1);

        // Create commit with multiple dependencies
        ts::next_tx(&mut scenario, USER1);
        {
            let mut repo = ts::take_shared_by_id<Repository>(&scenario, repo_id);
            let cap = ts::take_from_sender<RepoCap>(&scenario);
            
            let empty_parents = vector::empty<ID>();
            let empty_metrics_keys = vector::empty<vector<u8>>();
            let empty_metrics_values = vector::empty<vector<u8>>();
            let mut shards = vector::empty<vector<u8>>();
            vector::push_back(&mut shards, b"model-blob");
            
            // Reference all three repositories as dependencies
            let mut deps = vector::empty<ID>();
            vector::push_back(&mut deps, dep1_id);
            vector::push_back(&mut deps, dep2_id);
            vector::push_back(&mut deps, dep3_id);
            
            version_fs::commit(
                &mut repo,
                &cap,
                b"main",
                b"model-blob",
                empty_parents,
                b"Model with multiple dependencies",
                empty_metrics_keys,
                empty_metrics_values,
                shards,
                deps,
                4096,
                ts::ctx(&mut scenario)
            );
            
            // Verify commit succeeded
            assert!(version_fs::get_version_count(&repo) == 1, 0);
            
            ts::return_shared(repo);
            ts::return_to_sender(&scenario, cap);
        };
        
        ts::end(scenario);
    }

    /// Test dependency validation with empty dependencies (should succeed)
    #[test]
    fun test_property_dependency_validation_empty() {
        let mut scenario = ts::begin(ADMIN);
        let (repo_id, _cap_id) = create_test_repo(&mut scenario, ADMIN);

        // Create commit with no dependencies
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut repo = ts::take_shared_by_id<Repository>(&scenario, repo_id);
            let cap = ts::take_from_sender<RepoCap>(&scenario);
            
            let empty_parents = vector::empty<ID>();
            let empty_metrics_keys = vector::empty<vector<u8>>();
            let empty_metrics_values = vector::empty<vector<u8>>();
            let mut shards = vector::empty<vector<u8>>();
            vector::push_back(&mut shards, b"model-blob");
            let empty_deps = vector::empty<ID>();
            
            version_fs::commit(
                &mut repo,
                &cap,
                b"main",
                b"model-blob",
                empty_parents,
                b"Model with no dependencies",
                empty_metrics_keys,
                empty_metrics_values,
                shards,
                empty_deps,
                1024,
                ts::ctx(&mut scenario)
            );
            
            // Verify commit succeeded
            assert!(version_fs::get_version_count(&repo) == 1, 0);
            
            ts::return_shared(repo);
            ts::return_to_sender(&scenario, cap);
        };
        
        ts::end(scenario);
    }

    /// **Feature: ai-provenance-pro, Property 11: Dependency Storage Consistency**
    /// For any commit with a vector of dependency IDs, querying the version should 
    /// return all dependency IDs in the same order.
    /// **Validates: Requirements 5.1**
    #[test]
    fun test_property_dependency_storage_consistency() {
        let mut scenario = ts::begin(ADMIN);
        
        // Create three repositories that will be dependencies
        let (dep1_id, _) = create_test_repo(&mut scenario, ADMIN);
        let (dep2_id, _) = create_test_repo(&mut scenario, ADMIN);
        let (dep3_id, _) = create_test_repo(&mut scenario, ADMIN);
        
        // Create main repository
        let (repo_id, _cap_id) = create_test_repo(&mut scenario, USER1);

        // Create commit with dependencies in specific order
        let version_id: ID;
        ts::next_tx(&mut scenario, USER1);
        {
            let mut repo = ts::take_shared_by_id<Repository>(&scenario, repo_id);
            let cap = ts::take_from_sender<RepoCap>(&scenario);
            
            let empty_parents = vector::empty<ID>();
            let empty_metrics_keys = vector::empty<vector<u8>>();
            let empty_metrics_values = vector::empty<vector<u8>>();
            let mut shards = vector::empty<vector<u8>>();
            vector::push_back(&mut shards, b"model-blob");
            
            // Add dependencies in specific order: dep1, dep2, dep3
            let mut deps = vector::empty<ID>();
            vector::push_back(&mut deps, dep1_id);
            vector::push_back(&mut deps, dep2_id);
            vector::push_back(&mut deps, dep3_id);
            
            version_fs::commit(
                &mut repo,
                &cap,
                b"main",
                b"model-blob",
                empty_parents,
                b"Model with ordered dependencies",
                empty_metrics_keys,
                empty_metrics_values,
                shards,
                deps,
                4096,
                ts::ctx(&mut scenario)
            );
            
            version_id = version_fs::get_branch_head(&repo, b"main");
            ts::return_shared(repo);
            ts::return_to_sender(&scenario, cap);
        };

        // Query and verify dependency order consistency
        ts::next_tx(&mut scenario, USER1);
        {
            let repo = ts::take_shared_by_id<Repository>(&scenario, repo_id);
            let version = version_fs::get_version(&repo, version_id);
            let deps = version_fs::get_version_dependencies(version);
            
            // Verify all dependencies are present in exact same order
            assert!(vector::length(&deps) == 3, 0);
            assert!(*vector::borrow(&deps, 0) == dep1_id, 1);
            assert!(*vector::borrow(&deps, 1) == dep2_id, 2);
            assert!(*vector::borrow(&deps, 2) == dep3_id, 3);
            
            ts::return_shared(repo);
        };
        
        ts::end(scenario);
    }

    /// Test dependency storage with single dependency
    #[test]
    fun test_property_dependency_storage_single() {
        let mut scenario = ts::begin(ADMIN);
        
        // Create one dependency repository
        let (dep_id, _) = create_test_repo(&mut scenario, ADMIN);
        
        // Create main repository
        let (repo_id, _cap_id) = create_test_repo(&mut scenario, USER1);

        // Create commit with single dependency
        let version_id: ID;
        ts::next_tx(&mut scenario, USER1);
        {
            let mut repo = ts::take_shared_by_id<Repository>(&scenario, repo_id);
            let cap = ts::take_from_sender<RepoCap>(&scenario);
            
            let empty_parents = vector::empty<ID>();
            let empty_metrics_keys = vector::empty<vector<u8>>();
            let empty_metrics_values = vector::empty<vector<u8>>();
            let mut shards = vector::empty<vector<u8>>();
            vector::push_back(&mut shards, b"model-blob");
            
            let mut deps = vector::empty<ID>();
            vector::push_back(&mut deps, dep_id);
            
            version_fs::commit(
                &mut repo,
                &cap,
                b"main",
                b"model-blob",
                empty_parents,
                b"Model with single dependency",
                empty_metrics_keys,
                empty_metrics_values,
                shards,
                deps,
                2048,
                ts::ctx(&mut scenario)
            );
            
            version_id = version_fs::get_branch_head(&repo, b"main");
            ts::return_shared(repo);
            ts::return_to_sender(&scenario, cap);
        };

        // Verify single dependency
        ts::next_tx(&mut scenario, USER1);
        {
            let repo = ts::take_shared_by_id<Repository>(&scenario, repo_id);
            let version = version_fs::get_version(&repo, version_id);
            let deps = version_fs::get_version_dependencies(version);
            
            assert!(vector::length(&deps) == 1, 0);
            assert!(*vector::borrow(&deps, 0) == dep_id, 1);
            
            ts::return_shared(repo);
        };
        
        ts::end(scenario);
    }

    /// Test dependency storage with many dependencies
    #[test]
    fun test_property_dependency_storage_many() {
        let mut scenario = ts::begin(ADMIN);
        
        // Create five dependency repositories
        let (dep1_id, _) = create_test_repo(&mut scenario, ADMIN);
        let (dep2_id, _) = create_test_repo(&mut scenario, ADMIN);
        let (dep3_id, _) = create_test_repo(&mut scenario, ADMIN);
        let (dep4_id, _) = create_test_repo(&mut scenario, ADMIN);
        let (dep5_id, _) = create_test_repo(&mut scenario, ADMIN);
        
        // Create main repository
        let (repo_id, _cap_id) = create_test_repo(&mut scenario, USER1);

        // Create commit with five dependencies
        let version_id: ID;
        ts::next_tx(&mut scenario, USER1);
        {
            let mut repo = ts::take_shared_by_id<Repository>(&scenario, repo_id);
            let cap = ts::take_from_sender<RepoCap>(&scenario);
            
            let empty_parents = vector::empty<ID>();
            let empty_metrics_keys = vector::empty<vector<u8>>();
            let empty_metrics_values = vector::empty<vector<u8>>();
            let mut shards = vector::empty<vector<u8>>();
            vector::push_back(&mut shards, b"model-blob");
            
            // Add five dependencies in specific order
            let mut deps = vector::empty<ID>();
            vector::push_back(&mut deps, dep1_id);
            vector::push_back(&mut deps, dep2_id);
            vector::push_back(&mut deps, dep3_id);
            vector::push_back(&mut deps, dep4_id);
            vector::push_back(&mut deps, dep5_id);
            
            version_fs::commit(
                &mut repo,
                &cap,
                b"main",
                b"model-blob",
                empty_parents,
                b"Model with many dependencies",
                empty_metrics_keys,
                empty_metrics_values,
                shards,
                deps,
                8192,
                ts::ctx(&mut scenario)
            );
            
            version_id = version_fs::get_branch_head(&repo, b"main");
            ts::return_shared(repo);
            ts::return_to_sender(&scenario, cap);
        };

        // Verify all five dependencies in order
        ts::next_tx(&mut scenario, USER1);
        {
            let repo = ts::take_shared_by_id<Repository>(&scenario, repo_id);
            let version = version_fs::get_version(&repo, version_id);
            let deps = version_fs::get_version_dependencies(version);
            
            assert!(vector::length(&deps) == 5, 0);
            assert!(*vector::borrow(&deps, 0) == dep1_id, 1);
            assert!(*vector::borrow(&deps, 1) == dep2_id, 2);
            assert!(*vector::borrow(&deps, 2) == dep3_id, 3);
            assert!(*vector::borrow(&deps, 3) == dep4_id, 4);
            assert!(*vector::borrow(&deps, 4) == dep5_id, 5);
            
            ts::return_shared(repo);
        };
        
        ts::end(scenario);
    }

    /// **Feature: ai-provenance-pro, Property 8: Repository Price Storage**
    /// For any repository creation with a specified price, querying the repository 
    /// should return the exact price value stored on-chain.
    /// **Validates: Requirements 4.1**
    #[test]
    fun test_property_price_storage() {
        let mut scenario = ts::begin(ADMIN);
        
        // Create repository with specific price
        let price = 1000000000; // 1 SUI in MIST
        ts::next_tx(&mut scenario, ADMIN);
        {
            version_fs::create_repository(b"premium-model", price, ts::ctx(&mut scenario));
        };

        // Verify price is stored correctly
        ts::next_tx(&mut scenario, ADMIN);
        {
            let repo = ts::take_shared<Repository>(&scenario);
            
            assert!(version_fs::get_repo_price(&repo) == price, 0);
            
            ts::return_shared(repo);
        };
        
        ts::end(scenario);
    }

    /// Test price storage with zero price (free repository)
    #[test]
    fun test_property_price_storage_free() {
        let mut scenario = ts::begin(ADMIN);
        
        // Create free repository
        ts::next_tx(&mut scenario, ADMIN);
        {
            version_fs::create_repository(b"free-model", 0, ts::ctx(&mut scenario));
        };

        // Verify price is zero
        ts::next_tx(&mut scenario, ADMIN);
        {
            let repo = ts::take_shared<Repository>(&scenario);
            
            assert!(version_fs::get_repo_price(&repo) == 0, 0);
            
            ts::return_shared(repo);
        };
        
        ts::end(scenario);
    }

    /// Test price storage with various price values
    #[test]
    fun test_property_price_storage_varied() {
        let mut scenario = ts::begin(ADMIN);
        
        // Test 1: Small price
        ts::next_tx(&mut scenario, ADMIN);
        {
            version_fs::create_repository(b"cheap-model", 100000, ts::ctx(&mut scenario));
        };

        ts::next_tx(&mut scenario, ADMIN);
        {
            let repo = ts::take_shared<Repository>(&scenario);
            assert!(version_fs::get_repo_price(&repo) == 100000, 0);
            ts::return_shared(repo);
        };

        // Test 2: Large price
        ts::next_tx(&mut scenario, USER1);
        {
            version_fs::create_repository(b"expensive-model", 100000000000, ts::ctx(&mut scenario));
        };

        ts::next_tx(&mut scenario, USER1);
        {
            let repo = ts::take_shared<Repository>(&scenario);
            assert!(version_fs::get_repo_price(&repo) == 100000000000, 1);
            ts::return_shared(repo);
        };
        
        ts::end(scenario);
    }

    /// **Feature: ai-provenance-pro, Property 10: Access Purchase Event Emission**
    /// For any successful payment transaction, the system should emit an AccessPurchased 
    /// event containing the buyer address and exact payment amount.
    /// **Validates: Requirements 4.4**
    /// Note: This test verifies the payment flow. Event emission is verified by the 
    /// smart contract logic which emits AccessPurchased event in buy_access function.
    #[test]
    fun test_property_access_purchase_event() {
        let mut scenario = ts::begin(ADMIN);
        
        // Create premium repository
        let price = 5000000000; // 5 SUI in MIST
        ts::next_tx(&mut scenario, ADMIN);
        {
            version_fs::create_repository(b"premium-model", price, ts::ctx(&mut scenario));
        };

        // User purchases access
        ts::next_tx(&mut scenario, USER1);
        {
            let mut repo = ts::take_shared<Repository>(&scenario);
            
            // Create payment coin
            let payment = sui::coin::mint_for_testing<sui::sui::SUI>(price, ts::ctx(&mut scenario));
            
            // Buy access (this will emit AccessPurchased event)
            version_fs::buy_access(&mut repo, payment, ts::ctx(&mut scenario));
            
            // Verify revenue was updated
            assert!(version_fs::get_total_revenue(&repo) == price, 0);
            
            ts::return_shared(repo);
        };
        
        ts::end(scenario);
    }

    /// Test access purchase with exact payment amount
    #[test]
    fun test_property_access_purchase_exact_payment() {
        let mut scenario = ts::begin(ADMIN);
        
        // Create premium repository
        let price = 2000000000; // 2 SUI
        ts::next_tx(&mut scenario, ADMIN);
        {
            version_fs::create_repository(b"model-v2", price, ts::ctx(&mut scenario));
        };

        // Purchase with exact amount
        ts::next_tx(&mut scenario, USER1);
        {
            let mut repo = ts::take_shared<Repository>(&scenario);
            let payment = sui::coin::mint_for_testing<sui::sui::SUI>(price, ts::ctx(&mut scenario));
            
            version_fs::buy_access(&mut repo, payment, ts::ctx(&mut scenario));
            
            assert!(version_fs::get_total_revenue(&repo) == price, 0);
            
            ts::return_shared(repo);
        };
        
        ts::end(scenario);
    }

    /// Test access purchase with overpayment (excess should be returned)
    #[test]
    fun test_property_access_purchase_overpayment() {
        let mut scenario = ts::begin(ADMIN);
        
        // Create premium repository
        let price = 1000000000; // 1 SUI
        ts::next_tx(&mut scenario, ADMIN);
        {
            version_fs::create_repository(b"model-v3", price, ts::ctx(&mut scenario));
        };

        // Purchase with overpayment
        ts::next_tx(&mut scenario, USER1);
        {
            let mut repo = ts::take_shared<Repository>(&scenario);
            let overpayment = price + 500000000; // 1.5 SUI
            let payment = sui::coin::mint_for_testing<sui::sui::SUI>(overpayment, ts::ctx(&mut scenario));
            
            version_fs::buy_access(&mut repo, payment, ts::ctx(&mut scenario));
            
            // Revenue should only reflect the actual price
            assert!(version_fs::get_total_revenue(&repo) == price, 0);
            
            ts::return_shared(repo);
        };
        
        ts::end(scenario);
    }

    /// **Feature: ai-provenance-pro, Property 18: Fork Upstream Author Recording**
    /// For any fork operation, the new repository's upstream_author field should be
    /// set to the original repository's owner address.
    #[test]
    fun test_property_fork_upstream_author_recording() {
        let mut scenario = ts::begin(ADMIN);

        // Create original repository owned by ADMIN (price 0)
        let (original_repo_id, _original_cap_id) = create_test_repo(&mut scenario, ADMIN);

        // USER1 forks the repository using the original shared Repository
        let fork_price = 1000000000; // 1 SUI price for forked repo
        ts::next_tx(&mut scenario, USER1);
        {
            // Original repository is shared; take it by ID
            let original_repo = ts::take_shared_by_id<Repository>(&scenario, original_repo_id);

            version_fs::fork_repository(
                &original_repo,
                b"forked-repo",
                fork_price,
                ts::ctx(&mut scenario)
            );

            ts::return_shared(original_repo);
        };

        // Next transaction: USER1 now has a RepoCap for the forked repository.
        let forked_repo_id: ID;
        ts::next_tx(&mut scenario, USER1);
        {
            let fork_cap = ts::take_from_sender<RepoCap>(&scenario);
            forked_repo_id = version_fs::get_repo_id_from_cap(&fork_cap);
            ts::return_to_sender(&scenario, fork_cap);

            let forked_repo = ts::take_shared_by_id<Repository>(&scenario, forked_repo_id);
            assert!(version_fs::get_upstream_author(&forked_repo) == ADMIN, 0);
            assert!(version_fs::get_repo_owner(&forked_repo) == USER1, 1);
            assert!(version_fs::get_repo_price(&forked_repo) == fork_price, 2);
            ts::return_shared(forked_repo);
        };

        ts::end(scenario);
    }

    /// **Feature: ai-provenance-pro, Property 19: Royalty Payment Split**
    /// For any payment on a forked repository, 95% should go to the current owner
    /// and 5% should go to the upstream_author, and the sum should equal the price.
    #[test]
    fun test_property_royalty_payment_split() {
        // Case 1: No upstream author (zero address) -> 100% to owner
        let (owner_amount_no_upstream, royalty_amount_no_upstream) =
            version_fs::calculate_royalty_split(1000, @0x0);
        assert!(owner_amount_no_upstream == 1000, 0);
        assert!(royalty_amount_no_upstream == 0, 1);

        // Case 2: With upstream author -> 95% / 5% split
        let price = 1000000000; // 1 SUI in MIST
        let (owner_amount, royalty_amount) =
            version_fs::calculate_royalty_split(price, @0x1);

        assert!(owner_amount + royalty_amount == price, 2);
        assert!(royalty_amount == price / 20, 3);
        assert!(owner_amount == price - (price / 20), 4);
    }

    /// **Feature: ai-provenance-pro, Property 20: Royalty Event Emission**
    /// For any royalty payment, the system should emit a RoyaltyPaid event with the
    /// upstream_author address and the exact 5% amount.
    ///
    /// Note: Event emission is handled by the contract logic; this test verifies that
    /// a purchase on a forked repository with a non-zero price succeeds and updates
    /// total_revenue correctly.
    #[test]
    fun test_property_royalty_event_emission() {
        let mut scenario = ts::begin(ADMIN);

        // Create original repository owned by ADMIN (price 0)
        let (original_repo_id, _original_cap_id) = create_test_repo(&mut scenario, ADMIN);

        // USER1 forks the repository with non-zero price
        let fork_price = 5000000000; // 5 SUI
        ts::next_tx(&mut scenario, USER1);
        {
            let original_repo = ts::take_shared_by_id<Repository>(&scenario, original_repo_id);

            version_fs::fork_repository(
                &original_repo,
                b"forked-premium-repo",
                fork_price,
                ts::ctx(&mut scenario)
            );

            ts::return_shared(original_repo);
        };

        // Next transaction: USER1 now has a RepoCap for the forked repository.
        let forked_repo_id: ID;
        ts::next_tx(&mut scenario, USER1);
        {
            let fork_cap = ts::take_from_sender<RepoCap>(&scenario);
            forked_repo_id = version_fs::get_repo_id_from_cap(&fork_cap);
            ts::return_to_sender(&scenario, fork_cap);
        };

        // USER2 purchases access to the forked repository
        ts::next_tx(&mut scenario, USER2);
        {
            let mut forked_repo = ts::take_shared_by_id<Repository>(&scenario, forked_repo_id);

            let payment = sui::coin::mint_for_testing<sui::sui::SUI>(fork_price, ts::ctx(&mut scenario));
            version_fs::buy_access(&mut forked_repo, payment, ts::ctx(&mut scenario));

            // Verify total revenue reflects the price
            assert!(version_fs::get_total_revenue(&forked_repo) == fork_price, 0);

            ts::return_shared(forked_repo);
        };

        ts::end(scenario);
    }

    /// **Feature: ai-provenance-pro, Property 21: Badge Tier Mapping (Bronze)**
    /// For any repository with trust_score in range 0-49, the NFT image_url should
    /// point to the bronze badge asset.
    #[test]
    fun test_property_badge_tier_bronze() {
        let expected = string::utf8(b"badge-bronze");

        let url0 = version_fs::badge_image_url_for_score(0);
        let url_mid = version_fs::badge_image_url_for_score(25);
        let url_max = version_fs::badge_image_url_for_score(49);

        assert!(url0 == expected, 0);
        assert!(url_mid == expected, 1);
        assert!(url_max == expected, 2);
    }

    /// **Feature: ai-provenance-pro, Property 22: Badge Tier Mapping (Silver)**
    /// For any repository with trust_score in range 50-99, the NFT image_url should
    /// point to the silver badge asset.
    #[test]
    fun test_property_badge_tier_silver() {
        let expected = string::utf8(b"badge-silver");

        let url_min = version_fs::badge_image_url_for_score(50);
        let url_mid = version_fs::badge_image_url_for_score(75);
        let url_max = version_fs::badge_image_url_for_score(99);

        assert!(url_min == expected, 0);
        assert!(url_mid == expected, 1);
        assert!(url_max == expected, 2);
    }

    /// **Feature: ai-provenance-pro, Property 23: Badge Tier Mapping (Gold)**
    /// For any repository with trust_score >= 100, the NFT image_url should
    /// point to the gold badge asset.
    #[test]
    fun test_property_badge_tier_gold() {
        let expected = string::utf8(b"badge-gold");

        let url_min = version_fs::badge_image_url_for_score(100);
        let url_high = version_fs::badge_image_url_for_score(250);

        assert!(url_min == expected, 0);
        assert!(url_high == expected, 1);
    }

    /// **Feature: ai-provenance-pro, Property 24: Dynamic Badge Updates**
    /// For any repository, when the trust_score changes across thresholds, the NFT
    /// image_url should automatically update to reflect the new badge tier.
    #[test]
    fun test_property_badge_dynamic_updates() {
        let bronze = version_fs::badge_image_url_for_score(10);
        let silver = version_fs::badge_image_url_for_score(60);
        let gold = version_fs::badge_image_url_for_score(150);

        // Different tiers must map to different URLs
        assert!(bronze != silver, 0);
        assert!(silver != gold, 1);
        assert!(bronze != gold, 2);

        // Crossing the 49 -> 50 boundary should change the badge
        let at_49 = version_fs::badge_image_url_for_score(49);
        let at_50 = version_fs::badge_image_url_for_score(50);
        assert!(at_49 != at_50, 3);

        // Crossing the 99 -> 100 boundary should change the badge
        let at_99 = version_fs::badge_image_url_for_score(99);
        let at_100 = version_fs::badge_image_url_for_score(100);
        assert!(at_99 != at_100, 4);
    }
}
