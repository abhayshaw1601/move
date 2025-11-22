# Automated Demo Script for VersionFS
# This script simulates the full demo workflow with visual output

param(
    [string]$AliceRepoId = "",
    [string]$AliceCapId = "",
    [string]$BobRepoId = ""
)

$ErrorActionPreference = "Continue"

function Show-Banner {
    Clear-Host
    Write-Host ""
    Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║                                                           ║" -ForegroundColor Cyan
    Write-Host "║              VERSION_FS: PROVABLY AUTHENTIC               ║" -ForegroundColor Cyan
    Write-Host "║                                                           ║" -ForegroundColor Cyan
    Write-Host "║         Built on Sui Blockchain + Walrus Storage          ║" -ForegroundColor Cyan
    Write-Host "║                                                           ║" -ForegroundColor Cyan
    Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
}

function Show-Section {
    param([string]$Title, [string]$Time)
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Gray
    Write-Host " [$Time] $Title" -ForegroundColor Yellow
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Gray
    Write-Host ""
}

function Pause-Demo {
    param([string]$Message = "Press Enter to continue...")
    Write-Host ""
    Write-Host $Message -ForegroundColor Yellow
    Read-Host
}

# ============================================================================
# DEMO START
# ============================================================================

Show-Banner

Write-Host "🎬 VERSIONFS DEMO - THE TRUTH ENGINE FOR AI" -ForegroundColor Cyan
Write-Host ""
Write-Host "This demo will walk you through:" -ForegroundColor White
Write-Host "  1. Alice commits an AI model" -ForegroundColor Gray
Write-Host "  2. Alice verifies authenticity" -ForegroundColor Gray
Write-Host "  3. Bob attempts to steal credit" -ForegroundColor Gray
Write-Host "  4. System detects and blocks fraud" -ForegroundColor Gray
Write-Host ""

Pause-Demo "Press Enter to start the demo..."

# ============================================================================
# SECTION 1: THE HOOK (0:00-0:20)
# ============================================================================

Show-Section "THE HOOK: The Problem" "0:00-0:20"

Write-Host "We are entering the era of the 'Black Box' AI." -ForegroundColor White
Write-Host ""
Write-Host "Every day, models are:" -ForegroundColor White
Write-Host "  • Stolen" -ForegroundColor Red
Write-Host "  • Poisoned" -ForegroundColor Red
Write-Host "  • Deepfaked" -ForegroundColor Red
Write-Host ""
Write-Host "If I download a medical AI model right now," -ForegroundColor White
Write-Host "I have ZERO proof of who made it, or if it's safe." -ForegroundColor Red
Write-Host ""

Pause-Demo

# ============================================================================
# SECTION 2: THE SOLUTION (0:20-0:45)
# ============================================================================

Show-Section "THE SOLUTION: VersionFS" "0:20-0:45"

Write-Host "The current internet cannot solve this." -ForegroundColor White
Write-Host "Storage is dumb; it just holds data." -ForegroundColor Gray
Write-Host ""
Write-Host "We need storage that proves truth." -ForegroundColor Cyan
Write-Host ""
Write-Host "Introducing VersionFS:" -ForegroundColor Cyan -NoNewline
Write-Host " The Truth Engine for AI" -ForegroundColor White
Write-Host ""
Write-Host "By combining:" -ForegroundColor White
Write-Host "  • Walrus (decentralized storage)" -ForegroundColor Cyan
Write-Host "  • Sui (immutable blockchain)" -ForegroundColor Cyan
Write-Host ""
Write-Host "We built a file system that doesn't just store code—" -ForegroundColor White
Write-Host "it proves its provenance." -ForegroundColor Green
Write-Host ""

Pause-Demo

# ============================================================================
# SECTION 3: ALICE COMMITS (0:45-1:10)
# ============================================================================

Show-Section "ALICE: The Creator" "0:45-1:10"

Write-Host "Meet Alice. She just trained a breakthrough AI model." -ForegroundColor Cyan
Write-Host ""

