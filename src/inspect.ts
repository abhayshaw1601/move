import { SuiClient } from "@mysten/sui/client";

export interface RepositoryDetails {
  id: string;
  name: string;
  owner: string;
  trustScore: number;
  price: bigint;
  dependencies: string[];
}

export interface DependencyNode {
  repository: RepositoryDetails;
  dependencies: DependencyNode[];
  depth: number;
}

export interface InspectOptions {
  repoId: string;
  client: SuiClient;
  maxDepth?: number;
}

export async function queryRepositoryDetails(
  client: SuiClient,
  repoId: string
): Promise<RepositoryDetails> {
  try {
    // Query repository object from Sui
    const repoObject = await client.getObject({
      id: repoId,
      options: { showContent: true }
    });

    if (!repoObject.data?.content || repoObject.data.content.dataType !== "moveObject") {
      throw new Error(`Repository ${repoId} not found or invalid`);
    }

    const fields = (repoObject.data.content as any).fields;
    
    // Get the latest version to find dependencies
    const branches = fields.branches || {};
    const mainBranchHead = branches.main;
    let dependencies: string[] = [];

    if (mainBranchHead) {
      try {
        const versionObject = await client.getObject({
          id: mainBranchHead,
          options: { showContent: true }
        });

        if (versionObject.data?.content && versionObject.data.content.dataType === "moveObject") {
          const versionFields = (versionObject.data.content as any).fields;
          dependencies = versionFields.dependencies || [];
        }
      } catch (error) {
        // If we can't get version details, continue with empty dependencies
        console.warn(`Warning: Could not fetch dependencies for ${repoId}`);
      }
    }

    return {
      id: repoId,
      name: fields.name || "unknown",
      owner: fields.owner || "0x0",
      trustScore: parseInt(fields.trust_score || "0"),
      price: BigInt(fields.price || "0"),
      dependencies
    };
  } catch (error) {
    throw new Error(`Failed to query repository ${repoId}: ${error}`);
  }
}

export async function buildDependencyGraph(
  client: SuiClient,
  rootRepoId: string,
  maxDepth: number = 5,
  visited: Set<string> = new Set(),
  currentDepth: number = 0
): Promise<DependencyNode> {
  // Prevent infinite recursion and cycles
  if (currentDepth >= maxDepth || visited.has(rootRepoId)) {
    const stubRepo: RepositoryDetails = {
      id: rootRepoId,
      name: visited.has(rootRepoId) ? "[CIRCULAR]" : "[MAX_DEPTH]",
      owner: "0x0",
      trustScore: 0,
      price: 0n,
      dependencies: []
    };
    return {
      repository: stubRepo,
      dependencies: [],
      depth: currentDepth
    };
  }

  visited.add(rootRepoId);

  try {
    const repoDetails = await queryRepositoryDetails(client, rootRepoId);
    const dependencyNodes: DependencyNode[] = [];

    // Recursively build dependency nodes
    for (const depId of repoDetails.dependencies) {
      const depNode = await buildDependencyGraph(
        client,
        depId,
        maxDepth,
        new Set(visited), // Create new set to avoid affecting sibling branches
        currentDepth + 1
      );
      dependencyNodes.push(depNode);
    }

    return {
      repository: repoDetails,
      dependencies: dependencyNodes,
      depth: currentDepth
    };
  } catch (error) {
    // If we can't fetch a repository, create a stub node
    const errorRepo: RepositoryDetails = {
      id: rootRepoId,
      name: "[ERROR]",
      owner: "0x0",
      trustScore: 0,
      price: 0n,
      dependencies: []
    };
    return {
      repository: errorRepo,
      dependencies: [],
      depth: currentDepth
    };
  }
}

export function formatPrice(price: bigint): string {
  if (price === 0n) return "FREE";
  const sui = Number(price) / 1_000_000_000;
  return `${sui.toFixed(2)} SUI`;
}

export function formatTrustScore(score: number): string {
  const green = "\x1b[32m";
  const yellow = "\x1b[33m";
  const red = "\x1b[31m";
  const reset = "\x1b[0m";
  
  if (score >= 100) return `${green}${score}${reset}`;
  if (score >= 50) return `${yellow}${score}${reset}`;
  return `${red}${score}${reset}`;
}

export function renderDependencyTree(node: DependencyNode, prefix: string = "", isLast: boolean = true): string {
  const lines: string[] = [];
  const repo = node.repository;
  
  // Current node
  const connector = isLast ? "└── " : "├── ";
  const repoLine = `${prefix}${connector}📦 ${repo.name} (${repo.id.substring(0, 8)}...)`;
  lines.push(repoLine);
  
  // Repository details
  const detailPrefix = prefix + (isLast ? "    " : "│   ");
  lines.push(`${detailPrefix}👤 Owner: ${repo.owner.substring(0, 8)}...`);
  lines.push(`${detailPrefix}⭐ Trust: ${formatTrustScore(repo.trustScore)}`);
  lines.push(`${detailPrefix}💰 Price: ${formatPrice(repo.price)}`);
  
  if (repo.dependencies.length > 0) {
    lines.push(`${detailPrefix}🔗 Dependencies: ${repo.dependencies.length}`);
  }

  // Render dependencies
  const childPrefix = prefix + (isLast ? "    " : "│   ");
  for (let i = 0; i < node.dependencies.length; i++) {
    const isLastChild = i === node.dependencies.length - 1;
    const childTree = renderDependencyTree(node.dependencies[i], childPrefix, isLastChild);
    lines.push(childTree);
  }

  return lines.join("\n");
}

export function getAllRepositories(node: DependencyNode, repos: Set<string> = new Set()): string[] {
  repos.add(node.repository.id);
  
  for (const dep of node.dependencies) {
    getAllRepositories(dep, repos);
  }
  
  return Array.from(repos);
}

export async function inspectRepository(options: InspectOptions): Promise<void> {
  const { repoId, client, maxDepth = 5 } = options;

  // Import UI functions
  const { 
    printBanner, 
    startSpinner, 
    printDependencyHeader, 
    printRepoStats,
    printCommandComplete 
  } = await import("./utils/ui");

  printBanner();

  const spinner = startSpinner("🔍 Scanning Neural Network Topology...");
  
  try {
    await new Promise(resolve => setTimeout(resolve, 1500));
    const dependencyGraph = await buildDependencyGraph(client, repoId, maxDepth);
    spinner.succeed("🧬 Neural Topology Mapped");
    
    printDependencyHeader();
    console.log(renderDependencyTree(dependencyGraph));
    
    const allRepos = getAllRepositories(dependencyGraph);
    const stats = {
      totalRepos: allRepos.length,
      maxDepth: getMaxDepth(dependencyGraph),
      rootRepo: dependencyGraph.repository.name
    };
    
    printRepoStats(stats);
    printCommandComplete("NEURAL TOPOLOGY ANALYSIS");
    
  } catch (error) {
    spinner.fail("❌ Neural Matrix Connection Failed");
    throw error;
  }
}

function getMaxDepth(node: DependencyNode): number {
  if (node.dependencies.length === 0) {
    return node.depth;
  }
  
  return Math.max(...node.dependencies.map(dep => getMaxDepth(dep)));
}