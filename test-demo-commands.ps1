# Test script to verify all demo commands work
# Run this before your actual demo to catch any issues

Write-Host "VERSIONFS DEMO COMMAND TEST" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Continue"
$testsPassed = 0
$testsFailed = 0

function Test-Command {
    param(
        [string]$Name,
        [string]$Command
    )
    
    Write-Host "Testing: $Name" -ForegroundColor Yellow
    Write-Host "Command: $Command" -ForegroundColor Gray
    
    try {
        Invoke-Expression $Command
        if ($LASTEXITCODE -eq 0) {
            Write-Host "PASS" -ForegroundColor Green
            $script:testsPassed++
        }
        else {
            Write-Host "FAIL" -ForegroundColor Red
            $script:testsFailed++
        }
    }
    catch {
        Write-Host "FAIL" -ForegroundColor Red
        $script:testsFailed++
    }
    
    Write-Host ""
}

# Test 1: Build
Write-Host "-----------------------------------------------------------" -ForegroundColor Gray
Test-Command "Build Project" "npm run build"

# Test 2: Help command
Write-Host "-----------------------------------------------------------" -ForegroundColor Gray
Test-Command "CLI Help" "node dist/index.js --help"

# Test 3: Individual command help
Write-Host "-----------------------------------------------------------" -ForegroundColor Gray
Test-Command "Create Repository Help" "node dist/index.js create-repository --help"

Write-Host "-----------------------------------------------------------" -ForegroundColor Gray
Test-Command "Commit Help" "node dist/index.js commit --help"

Write-Host "-----------------------------------------------------------" -ForegroundColor Gray
Test-Command "Fork Help" "node dist/index.js fork --help"

Write-Host "-----------------------------------------------------------" -ForegroundColor Gray
Test-Command "Certificate Help" "node dist/index.js certificate --help"

Write-Host "-----------------------------------------------------------" -ForegroundColor Gray
Test-Command "Verify Help" "node dist/index.js verify --help"

Write-Host "-----------------------------------------------------------" -ForegroundColor Gray
Test-Command "Storefront Help" "node dist/index.js storefront --help"

# Test 4: Check .env file
Write-Host "-----------------------------------------------------------" -ForegroundColor Gray
Write-Host "Testing: .env Configuration" -ForegroundColor Yellow

if (Test-Path ".env") {
    Write-Host "PASS: .env file exists" -ForegroundColor Green
    
    $envContent = Get-Content ".env" -Raw
    
    if ($envContent -match "SUI_PRIVATE_KEY") {
        Write-Host "PASS: SUI_PRIVATE_KEY found" -ForegroundColor Green
        $testsPassed++
    }
    else {
        Write-Host "FAIL: SUI_PRIVATE_KEY missing" -ForegroundColor Red
        $testsFailed++
    }
    
    if ($envContent -match "PACKAGE_ID") {
        Write-Host "PASS: PACKAGE_ID found" -ForegroundColor Green
        $testsPassed++
    }
    else {
        Write-Host "FAIL: PACKAGE_ID missing" -ForegroundColor Red
        $testsFailed++
    }
}
else {
    Write-Host "FAIL: .env file not found" -ForegroundColor Red
    $testsFailed++
}

Write-Host ""

# Test 5: Check demo files
Write-Host "-----------------------------------------------------------" -ForegroundColor Gray
Write-Host "Testing: Demo Files" -ForegroundColor Yellow

$demoFiles = @(
    "demo-alice.ps1",
    "demo-bob.ps1",
    "demo-automated.ps1",
    "DEMO-GUIDE.txt",
    "DEMO-QUICK-REFERENCE.txt",
    "DEMO-SETUP-COMPLETE.txt"
)

foreach ($file in $demoFiles) {
    if (Test-Path $file) {
        Write-Host "PASS: $file exists" -ForegroundColor Green
        $testsPassed++
    }
    else {
        Write-Host "FAIL: $file missing" -ForegroundColor Red
        $testsFailed++
    }
}

Write-Host ""

# Test 6: Check TypeScript compilation
Write-Host "-----------------------------------------------------------" -ForegroundColor Gray
Write-Host "Testing: TypeScript Files" -ForegroundColor Yellow

$tsFiles = @(
    "src/commands/fork.ts",
    "src/commands/certificate.ts",
    "src/commands/create-repo.ts"
)

foreach ($file in $tsFiles) {
    if (Test-Path $file) {
        Write-Host "PASS: $file exists" -ForegroundColor Green
        $testsPassed++
    }
    else {
        Write-Host "FAIL: $file missing" -ForegroundColor Red
        $testsFailed++
    }
}

Write-Host ""

# Summary
Write-Host "-----------------------------------------------------------" -ForegroundColor Gray
Write-Host "TEST SUMMARY" -ForegroundColor Cyan
Write-Host "-----------------------------------------------------------" -ForegroundColor Gray
Write-Host ""
Write-Host "Tests Passed: $testsPassed" -ForegroundColor Green
Write-Host "Tests Failed: $testsFailed" -ForegroundColor $(if ($testsFailed -eq 0) { "Green" } else { "Red" })
Write-Host ""

if ($testsFailed -eq 0) {
    Write-Host "ALL TESTS PASSED - You're ready for the demo!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Create a repository: npm run cli -- create-repository --name AliceModel --price 0" -ForegroundColor Gray
    Write-Host "2. Save the REPO_ID and CAP_ID" -ForegroundColor Gray
    Write-Host "3. Run the automated demo" -ForegroundColor Gray
}
else {
    Write-Host "SOME TESTS FAILED - Please fix the issues above" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common fixes:" -ForegroundColor Yellow
    Write-Host "- Run: npm install" -ForegroundColor Gray
    Write-Host "- Run: npm run build" -ForegroundColor Gray
    Write-Host "- Check .env file has SUI_PRIVATE_KEY and PACKAGE_ID" -ForegroundColor Gray
}

Write-Host ""
