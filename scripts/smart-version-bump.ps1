# Smart Version Bump Script
# Determines version bump type based on branch name or commit message

param(
    [Parameter(Mandatory = $false)]
    [string]$BranchName = "",
    
    [Parameter(Mandatory = $false)]
    [string]$CommitMessage = "",
    
    [Parameter(Mandatory = $false)]
    [ValidateSet("major", "minor", "patch", "auto")]
    [string]$Type = "auto",
    
    [Parameter(Mandatory = $false)]
    [switch]$DryRun
)

# Get version file path
$versionFile = Join-Path $PSScriptRoot "..\version.json"

# Function to determine change type from branch name
function Get-ChangeTypeFromBranch {
    param([string]$branch)
    
    switch -Regex ($branch) {
        "^hotfix/" { return "patch" }
        "^bugfix/" { return "patch" }
        "^fix/" { return "patch" }
        "^feature/" { return "minor" }
        "^feat/" { return "minor" }
        "^major/" { return "major" }
        "^breaking/" { return "major" }
        default { return $null }
    }
}

# Function to determine change type from commit message
function Get-ChangeTypeFromCommit {
    param([string]$message)
    
    # Conventional commit patterns
    switch -Regex ($message.ToLower()) {
        "^fix:" { return "patch" }
        "^hotfix:" { return "patch" }
        "^bugfix:" { return "patch" }
        "^feat:" { return "minor" }
        "^feature:" { return "minor" }
        "^breaking:" { return "major" }
        "^major:" { return "major" }
        "breaking[\s-]change" { return "major" }
        default { return $null }
    }
}

# Main logic
try {
    # Read current version
    if (-not (Test-Path $versionFile)) {
        Write-Host "X Version file not found at: $versionFile" -ForegroundColor Red
        exit 1
    }
    
    $versionData = Get-Content $versionFile | ConvertFrom-Json
    $currentVersion = $versionData.version
    $buildNumber = $versionData.buildNumber
    
    Write-Host "[Current] version: $currentVersion (build $buildNumber)" -ForegroundColor Cyan
    
    # Determine version bump type
    $bumpType = $Type
    
    if ($Type -eq "auto") {
        # Try branch name first
        if ($BranchName) {
            $bumpType = Get-ChangeTypeFromBranch -branch $BranchName
            if ($bumpType) {
                Write-Host "[Detected] '$bumpType' from branch: $BranchName" -ForegroundColor Yellow
            }
        }
        
        # If no branch name or no match, try commit message
        if (-not $bumpType -and $CommitMessage) {
            $bumpType = Get-ChangeTypeFromCommit -message $CommitMessage
            if ($bumpType) {
                Write-Host "[Detected] '$bumpType' from commit: $CommitMessage" -ForegroundColor Yellow
            }
        }
        
        # Default to patch if nothing detected
        if (-not $bumpType) {
            $bumpType = "patch"
            Write-Host "[Warning] No type detected, defaulting to: $bumpType" -ForegroundColor Yellow
        }
    }
    
    # Parse version parts
    $versionParts = $currentVersion -split '\.'
    $major = [int]$versionParts[0]
    $minor = [int]$versionParts[1]
    $patch = [int]$versionParts[2]
    
    # Increment based on type
    switch ($bumpType) {
        "major" {
            $major++
            $minor = 0
            $patch = 0
            Write-Host "[MAJOR] version bump" -ForegroundColor Green
        }
        "minor" {
            $minor++
            $patch = 0
            Write-Host "[MINOR] version bump" -ForegroundColor Green
        }
        "patch" {
            $patch++
            Write-Host "[PATCH] version bump" -ForegroundColor Green
        }
    }
    
    # Always increment build number
    $buildNumber++
    
    # Create new version string
    $newVersion = "$major.$minor.$patch"
    $date = Get-Date -Format "yyyy-MM-dd"
    
    Write-Host "[NEW] version: $newVersion (build $buildNumber)" -ForegroundColor Green
    
    if ($DryRun) {
        Write-Host "`n[DRY RUN] - No changes made" -ForegroundColor Yellow
        Write-Host "Output:"
        Write-Host "  Version: $newVersion"
        Write-Host "  Build: $buildNumber"
        Write-Host "  Type: $bumpType"
        
        # Return values for pipeline
        Write-Host "##vso[task.setvariable variable=NEW_VERSION]$newVersion"
        Write-Host "##vso[task.setvariable variable=BUILD_NUMBER]$buildNumber"
        Write-Host "##vso[task.setvariable variable=BUMP_TYPE]$bumpType"
    }
    else {
        # Update version data
        $versionData.version = $newVersion
        $versionData.lastUpdated = $date
        $versionData.buildNumber = $buildNumber
        
        # Write back to file
        $versionData | ConvertTo-Json | Set-Content $versionFile
        Write-Host "[OK] Version file updated" -ForegroundColor Green
        
        # Update package.json files
        $packageFiles = @(
            Join-Path $PSScriptRoot "..\frontend\package.json",
            Join-Path $PSScriptRoot "..\backend\package.json"
        )
        
        foreach ($file in $packageFiles) {
            if (Test-Path $file) {
                $packageData = Get-Content $file | ConvertFrom-Json
                $packageData.version = $newVersion
                $packageData | ConvertTo-Json -Depth 10 | Set-Content $file
                Write-Host "[OK] Updated: $file" -ForegroundColor Green
            }
        }
        
        Write-Host "`n[SUCCESS] Version bump completed!" -ForegroundColor Green
    }
    
    # Output for other scripts/pipeline
    return @{
        OldVersion  = $currentVersion
        NewVersion  = $newVersion
        BuildNumber = $buildNumber
        BumpType    = $bumpType
    }
}
catch {
    Write-Host "[ERROR] $_" -ForegroundColor Red
    exit 1
}