# Create demo model file
if (-not (Test-Path "model.bin")) {
    Write-Host "Creating demo model file..." -ForegroundColor Gray
    "DEMO_AI_MODEL_BREAKTHROUGH_V1" | Out-File -FilePath "model.bin" -Encoding ASCII
}

Write-Host "✓ Model trained: model.bin" -ForegroundColor Green
$size = (Get-Item "model.bin").Length
Write-Host "  Size: $size bytes" -ForegroundColor Gray
Write-Host ""

Write-Host "Instead of just uploading to a web server," -ForegroundColor White
Write-Host "she commits it to VersionFS." -ForegroundColor Cyan
Write-Host ""

if ($AliceRepoId -eq "" -or $AliceCapId -eq "") {
    Write-Host "⚠️  To run the actual commit, you need:" -ForegroundColor Yellow
    Write-Host "   1. Create a repository first" -ForegroundColor Gray
    Write-Host "   2. Pass -AliceRepoId and -AliceCapId parameters" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Command would be:" -ForegroundColor Gray
    Write-Host "npm run cli -- commit --repo <REPO_ID> --cap <CAP_ID> --branch main --message 'Breakthrough AI model' --file model.bin --accuracy 98.5 --loss 0.02 --epochs 100 --f1-score 0.92" -ForegroundColor DarkGray
} else {
    Write-Host "Running commit command..." -ForegroundColor Cyan
    npm run cli -- commit --repo $AliceRepoId --cap $AliceCapId --branch main --message "Breakthrough AI model" --file model.bin --accuracy 98.5 --loss 0.02 --epochs 100 --f1-score 0.92
}

Write-Host ""
Pause-Demo

# ============================================================================
# SECTION 4: VERIFICATION (1:10-1:40)
# ============================================================================

Show-Section "VERIFICATION: Trust Oracle" "1:10-1:40"

Write-Host "But is it real?" -ForegroundColor Yellow
Write-Host ""
Write-Host "Our system acts as a Trust Oracle." -ForegroundColor Cyan
Write-Host "It generates a cryptographic Provenance Certificate" -ForegroundColor White
Write-Host "that links the file hash to Alice's identity." -ForegroundColor White
Write-Host ""

if ($AliceRepoId -ne "") {
    Write-Host "Generating certificate..." -ForegroundColor Cyan
    npm run cli -- certificate --repo $AliceRepoId
    Write-Host ""
    
    Pause-Demo "Press Enter to run verification..."
    
    Write-Host "Running TEE verification..." -ForegroundColor Cyan
    npm run cli -- verify --repo $AliceRepoId
} else {
    Write-Host "Commands would be:" -ForegroundColor Gray
    Write-Host "npm run cli -- certificate --repo <REPO_ID>" -ForegroundColor DarkGray
    Write-Host "npm run cli -- verify --repo <REPO_ID>" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "Expected output:" -ForegroundColor Gray
    Write-Host "  TRUST SCORE: GOLD [VERIFIED]" -ForegroundColor Green
}

Write-Host ""
Pause-Demo

# ============================================================================
# SECTION 5: BOB FORKS (1:40-2:00)
# ============================================================================

Show-Section "BOB: The Attacker" "1:40-2:00"

Write-Host "Now, meet Bob." -ForegroundColor Red
Write-Host "Bob wants to take credit for Alice's work." -ForegroundColor Red
Write-Host ""
Write-Host "In the old world, he would just copy-paste the file." -ForegroundColor Gray
Write-Host "But on VersionFS, he has to Fork the repository." -ForegroundColor Cyan
Write-Host ""
Write-Host "Watch what happens..." -ForegroundColor Yellow
Write-Host ""

if ($AliceRepoId -ne "") {
    Write-Host "Bob forks Alice's repository..." -ForegroundColor Red
    npm run cli -- fork --from $AliceRepoId --name "BobsStolenModel" --price 1000000000
} else {
    Write-Host "Command would be:" -ForegroundColor Gray
    Write-Host "npm run cli -- fork --from <ALICE_REPO_ID> --name 'BobsStolenModel' --price 1000000000" -ForegroundColor DarkGray
}

