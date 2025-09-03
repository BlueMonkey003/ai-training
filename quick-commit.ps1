# Quick Commit Script
# Gebruik: .\quick-commit.ps1 "commit message"
# Of zonder parameters voor interactief

param(
    [string]$Message = ""
)

# Kleuren voor output
$ErrorActionPreference = "Stop"

Write-Host "=== Quick Commit Script ===" -ForegroundColor Cyan

# Toon status
Write-Host "`nHuidige wijzigingen:" -ForegroundColor Yellow
git status --short

# Als er geen wijzigingen zijn, stop
$changes = git status --porcelain
if (-not $changes) {
    Write-Host "`nGeen wijzigingen om te committen!" -ForegroundColor Green
    exit 0
}

# Vraag om commit message als niet opgegeven
if (-not $Message) {
    $Message = Read-Host "`nCommit bericht"
    if (-not $Message) {
        Write-Host "Commit bericht is verplicht!" -ForegroundColor Red
        exit 1
    }
}

# Voeg alle wijzigingen toe
Write-Host "`nWijzigingen toevoegen..." -ForegroundColor Yellow
git add .

# Commit
Write-Host "Committen..." -ForegroundColor Yellow
git commit -m $Message

# Vraag om te pushen
$currentBranch = git rev-parse --abbrev-ref HEAD
Write-Host "`nCommit succesvol!" -ForegroundColor Green
$push = Read-Host "Direct pushen naar origin/$currentBranch? (j/n)"

if ($push -eq 'j') {
    Write-Host "`nPushen..." -ForegroundColor Yellow
    git push origin $currentBranch
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`nSuccesvol gepusht!" -ForegroundColor Green
        
        # Als het niet main branch is, toon PR link
        if ($currentBranch -ne 'main') {
            Write-Host "`nPull Request aanmaken?" -ForegroundColor Cyan
            Write-Host "https://dev.azure.com/bluemonkeys123/AI-training/_git/AI-training-application/pullrequestcreate?sourceRef=$currentBranch&targetRef=main" -ForegroundColor Blue
        }
    }
}

Write-Host "`nKlaar!" -ForegroundColor Green

