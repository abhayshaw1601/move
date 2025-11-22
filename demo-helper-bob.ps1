# Helper script for Bob's wallet (second wallet) operations
# This demonstrates forking and purchasing with royalty split

param(
    [Parameter(Mandatory=$true)]
    [string]$OriginalRepoId,
    
    [Parameter(Mandatory=$true)]
    [string]$BobPrivateKey,
    
    [string]$PackageId = ""
)

# Set Bob's private key
$env:SUI_PRIVATE_KEY = $BobPrivateKey

# Get package ID if not provided
if (-not $PackageId) {
    if (Test-Path "deployment-info.json") {
        $deploymentInfo = Get-Content "deployment-info.json" | ConvertFrom-Json
        $PackageId = $deploymentInfo.packageId
    } else {
        Write-Host "ERROR: PACKAGE_ID not provided and deployment-info.json not found!" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║              BOB'S WALLET - FORK & PURCHASE DEMO                    ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Step 1: Fork the repository
Write-Host "🔱 STEP 1: Forking Repository" -ForegroundColor Yellow
Write-Host "   Original Repo: $OriginalRepoId" -ForegroundColor Gray
Write-Host ""

$forkOutput = npm run cli -- fork --from $OriginalRepoId --name "BobsForkedModel" --price 1000000000 2>&1 | Out-String
Write-Host $forkOutput

# Extract forked repository ID
$forkedRepoId = ""
if ($forkOutput -match "Repository ID:\s*([a-fA-F0-9x]+)") {
    $forkedRepoId = $matches[1].Trim()
} elseif ($forkOutput -match "([0-9a-f]{64})") {
    $allMatches = [regex]::Matches($forkOutput, "([0-9a-f]{64})")
    if ($allMatches.Count -ge 1) {
        $forkedRepoId = $allMatches[0].Value
    }
}

if (-not $forkedRepoId) {
    Write-Host "⚠️  Could not extract forked repository ID. Please enter manually:" -ForegroundColor Yellow
    $forkedRepoId = Read-Host
}

Write-Host ""
Write-Host "✅ Forked Repository ID: $forkedRepoId" -ForegroundColor Green
Write-Host ""

Start-Sleep -Seconds 3

# Step 2: Show certificate (to see upstream_author)
Write-Host "📜 STEP 2: Showing Certificate (Notice upstream_author field)" -ForegroundColor Yellow
Write-Host ""

$certOutput = npm run cli -- certificate --repo $forkedRepoId 2>&1 | Out-String
Write-Host $certOutput

Write-Host ""
Write-Host "💡 Notice: upstream_author is locked to the original creator" -ForegroundColor Cyan
Write-Host "   All sales will automatically route 5`% royalties back" -ForegroundColor Cyan
Write-Host ""

Start-Sleep -Seconds 2

# Step 3: Purchase access (demonstrates royalty split)
Write-Host "💳 STEP 3: Purchasing Access (Demonstrates calculate_royalty_split)" -ForegroundColor Yellow
Write-Host "   Price: 1 SUI (1,000,000,000 MIST)" -ForegroundColor Gray
Write-Host "   Expected: 95`% to Bob, 5`% to original author" -ForegroundColor Gray
Write-Host ""

$buyOutput = npm run cli -- pull --repo $forkedRepoId --output ./downloaded-model 2>&1 | Out-String
Write-Host $buyOutput

Write-Host ""
Write-Host "✅ Purchase Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Royalty Split Breakdown:" -ForegroundColor Cyan
Write-Host "   • calculate_royalty_split function automatically:" -ForegroundColor White
Write-Host "     - 95`% (950,000,000 MIST) → Bob (current owner)" -ForegroundColor Green
Write-Host "     - 5`% (50,000,000 MIST) → Original author (upstream_author)" -ForegroundColor Yellow
Write-Host ""
Write-Host "   This is on-chain, immutable, and automatic." -ForegroundColor Gray
Write-Host ""

