# Pull all scripts (dopost, client) from Google Apps Script
$rootDir = $PSScriptRoot
Set-Location $rootDir

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PULLING ALL MODULES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Pull doPost
if (Test-Path "$rootDir\doPost") {
    Write-Host "[PULL 1/2] Pulling doPost..." -ForegroundColor Yellow
    Set-Location "$rootDir\doPost"
    clasp pull
    Set-Location $rootDir
    Write-Host "OK doPost pulled successfully!" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "[WARNING] Directory doPost not found at expected location!" -ForegroundColor Red
}

# Pull client
if (Test-Path "$rootDir\client") {
    Write-Host "[PULL 2/2] Pulling client..." -ForegroundColor Yellow
    Set-Location "$rootDir\client"
    clasp pull
    Set-Location $rootDir
    Write-Host "OK client pulled successfully!" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "[WARNING] Directory client not found at expected location!" -ForegroundColor Red
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ALL PULLS COMPLETED!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
