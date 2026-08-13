# Push all scripts (client, doPost) with backup
$rootDir = $PSScriptRoot
Set-Location $rootDir

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PUSHING ALL MODULES (WITH BACKUP)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Create backup folder with timestamp
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupDir = "$rootDir\backup\$timestamp"

Write-Host "[BACKUP] Creating backup before push..." -ForegroundColor Magenta
Write-Host "[BACKUP] Backup folder: $backupDir" -ForegroundColor Magenta
Write-Host ""

# Identify existing directories dynamically with .clasp.json
$modules = @("client", "doPost")
$validModules = @()

foreach ($m in $modules) {
    $mPath = Join-Path $rootDir $m
    if ((Test-Path $mPath) -and (Test-Path (Join-Path $mPath ".clasp.json"))) {
        $validModules += $m
        $bPath = Join-Path $backupDir $m
        New-Item -ItemType Directory -Force -Path $bPath | Out-Null
        Write-Host "[BACKUP] Backing up $m (local)..." -ForegroundColor Yellow
        Copy-Item -Path "$mPath\*.js" -Destination "$bPath\" -ErrorAction SilentlyContinue
        Copy-Item -Path "$mPath\*.gs" -Destination "$bPath\" -ErrorAction SilentlyContinue
        Copy-Item -Path "$mPath\*.html" -Destination "$bPath\" -ErrorAction SilentlyContinue
        Copy-Item -Path "$mPath\appsscript.json" -Destination "$bPath\" -ErrorAction SilentlyContinue
        Write-Host "OK $m backed up!" -ForegroundColor Green
        Write-Host ""
    }
}

Write-Host "========================================" -ForegroundColor Green
Write-Host "BACKUP COMPLETED: $backupDir" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Now push existing modules
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "STARTING PUSH..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$pushedCount = 0
foreach ($m in $validModules) {
    $mPath = Join-Path $rootDir $m
    Write-Host "[PUSH] Pushing $m..." -ForegroundColor Yellow
    Set-Location $mPath
    clasp push -f
    if ($LASTEXITCODE -ne 0) {
        Set-Location $rootDir
        Write-Host "[ERROR] Failed to push $m (exit code: $LASTEXITCODE)" -ForegroundColor Red
        exit $LASTEXITCODE
    }
    Set-Location $rootDir
    Write-Host "OK $m pushed successfully!" -ForegroundColor Green
    Write-Host ""
    $pushedCount++
}

if ($pushedCount -eq 0 -and (Test-Path (Join-Path $rootDir ".clasp.json"))) {
    Write-Host "[PUSH] Pushing root directory..." -ForegroundColor Yellow
    Set-Location $rootDir
    clasp push -f
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Failed to push root directory (exit code: $LASTEXITCODE)" -ForegroundColor Red
        exit $LASTEXITCODE
    }
    Write-Host "OK root directory pushed successfully!" -ForegroundColor Green
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ALL PUSHES COMPLETED!" -ForegroundColor Cyan
Write-Host "Backup saved at: $backupDir" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
