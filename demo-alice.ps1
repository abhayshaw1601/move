# Alice's Demo Script - The Creator
# Run this in the LEFT terminal window

Write-Host "`n=== ALICE: THE CREATOR ===" -ForegroundColor Cyan
Write-Host "Training breakthrough AI model...`n" -ForegroundColor Gray

# Step 1: Show the model file
Write-Host "[1] Model trained: model.bin" -ForegroundColor Green
if (Test-Path "model.bin") {
    $size = (Get-Item "model.bin").Length
    Write-Host "    Size: $size bytes`n" -ForegroundColor Gray
} else {
    Write-Host "    Creating demo model file..." -ForegroundColor Yellow
    # Create a dummy model file for demo
    $demoContent = "DEMO_AI_MODEL_" + (Get-Random)
    Set-Content -Path "model.bin" -Value $demoContent
    Write-Host "    Demo model created`n" -ForegroundColor Gray
}

# Step 2: Upload to Walrus (simulated for demo)
Write-Host "[2] Uploading to Walrus decentralized storage..." -ForegroundColor Cyan
Write-Host "    Sharding model into chunks..." -ForegroundColor Gray
Start-Sleep -Seconds 2
$BLOB_ID = "blob_" + (Get-Random -Maximum 999999)
Write-Host "    ✓ Blob ID: $BLOB_ID`n" -ForegroundColor Green

# Step 3: Commit to VersionFS
Write-Host "[3] Committing to VersionFS blockchain..." -ForegroundColor Cyan
Write-Host "    Command: npm run cli -- commit --repo <REPO_ID> --cap <CAP_ID> --branch main --message 'Initial commit' --file model.bin --accuracy 98.5 --loss 0.02 --epochs 100 --f1-score 0.92`n" -ForegroundColor Gray

# Pause for user to run actual command
Write-Host "Press Enter to continue after running the commit command..." -ForegroundColor Yellow
Read-Host

# Step 4: Show certificate
Write-Host "`n[4] Generating Provenance Certificate..." -ForegroundColor Cyan
Write-Host "    Command: npm run cli -- certificate --repo <REPO_ID>`n" -ForegroundColor Gray

Write-Host "Press Enter to continue after viewing certificate..." -ForegroundColor Yellow
Read-Host

# Step 5: Verify
Write-Host "`n[5] Running TEE Verification..." -ForegroundColor Cyan
Write-Host "    Command: npm run cli -- verify --repo <REPO_ID>`n" -ForegroundColor Gray

Write-Host "Press Enter to continue after verification..." -ForegroundColor Yellow
Read-Host

Write-Host "`n✓ ALICE'S MODEL IS NOW PROVABLY AUTHENTIC" -ForegroundColor Green
Write-Host "  Trust Score: GOLD [VERIFIED]`n" -ForegroundColor Green
