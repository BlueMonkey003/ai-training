# PowerShell script to bump version number
param(
    [Parameter(Mandatory = $false)]
    [ValidateSet("major", "minor", "patch", "build")]
    [string]$Type = "build"
)

$versionFile = "version.json"

# Read current version
$versionData = Get-Content $versionFile | ConvertFrom-Json
$currentVersion = $versionData.version
$buildNumber = $versionData.buildNumber

Write-Host "Current version: $currentVersion (build $buildNumber)" -ForegroundColor Cyan

# Parse version parts
$versionParts = $currentVersion -split '\.'
$major = [int]$versionParts[0]
$minor = [int]$versionParts[1]
$patch = [int]$versionParts[2]

# Increment based on type
switch ($Type) {
    "major" {
        $major++
        $minor = 0
        $patch = 0
        Write-Host "Major version bump" -ForegroundColor Yellow
    }
    "minor" {
        $minor++
        $patch = 0
        Write-Host "Minor version bump" -ForegroundColor Yellow
    }
    "patch" {
        $patch++
        Write-Host "Patch version bump" -ForegroundColor Yellow
    }
    "build" {
        # Only increment build number
        Write-Host "Build number bump" -ForegroundColor Yellow
    }
}

# Always increment build number
$buildNumber++

# Create new version string
$newVersion = "$major.$minor.$patch"
$date = Get-Date -Format "yyyy-MM-dd"

# Update version data
$versionData.version = $newVersion
$versionData.lastUpdated = $date
$versionData.buildNumber = $buildNumber

# Write back to file
$versionData | ConvertTo-Json | Set-Content $versionFile

Write-Host "New version: $newVersion (build $buildNumber)" -ForegroundColor Green

# Update frontend package.json
$frontendPackageFile = "frontend/package.json"
if (Test-Path $frontendPackageFile) {
    $packageData = Get-Content $frontendPackageFile | ConvertFrom-Json
    $packageData.version = $newVersion
    $packageData | ConvertTo-Json -Depth 10 | Set-Content $frontendPackageFile
    Write-Host "Updated frontend package.json" -ForegroundColor Green
}

# Update backend package.json
$backendPackageFile = "backend/package.json"
if (Test-Path $backendPackageFile) {
    $packageData = Get-Content $backendPackageFile | ConvertFrom-Json
    $packageData.version = $newVersion
    $packageData | ConvertTo-Json -Depth 10 | Set-Content $backendPackageFile
    Write-Host "Updated backend package.json" -ForegroundColor Green
}

Write-Host "`nVersion bump completed!" -ForegroundColor Green
