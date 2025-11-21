@echo off
echo.
echo ========================================
echo   AI PROVENANCE PLATFORM - QUICK DEMO
echo ========================================
echo.

REM Repository IDs
set REPO1=0xcca7201e5c22e0c4f8f3686e634e26e1f0638d51168410a35622653ea7f269a4
set REPO2=0x3d7c9a69ad9b5b332e219033921338c98424f2a436e7f0e6ecb385ab9928cb04
set REPO3=0x61a165112fd23b2ec40e0330c78f0229d466b996a97a210b016b8f91ee728c37

echo [1/5] Showing Marketplace...
echo.
call npm run cli -- storefront
echo.
pause

echo.
echo [2/5] Inspecting Repository...
echo.
call npm run cli -- inspect --repo %REPO1%
echo.
pause

echo.
echo [3/5] Viewing Commit History...
echo.
call npm run cli -- log
echo.
pause

echo.
echo [4/5] Generating Audit Report (4 versions, 18 shards)...
echo.
call npm run cli -- audit-report --repo %REPO1% --out ./demo-report.html
echo.
echo Opening report in browser...
start demo-report.html
pause

echo.
echo [5/5] Showing Gold Badge Repository...
echo.
call npm run cli -- audit-report --repo %REPO2% --out ./gold-badge-demo.html
echo.
echo Opening Gold badge report...
start gold-badge-demo.html

echo.
echo ========================================
echo   DEMO COMPLETE!
echo ========================================
echo.
echo Repository Links:
echo   Repo 1: https://suiscan.xyz/testnet/object/%REPO1%
echo   Repo 2: https://suiscan.xyz/testnet/object/%REPO2%
echo   Repo 3: https://suiscan.xyz/testnet/object/%REPO3%
echo.
pause
