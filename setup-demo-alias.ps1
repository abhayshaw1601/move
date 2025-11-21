# Setup Demo Alias
# Run this before your demo to enable "vfs" command

Write-Host "Setting up demo environment..." -ForegroundColor Cyan

# Create vfs function that properly passes all arguments
function global:vfs {
    $allArgs = $args
    & npm run cli -- @allArgs
}

# Set clean prompt
function global:prompt { "> " }

# Clear screen
cls

Write-Host "OK Demo environment ready!" -ForegroundColor Green
Write-Host ""
Write-Host "You can now use:" -ForegroundColor Yellow
Write-Host "  vfs storefront" -ForegroundColor White
Write-Host "  vfs commit --repo [ID] --file ./file.bin --attr [attrs]" -ForegroundColor White
Write-Host "  vfs inspect --repo [ID]" -ForegroundColor White
Write-Host "  vfs verify --repo [ID]" -ForegroundColor White
Write-Host "  vfs audit-report --repo [ID] --out report.html" -ForegroundColor White
Write-Host ""
Write-Host "Ready for demo!" -ForegroundColor Green
Write-Host ""
