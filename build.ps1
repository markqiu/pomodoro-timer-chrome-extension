# Minimal Pomodoro Timer - Build Script
# Creates Chrome extension package

param(
    [string]$Version = "1.0.0"
)

$ErrorActionPreference = "Stop"

Write-Host "Building Minimal Pomodoro Timer extension..." -ForegroundColor Green

# Define files and directories
$packageName = "minimal-pomodoro-v$Version"
$zipFile = "$packageName.zip"
$buildDir = "build"

# Clean old build files
if (Test-Path $buildDir) {
    Remove-Item -Recurse -Force $buildDir
    Write-Host "Cleaned old build directory" -ForegroundColor Yellow
}

if (Test-Path $zipFile) {
    Remove-Item -Force $zipFile
    Write-Host "Removed old zip file" -ForegroundColor Yellow
}

# Create build directory
New-Item -ItemType Directory -Path $buildDir | Out-Null

# Files to include
$filesToInclude = @(
    "manifest.json",
    "popup.html",
    "css",
    "js",
    "icons"
)

# Copy files
foreach ($item in $filesToInclude) {
    if (Test-Path $item) {
        Copy-Item -Path $item -Destination $buildDir -Recurse -Force
        Write-Host "Copied: $item" -ForegroundColor Cyan
    } else {
        Write-Warning "File or directory not found: $item"
    }
}

# Create zip file
Write-Host ""
Write-Host "Creating zip file..." -ForegroundColor Green

# Use PowerShell 5.0+ Compress-Archive
Compress-Archive -Path "$buildDir\*" -DestinationPath $zipFile -Force

Write-Host ""
Write-Host "Build completed!" -ForegroundColor Green
Write-Host "Package: $zipFile" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Check files in build directory are complete" -ForegroundColor White
Write-Host "2. Test build directory in Chrome" -ForegroundColor White
Write-Host "3. Upload $zipFile to Chrome Web Store" -ForegroundColor White

