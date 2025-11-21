# AI Provenance Platform - 3 Minute Demo
# Run with: .\quick-demo.ps1

$REPO1 = "0xcca7201e5c22e0c4f8f3686e634e26e1f0638d51168410a35622653ea7f269a4"  # 4 versions
$REPO2 = "0x3d7c9a69ad9b5b332e219033921338c98424f2a436e7f0e6ecb385ab9928cb04"  # Gold badge
$REPO3 = "0x61a165112fd23b2ec40e0330c78f0229d466b996a97a210b016b8f91ee728c37"  # Premium

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  AI PROVENANCE PLATFORM - QUICK DEMO" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# 1. Marketplace
Write-Host "[1/5] Showing Marketplace..." -ForegroundColor Yellow
npm run cli -- storefront
Write-Host "`nPress any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# 2. Inspect
Write-Host "`n[2/5] Inspecting Repository (4 versions, 18 shards)..." -ForegroundColor Yellow
npm run cli -- inspect --repo $REPO1
Write-Host "`nPress any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# 3. Log
Write-Host "`n[3/5] Viewing Commit History..." -ForegroundColor Yellow
npm run cli -- log
Write-Host "`nPress any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# 4. Audit Report
Write-Host "`n[4/5] Generating Audit Report with Charts..." -ForegroundColor Yellow
npm run cli -- audit-report --repo $REPO1 --out ./demo-report.html
Write-Host "`nOpening report in browser..." -ForegroundColor Green
Start-Process "demo-report.html"
Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# 5. Gold Badge
Write-Host "`n[5/5] Showing Gold Badge Repository (100 verifications)..." -ForegroundColor Yellow
npm run cli -- audit-report --repo $REPO2 --out ./gold-badge-demo.html
Write-Host "`nOpening Gold badge report..." -ForegroundColor Green
Start-Process "gold-badge-demo.html"

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  DEMO COMPLETE!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

Write-Host "Key Features Demonstrated:" -ForegroundColor Cyan
Write-Host "  - Blockchain marketplace" -ForegroundColor White
Write-Host "  - Version tracking (4 versions)" -ForegroundColor White
Write-Host "  - Shard management (18 shards, 9.6 GB)" -ForegroundColor White
Write-Host "  - Trust score system (Gold badge)" -ForegroundColor White
Write-Host "  - Interactive audit reports" -ForegroundColor White
Write-Host "  - Performance charts" -ForegroundColor White

Write-Host "`nBlockchain Explorer Links:" -ForegroundColor Cyan
Write-Host "  Repo 1: https://suiscan.xyz/testnet/object/$REPO1" -ForegroundColor Blue
Write-Host "  Repo 2: https://suiscan.xyz/testnet/object/$REPO2" -ForegroundColor Blue
Write-Host "  Repo 3: https://suiscan.xyz/testnet/object/$REPO3" -ForegroundColor Blue

Write-Host "`nPress any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
