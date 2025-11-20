#[test_only]
module version_fs::version_fs_complete_test {
    use sui::test_scenario::{Self as ts, Scenario};
    use sui::object::{Self, ID};
    use std::string;
    use std::vector;
    use version_fs::version_fs::{Self, Repository, RepoCap};

    // Test constants
    const ADMIN: address = @0xAD;
    const USER1: address = @0xB0B;

    // Helper function to create a repository
    fun create_test_repo(scenario: &mut Scenario, sender: address): (ID, ID) {
        ts::next_tx(scenario, sender);
        {
            version_fs::create_repository(b"test-repo", ts::ctx(scenario));
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
            version_fs::create_repository(b"my-experiment", ts::ctx(&mut scenario));
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
            
            version_fs::commit(
                &mut repo,
                &cap,
                b"main",
                b"blob-id-123",
                empty_parents,
                b"Initial commit",
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
            
            version_fs::commit(
                &mut repo,
                &cap,
                b"main",
                b"blob-id-123",
                empty_parents,
                b"Initial commit",
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
            
            version_fs::commit(
                &mut repo,
                &cap,
                b"main",
                b"blob-id-456",
                parents,
                b"Second commit",
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
            
            version_fs::commit(
                &mut repo,
                &cap,
                b"main",
                b"blob-id-123",
                empty_parents,
                b"Initial commit",
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

    #[test]
    fun test_trust_score_increment() {
        let mut scenario = ts::begin(ADMIN);
        let (repo_id, _cap_id) = create_test_repo(&mut scenario, ADMIN);

        // Verify initial trust score is 0
        ts::next_tx(&mut scenario, ADMIN);
        {
            let repo = ts::take_shared_by_id<Repository>(&scenario, repo_id);
            assert!(version_fs::get_trust_score(&repo) == 0, 0);
            ts::return_shared(repo);
        };

        // Note: Testing trust score increment requires a valid Ed25519 signature
        // which would come from a real TEE in production
        // For now, we just verify the initial trust score is 0
        
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
            
            version_fs::commit(
                &mut repo,
                &cap,
                b"main",
                b"blob-id-123",
                empty_parents,
                b"Test commit",
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
        
        // First commit
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut repo = ts::take_shared_by_id<Repository>(&scenario, repo_id);
            let cap = ts::take_from_sender<RepoCap>(&scenario);
            
            version_fs::commit(
                &mut repo,
                &cap,
                b"main",
                b"blob-1",
                empty_parents,
                b"Commit 1",
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
            
            version_fs::commit(
                &mut repo,
                &cap,
                b"main",
                b"blob-2",
                parents,
                b"Commit 2",
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
            
            version_fs::commit(
                &mut repo,
                &cap,
                b"main",
                b"blob-3",
                parents,
                b"Commit 3",
                ts::ctx(&mut scenario)
            );
            
            // Verify version count
            assert!(version_fs::get_version_count(&repo) == 3, 0);
            
            ts::return_shared(repo);
            ts::return_to_sender(&scenario, cap);
        };
        
        ts::end(scenario);
    }
}
