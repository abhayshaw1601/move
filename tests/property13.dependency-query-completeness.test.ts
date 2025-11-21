// Feature: ai-provenance-pro, Property 13: Dependency Query Completeness

import fc from "fast-check";
import { getAllRepositories, DependencyNode, RepositoryDetails } from "../src/inspect";

// Property 13: For any dependency graph, querying all repositories should
// return every repository ID that appears in the graph, with no duplicates.

describe("Property 13: Dependency Query Completeness", () => {
  it("returns all unique repository IDs from manually constructed graphs", () => {
    fc.assert(
      fc.property(
        fc.array(fc.hexaString({ minLength: 8, maxLength: 16 }), { minLength: 1, maxLength: 5 }),
        (repoIds) => {
          // Create a simple linear dependency chain
          const nodes: DependencyNode[] = [];
          
          for (let i = 0; i < repoIds.length; i++) {
            const repo: RepositoryDetails = {
              id: repoIds[i],
              name: `repo-${i}`,
              owner: "0xowner",
              trustScore: 50,
              price: 0n,
              dependencies: i < repoIds.length - 1 ? [repoIds[i + 1]] : []
            };
            
            const node: DependencyNode = {
              repository: repo,
              dependencies: i < repoIds.length - 1 ? [] : [], // Will be filled later
              depth: i
            };
            
            nodes.push(node);
          }
          
          // Link the nodes
          for (let i = 0; i < nodes.length - 1; i++) {
            nodes[i].dependencies = [nodes[i + 1]];
          }
          
          const rootNode = nodes[0];
          const allRepos = getAllRepositories(rootNode);
          
          // Should include all repository IDs
          expect(allRepos.length).toBe(repoIds.length);
          
          // Should not have duplicates
          const uniqueRepos = new Set(allRepos);
          expect(allRepos.length).toBe(uniqueRepos.size);
          
          // Should include all expected IDs
          for (const expectedId of repoIds) {
            expect(allRepos).toContain(expectedId);
          }
        }
      )
    );
  });

  it("handles empty dependency graphs correctly", () => {
    const singleRepo: RepositoryDetails = {
      id: "0x123",
      name: "single-repo",
      owner: "0xowner",
      trustScore: 50,
      price: 0n,
      dependencies: []
    };

    const singleNode: DependencyNode = {
      repository: singleRepo,
      dependencies: [],
      depth: 0
    };

    const allRepos = getAllRepositories(singleNode);
    
    expect(allRepos).toHaveLength(1);
    expect(allRepos[0]).toBe("0x123");
  });

  it("handles deep dependency chains correctly", () => {
    // Create a chain: A -> B -> C
    const repoC: DependencyNode = {
      repository: {
        id: "0xC",
        name: "repo-c",
        owner: "0xowner",
        trustScore: 30,
        price: 0n,
        dependencies: []
      },
      dependencies: [],
      depth: 2
    };

    const repoB: DependencyNode = {
      repository: {
        id: "0xB",
        name: "repo-b",
        owner: "0xowner",
        trustScore: 60,
        price: 1000000000n,
        dependencies: ["0xC"]
      },
      dependencies: [repoC],
      depth: 1
    };

    const repoA: DependencyNode = {
      repository: {
        id: "0xA",
        name: "repo-a",
        owner: "0xowner",
        trustScore: 90,
        price: 2000000000n,
        dependencies: ["0xB"]
      },
      dependencies: [repoB],
      depth: 0
    };

    const allRepos = getAllRepositories(repoA);
    
    expect(allRepos).toHaveLength(3);
    expect(allRepos).toContain("0xA");
    expect(allRepos).toContain("0xB");
    expect(allRepos).toContain("0xC");
  });
});

// Helper function to collect all repository IDs from a dependency tree
function collectAllRepoIds(node: DependencyNode, visited: Set<string> = new Set()): Set<string> {
  if (visited.has(node.repository.id)) {
    return visited; // Prevent infinite loops in case of cycles
  }
  
  visited.add(node.repository.id);
  
  for (const dep of node.dependencies) {
    collectAllRepoIds(dep, visited);
  }
  
  return visited;
}