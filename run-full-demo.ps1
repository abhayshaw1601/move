# Full Demo Run - Complete 5-minute demo simulation
# This runs through the entire demo flow

param(
    [switch]$SkipCommit = $false
)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PROVENANCE PRO - 5 MINUTE DEMO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Repository IDs
$GOLD_REPO = "0xcca7201e5c22e0c4f8f3686e634e26e1f0638d51168410a35622653ea7f269a4"
$FORKED_REPO = "0x771078fdad17362a452ecf02a3a479e2cc829cfad1be447ddc319f952b81fbf6"

Write-Host "Demo Configuration:" -ForegroundColor Yellow
Write-Host "  Gold Repo (with versions): $GOLD_REPO" -ForegroundColor White
Write-Host "  Forked Repo: $FORKED_REPO" -ForegroundColor White
Write-Host ""

# Check environment
if (-not $env:SUI_PRIVATE_KEY) {
    Write-Host "WARNING: SUI_PRIVATE_KEY not set!" -ForegroundColor Red
    Write-Host "Set it with: `$env:SUI_PRIVATE_KEY=`"your_key`"" -ForegroundColor Yellow
    Write-Host ""
}

# Check demo file
if (-not (Test-Path "Llama-3-Quantized.bin")) {
    Write-Host "ERROR: Llama-3-Quantized.bin not found!" -ForegroundColor Red
    exit 1
}

Write-Host "Press Enter to start demo..." -ForegroundColor Yellow
Read-Host

# PART 1: STOREFRONT (0:00-0:45)
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PART 1: STOREFRONT (0:00-0:45)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Command: vfs storefront" -ForegroundColor Yellow
Write-Host ""
Start-Sleep -Seconds 1

npm run cli storefront

Write-Host ""
Write-Host "Press Enter for next part..." -ForegroundColor Yellow
Read-Host

# PART 2: COMMIT (0:45-1:45)
if (-not $SkipCommit) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  PART 2: COMMIT TO WALRUS (0:45-1:45)" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Command: vfs commit --repo $GOLD_REPO --file ./Llama-3-Quantized.bin --attr Accuracy=98.2%,Quantization=int8" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "This will upload to Walrus and create a new version..." -ForegroundColor Gray
    Write-Host ""
    Start-Sleep -Seconds 1

    npm run cli commit -- --repo $GOLD_REPO --file ./Llama-3-Quantized.bin --attr "Accuracy=98.2%,Quantization=int8"

    Write-Host ""
    Write-Host "Press Enter for next part..." -ForegroundColor Yellow
    Read-Host
} else {
    Write-Host ""
    Write-Host "Skipping commit (use -SkipCommit:`$false to include)" -ForegroundColor Yellow
    Write-Host ""
}

# PART 3: INSPECT (1:45-2:45)
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PART 3: INSPECT LINEAGE (1:45-2:45)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Command: vfs inspect --repo $FORKED_REPO" -ForegroundColor Yellow
Write-Host ""
Start-Sleep -Seconds 1

npm run cli inspect -- --repo $FORKED_REPO

Write-Host ""
Write-Host "Press Enter for next part..." -ForegroundColor Yellow
Read-Host

# PART 4: VERIFY (2:45-3:45)
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PART 4: VERIFY WITH TEE (2:45-3:45)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Command: vfs verify --repo $GOLD_REPO" -ForegroundColor Yellow
Write-Host ""
Start-Sleep -Seconds 1

npm run cli verify -- --repo $GOLD_REPO

Write-Host ""
Write-Host "Press Enter for next part..." -ForegroundColor Yellow
Read-Host

# PART 5: AUDIT REPORT (3:45-4:30)
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PART 5: AUDIT REPORT (3:45-4:30)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Command: vfs audit-report --repo $GOLD_REPO --out demo-final-report.html" -ForegroundColor Yellow
Write-Host ""
Start-Sleep -Seconds 1

npm run cli audit-report -- --repo $GOLD_REPO --out demo-final-report.html

Write-Host ""
Write-Host "Report generated: demo-final-report.html" -ForegroundColor Green
Write-Host ""

# PART 6: OUTRO (4:30-5:00)
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PART 6: OUTRO (4:30-5:00)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Now switch to Suiscan:" -ForegroundColor Yellow
Write-Host "  https://suiscan.xyz/testnet/object/$GOLD_REPO" -ForegroundColor White
Write-Host ""
Write-Host "Point to:" -ForegroundColor Yellow
Write-Host "  - Revenue field" -ForegroundColor White
Write-Host "  - Trust score" -ForegroundColor White
Write-Host "  - Transaction history" -ForegroundColor White
Write-Host ""

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DEMO COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Files generated:" -ForegroundColor Yellow
Write-Host "  - demo-final-report.html" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Open demo-final-report.html in browser" -ForegroundColor White
Write-Host "  2. Open Suiscan link above" -ForegroundColor White
Write-Host "  3. Practice your voiceover" -ForegroundColor White
Write-Host "  4. Time yourself (aim for 5:00)" -ForegroundColor White
Write-Host ""
Write-Host "YOU'RE READY! 🚀" -ForegroundColor Green
Write-Host ""