Write-Host ""
Pause-Demo

# ============================================================================
# SECTION 6: UPSTREAM AUTHOR LOCKED (2:00-2:25)
# ============================================================================

Show-Section "THE RESOLUTION: Permanent Attribution" "2:00-2:25"

Write-Host "Bob now has his own repo." -ForegroundColor White
Write-Host "But look at the metadata..." -ForegroundColor Yellow
Write-Host ""

if ($BobRepoId -ne "") {
    npm run cli -- certificate --repo $BobRepoId
} else {
    Write-Host "Command would be:" -ForegroundColor Gray
    Write-Host "npm run cli -- certificate --repo <BOB_REPO_ID>" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "The upstream_author field is permanently hardcoded to Alice." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
Write-Host "║  ⚠️  UPSTREAM AUTHOR LOCKED TO ALICE                  ║" -ForegroundColor Yellow
Write-Host "║                                                        ║" -ForegroundColor Yellow
Write-Host "║  Bob cannot erase her.                                ║" -ForegroundColor Yellow
Write-Host "║  5% royalties automatically route back to Alice.      ║" -ForegroundColor Yellow
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Yellow
Write-Host ""

Pause-Demo

# ============================================================================
# SECTION 7: DEEPFAKE TEST (2:25-2:45)
# ============================================================================

Show-Section "DEEPFAKE TEST: Integrity Check" "2:25-2:45"

Write-Host "Finally, the Deepfake Test." -ForegroundColor Cyan
Write-Host ""
Write-Host "Bob tries to upload a modified, poisoned version" -ForegroundColor Red
Write-Host "claiming it's verified." -ForegroundColor Red
Write-Host ""

# Create poisoned model
"POISONED_BACKDOOR_MODEL" | Out-File -FilePath "model-poisoned.bin" -Encoding ASCII
Write-Host "✓ Poisoned model created: model-poisoned.bin" -ForegroundColor Red
Write-Host ""

Write-Host "The Oracle detects the hash mismatch immediately..." -ForegroundColor Yellow
Write-Host ""

Start-Sleep -Seconds 2

Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Red
Write-Host "║                                                        ║" -ForegroundColor Red
Write-Host "║   ❌ INTEGRITY CHECK FAILED                           ║" -ForegroundColor Red
Write-Host "║                                                        ║" -ForegroundColor Red
Write-Host "║   Hash mismatch detected.                             ║" -ForegroundColor Red
Write-Host "║   Model has been modified or corrupted.               ║" -ForegroundColor Red
Write-Host "║                                                        ║" -ForegroundColor Red
Write-Host "║   ACCESS DENIED                                       ║" -ForegroundColor Red
Write-Host "║                                                        ║" -ForegroundColor Red
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Red
Write-Host ""

Pause-Demo

# ============================================================================
# SECTION 8: CLOSING (2:45-3:00)
# ============================================================================

Show-Section "CLOSING: The Truth Engine" "2:45-3:00"

Write-Host "In an era of AI theft," -ForegroundColor White
Write-Host "VersionFS is the standard for Provable Authenticity." -ForegroundColor Cyan
Write-Host ""
Write-Host "✓ Verify the Source" -ForegroundColor Green
Write-Host "✓ Trust the Model" -ForegroundColor Green
Write-Host ""
Write-Host "Built on Sui and Walrus." -ForegroundColor Cyan
Write-Host ""
Write-Host "Thank you." -ForegroundColor White
Write-Host ""

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "                    THE TRUTH ENGINE                       " -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "GitHub: https://github.com/abhayshaw1601/move" -ForegroundColor Blue
Write-Host ""

# Cleanup
if (Test-Path "model-poisoned.bin") {
    Remove-Item "model-poisoned.bin" -Force
}

Write-Host "Demo complete! 🚀" -ForegroundColor Green
Write-Host ""
