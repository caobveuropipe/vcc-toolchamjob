# Deploy all scripts (client, doPost) with version backup
$rootDir = $PSScriptRoot
Set-Location $rootDir

Write-Host "`n========================================" -ForegroundColor Magenta
Write-Host "DEPLOYING ALL MODULES (WITH BACKUP)" -ForegroundColor Magenta
Write-Host "========================================`n" -ForegroundColor Magenta

# Create backup folder with timestamp
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupDir = "$rootDir\backup\$timestamp"
$versionDesc = "Pre-deploy backup - $timestamp"

Write-Host "[BACKUP] Creating backup before deploy..." -ForegroundColor Yellow
Write-Host "[BACKUP] Backup folder: $backupDir" -ForegroundColor Yellow
Write-Host "[BACKUP] Version description: $versionDesc" -ForegroundColor Yellow
Write-Host ""

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
        
        Set-Location $mPath
        clasp version "$versionDesc"
        if ($LASTEXITCODE -ne 0) {
            Set-Location $rootDir
            Write-Host "[ERROR] Failed to version $m (exit code: $LASTEXITCODE)" -ForegroundColor Red
            exit $LASTEXITCODE
        }
        Set-Location $rootDir
        Write-Host "OK $m backed up and versioned!" -ForegroundColor Green
        Write-Host ""
    }
}

Write-Host "========================================" -ForegroundColor Green
Write-Host "BACKUP & VERSIONING COMPLETED!" -ForegroundColor Green
Write-Host "Local backup: $backupDir" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Now deploy all valid modules
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "STARTING DEPLOYMENT..." -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Write-Host ""

foreach ($m in $validModules) {
    $mPath = Join-Path $rootDir $m
    $claspFile = Join-Path $mPath ".clasp.json"
    $deploymentId = (Get-Content $claspFile | ConvertFrom-Json).deploymentId
    if ($deploymentId) {
        Write-Host "[DEPLOY] Deploying $m ($deploymentId)..." -ForegroundColor Yellow
        Set-Location $mPath
        clasp deploy -i $deploymentId
        if ($LASTEXITCODE -ne 0) {
            Set-Location $rootDir
            Write-Host "[ERROR] Failed to deploy $m (exit code: $LASTEXITCODE)" -ForegroundColor Red
            exit $LASTEXITCODE
        }
        Set-Location $rootDir
        Write-Host "OK $m deployed successfully!`n" -ForegroundColor Green
    } else {
        Write-Host "[SKIP] $m has no deploymentId set in .clasp.json" -ForegroundColor Yellow
    }
}

Write-Host "========================================" -ForegroundColor Magenta
Write-Host "ALL DEPLOYMENTS COMPLETED!" -ForegroundColor Magenta
Write-Host "Local backup: $backupDir" -ForegroundColor Magenta
Write-Host "Cloud versions created with: $versionDesc" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
