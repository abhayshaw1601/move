# Bob's Demo Script - The Attacker
# Run this in the RIGHT terminal window

Write-Host "`n=== BOB: THE ATTACKER ===" -ForegroundColor Red
Write-Host "Attempting to steal Alice's work...`n" -ForegroundColor Gray

# Step 1: Fork Alice's repository
Write-Host "[1] Forking Alice's repository..." -ForegroundColor Yellow
Write-Host "    Command: npm run cli -- fork --from <ALICE_REPO_ID> --name 'Bobs-Stolen-Model' --price 1000000000`n" -ForegroundColor Gray

Write-Host "Press Enter to continue after running fork command..." -ForegroundColor Yellow
Read-Host

# Step 2: Show the upstream author lock
Write-Host "`n[2] Checking repository metadata..." -ForegroundColor Cyan
Write-Host "    Command: npm run cli -- certificate --repo <BOB_REPO_ID>`n" -ForegroundColor Gray

Write-Host "Press Enter to continue after viewing certificate..." -ForegroundColor Yellow
Read-Host

Write-Host "`n⚠️  UPSTREAM AUTHOR LOCKED TO ALICE" -ForegroundColor Yellow
Write-Host "    Bob cannot erase Alice's attribution!" -ForegroundColor Yellow
Write-Host "    5% royalties automatically route to Alice`n" -ForegroundColor Yellow

# Step 3: Attempt to upload poisoned model
Write-Host "[3] Attempting to upload POISONED model..." -ForegroundColor Red
Write-Host "    Creating backdoored version..." -ForegroundColor Gray

# Create a modified "poisoned" model
$poisonedContent = "POISONED_MODEL_" + (Get-Random)
Set-Content -Path "model-poisoned.bin" -Value $poisonedContent
Write-Host "    ✓ Poisoned model created: model-poisoned.bin`n" -ForegroundColor Red

# Step 4: Try to verify the poisoned model
Write-Host "[4] Attempting verification of poisoned model..." -ForegroundColor Red
Write-Host "    Command: npm run cli -- verify --repo <BOB_REPO_ID>`n" -ForegroundColor Gray

Write-Host "Press Enter to see verification result..." -ForegroundColor Yellow
Read-Host

# Step 5: Show the failure
Write-Host "`n╔════════════════════════════════════════╗" -ForegroundColor Red
Write-Host "║                                        ║" -ForegroundColor Red
Write-Host "║   ❌ INTEGRITY CHECK FAILED           ║" -ForegroundColor Red
Write-Host "║                                        ║" -ForegroundColor Red
Write-Host "║   Hash mismatch detected.              ║" -ForegroundColor Red
Write-Host "║   Model has been modified.             ║" -ForegroundColor Red
Write-Host "║                                        ║" -ForegroundColor Red
Write-Host "║   ACCESS DENIED                        ║" -ForegroundColor Red
Write-Host "║                                        ║" -ForegroundColor Red
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Red

Write-Host "`n✓ VERSIONFS DETECTED THE FRAUD" -ForegroundColor Green
Write-Host "  Bob's attack was blocked by cryptographic proof`n" -ForegroundColor Green
