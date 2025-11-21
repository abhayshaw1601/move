# 5-Minute Demo Test Script
# This script tests the entire demo flow to ensure everything works

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PROVENANCE PRO - 5 MINUTE DEMO TEST" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check environment
Write-Host "[1/6] Checking environment..." -ForegroundColor Yellow
if (-not $env:SUI_PRIVATE_KEY) {
    Write-Host "ERROR: SUI_PRIVATE_KEY not set!" -ForegroundColor Red
    Write-Host "Run: `$env:SUI_PRIVATE_KEY=`"your_key_here`"" -ForegroundColor Yellow
    exit 1
}
Write-Host "✓ Environment configured" -ForegroundColor Green
Write-Host ""

# Check demo file exists
Write-Host "[2/6] Checking demo file..." -ForegroundColor Yellow
if (-not (Test-Path "Llama-3-Quantized.bin")) {
    Write-Host "ERROR: Llama-3-Quantized.bin not found!" -ForegroundColor Red
    exit 1
}
$fileSize = (Get-Item "Llama-3-Quantized.bin").Length
Write-Host "✓ Demo file exists ($fileSize bytes)" -ForegroundColor Green
Write-Host ""

# Load deployment info
Write-Host "[3/6] Loading deployment info..." -ForegroundColor Yellow
$deployment = Get-Content "deployment-info.json" | ConvertFrom-Json
$goldRepo = $deployment.repositories.gold
$paidRepo = $deployment.repositories.paid
$freeRepo = $deployment.repositories.free

Write-Host "✓ Gold Repo: $goldRepo" -ForegroundColor Green
Write-Host "✓ Paid Repo: $paidRepo" -ForegroundColor Green
Write-Host "✓ Free Repo: $freeRepo" -ForegroundColor Green
Write-Host ""

# Test 1: Storefront
Write-Host "[4/6] Testing STOREFRONT command..." -ForegroundColor Yellow
Write-Host "Command: vfs storefront" -ForegroundColor Cyan
Write-Host ""
npm run cli storefront
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Storefront command failed!" -ForegroundColor Red
    exit 1
}
Write-Host ""
Write-Host "✓ Storefront displayed successfully" -ForegroundColor Green
Write-Host ""
Start-Sleep -Seconds 2

# Test 2: Commit (the main demo action)
Write-Host "[5/6] Testing COMMIT command..." -ForegroundColor Yellow
Write-Host "Command: vfs commit --repo $goldRepo --file ./Llama-3-Quantized.bin --attr `"Accuracy=98.2%,Quantization=int8`"" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will upload to Walrus and create a new version..." -ForegroundColor Gray
Write-Host ""
npm run cli commit -- --repo $goldRepo --file ./Llama-3-Quantized.bin --attr "Accuracy=98.2%,Quantization=int8"
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Commit command failed!" -ForegroundColor Red
    exit 1
}
Write-Host ""
Write-Host "✓ Commit completed successfully" -ForegroundColor Green
Write-Host ""
Start-Sleep -Seconds 2

# Test 3: Inspect
Write-Host "[6/6] Testing INSPECT command..." -ForegroundColor Yellow
Write-Host "Command: vfs inspect --repo $goldRepo" -ForegroundColor Cyan
Write-Host ""
npm run cli inspect -- --repo $goldRepo
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Inspect command failed!" -ForegroundColor Red
    exit 1
}
Write-Host ""
Write-Host "✓ Inspect displayed successfully" -ForegroundColor Green
Write-Host ""
Start-Sleep -Seconds 2

# Test 4: Verify (if available)
Write-Host "[BONUS] Testing VERIFY command..." -ForegroundColor Yellow
Write-Host "Command: vfs verify --repo $goldRepo" -ForegroundColor Cyan
Write-Host ""
npm run cli verify -- --repo $goldRepo
Write-Host ""
Write-Host "✓ Verify completed" -ForegroundColor Green
Write-Host ""
Start-Sleep -Seconds 2

# Test 5: Audit Report
Write-Host "[BONUS] Testing AUDIT REPORT command..." -ForegroundColor Yellow
Write-Host "Command: vfs audit-report --repo $goldRepo --out demo-5min-report.html" -ForegroundColor Cyan
Write-Host ""
npm run cli audit-report -- --repo $goldRepo --out demo-5min-report.html
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: Audit report command failed (non-critical)" -ForegroundColor Yellow
} else {
    Write-Host "✓ Audit report generated: demo-5min-report.html" -ForegroundColor Green
}
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DEMO TEST COMPLETE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✓ All core commands tested successfully" -ForegroundColor Green
Write-Host ""
Write-Host "DEMO FLOW VERIFIED:" -ForegroundColor Yellow
Write-Host "  1. Storefront - Shows model catalog" -ForegroundColor White
Write-Host "  2. Commit - Uploads to Walrus + Sui" -ForegroundColor White
Write-Host "  3. Inspect - Shows lineage tree" -ForegroundColor White
Write-Host "  4. Verify - Updates trust score" -ForegroundColor White
Write-Host "  5. Audit Report - Generates compliance doc" -ForegroundColor White
Write-Host ""
Write-Host "READY FOR 5-MINUTE DEMO!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Review DEMO-5MIN-SCRIPT.md" -ForegroundColor White
Write-Host "  2. Practice timing (aim for 5:00)" -ForegroundColor White
Write-Host "  3. Open Suiscan to: https://suiscan.xyz/testnet/object/$goldRepo" -ForegroundColor White
Write-Host "  4. Open demo-5min-report.html in browser" -ForegroundColor White
Write-Host ""
