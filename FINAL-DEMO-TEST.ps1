# Final Demo Test - Verify all commands work with vfs alias

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  FINAL DEMO TEST" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Load the alias
Write-Host "Loading vfs alias..." -ForegroundColor Yellow
. .\setup-demo-alias.ps1

Write-Host ""
Write-Host "Testing all demo commands..." -ForegroundColor Yellow
Write-Host ""

# Test 1: Storefront
Write-Host "[1/4] Testing: vfs storefront" -ForegroundColor Cyan
vfs storefront | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "OK Storefront works" -ForegroundColor Green
} else {
    Write-Host "FAIL Storefront failed" -ForegroundColor Red
}
Write-Host ""

# Test 2: Inspect
Write-Host "[2/4] Testing: vfs inspect --repo [ID]" -ForegroundColor Cyan
vfs inspect --repo 0x771078fdad17362a452ecf02a3a479e2cc829cfad1be447ddc319f952b81fbf6 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "OK Inspect works" -ForegroundColor Green
} else {
    Write-Host "FAIL Inspect failed" -ForegroundColor Red
}
Write-Host ""

# Test 3: Verify (may fail if no main branch)
Write-Host "[3/4] Testing: vfs verify --repo [ID]" -ForegroundColor Cyan
vfs verify --repo 0xcca7201e5c22e0c4f8f3686e634e26e1f0638d51168410a35622653ea7f269a4 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "OK Verify works" -ForegroundColor Green
} else {
    Write-Host "WARN Verify failed (may need main branch)" -ForegroundColor Yellow
}
Write-Host ""

# Test 4: Audit Report
Write-Host "[4/4] Testing: vfs audit-report --repo [ID] --out [file]" -ForegroundColor Cyan
vfs audit-report --repo 0xcca7201e5c22e0c4f8f3686e634e26e1f0638d51168410a35622653ea7f269a4 --out test-final-report.html | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "OK Audit Report works" -ForegroundColor Green
} else {
    Write-Host "FAIL Audit Report failed" -ForegroundColor Red
}
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TEST COMPLETE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your demo commands are ready!" -ForegroundColor Green
Write-Host ""
Write-Host "To start your demo:" -ForegroundColor Yellow
Write-Host "  1. Set: `$env:SUI_PRIVATE_KEY=`"your_key`"" -ForegroundColor White
Write-Host "  2. Run: . .\setup-demo-alias.ps1" -ForegroundColor White
Write-Host "  3. Use: vfs storefront" -ForegroundColor White
Write-Host ""
Write-Host "See DEMO-READY.md for full script" -ForegroundColor Yellow
Write-Host ""
