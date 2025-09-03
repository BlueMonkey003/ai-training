# Git Helper Script voor LunchMonkeys - Enhanced Edition
# Gebruik: .\git-helper.ps1

# Kleuren voor output
function Write-Success { Write-Host $args[0] -ForegroundColor Green }
function Write-Error { Write-Host $args[0] -ForegroundColor Red }
function Write-Info { Write-Host $args[0] -ForegroundColor Cyan }
function Write-Warning { Write-Host $args[0] -ForegroundColor Yellow }

function Show-Menu {
    Clear-Host
    Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║     GIT HELPER - LUNCHMONKEYS v2.0     ║" -ForegroundColor Yellow
    Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
    
    # Toon huidige branch en status
    $currentBranch = git rev-parse --abbrev-ref HEAD 2>$null
    if ($currentBranch) {
        Write-Host "📍 Branch: " -NoNewline -ForegroundColor Gray
        if ($currentBranch -eq "main") {
            Write-Host "$currentBranch" -ForegroundColor Red
        } else {
            Write-Host "$currentBranch" -ForegroundColor Green
        }
        
        # Check for uncommitted changes
        $changes = git status --porcelain
        if ($changes) {
            Write-Warning "⚠️  Uncommitted changes aanwezig"
        }
    }
    Write-Host ""
    
    Write-Host "━━━ BASIS OPERATIES ━━━" -ForegroundColor DarkCyan
    Write-Host "1.  Status bekijken" -ForegroundColor Green
    Write-Host "2.  Nieuwe branch aanmaken" -ForegroundColor Green
    Write-Host "3.  Wijzigingen committen" -ForegroundColor Green
    Write-Host "4.  Push naar remote" -ForegroundColor Green
    Write-Host "5.  Pull van remote" -ForegroundColor Green
    
    Write-Host "`n━━━ BRANCH MANAGEMENT ━━━" -ForegroundColor DarkCyan
    Write-Host "6.  Branch wisselen" -ForegroundColor Green
    Write-Host "7.  Branches bekijken" -ForegroundColor Green
    Write-Host "8.  Sync met main branch" -ForegroundColor Green
    Write-Host "9.  Branch verwijderen" -ForegroundColor Yellow
    
    Write-Host "`n━━━ PULL REQUESTS ━━━" -ForegroundColor DarkCyan
    Write-Host "10. ⭐ CREATE PULL REQUEST (Automatisch)" -ForegroundColor Cyan
    Write-Host "11. Bekijk open Pull Requests" -ForegroundColor Green
    Write-Host "12. PR status controleren" -ForegroundColor Green
    
    Write-Host "`n━━━ GEAVANCEERD ━━━" -ForegroundColor DarkCyan
    Write-Host "13. Stash wijzigingen" -ForegroundColor Green
    Write-Host "14. Stash toepassen" -ForegroundColor Green
    Write-Host "15. Git log bekijken" -ForegroundColor Green
    Write-Host "16. Quick commit & push & PR" -ForegroundColor Magenta
    
    Write-Host "`n0.  Exit" -ForegroundColor Red
    Write-Host ""
}

function Git-Status {
    Write-Host "`n📊 Git Status:" -ForegroundColor Yellow
    Write-Host "═══════════════════════════════════" -ForegroundColor DarkGray
    
    # Uitgebreide status informatie
    $branch = git rev-parse --abbrev-ref HEAD
    $lastCommit = git log -1 --pretty=format:"%h - %s (%ar)"
    
    Write-Info "Branch: $branch"
    Write-Info "Laatste commit: $lastCommit"
    Write-Host ""
    
    git status
    
    # Check upstream status
    $upstream = git rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>$null
    if ($upstream) {
        $ahead = git rev-list --count '@{u}..HEAD' 2>$null
        $behind = git rev-list --count 'HEAD..@{u}' 2>$null
        if ($ahead -gt 0) {
            Write-Warning "⬆ $ahead commit(s) ahead of $upstream"
        }
        if ($behind -gt 0) {
            Write-Warning "⬇ $behind commit(s) behind $upstream"
        }
    }
    
    Write-Host "`nDruk op een toets om door te gaan..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Create-Branch {
    Write-Host "`n🌿 Nieuwe Branch Aanmaken" -ForegroundColor Yellow
    Write-Host "═══════════════════════════════════" -ForegroundColor DarkGray
    
    Write-Host "`nBranch type kiezen:" -ForegroundColor Cyan
    Write-Host "1. feature/ (nieuwe functionaliteit)"
    Write-Host "2. bugfix/ (bug oplossing)"
    Write-Host "3. hotfix/ (urgente fix)"
    Write-Host "4. custom (eigen prefix)"
    
    $type = Read-Host "`nKies type (1-4)"
    $prefix = switch ($type) {
        '1' { "feature/" }
        '2' { "bugfix/" }
        '3' { "hotfix/" }
        '4' { "" }
        default { "feature/" }
    }
    
    $branchName = Read-Host "Geef de branch naam (zonder prefix)"
    if ($branchName) {
        $fullBranchName = "$prefix$branchName"
        git checkout -b $fullBranchName
        if ($?) {
            Write-Success "✅ Branch '$fullBranchName' aangemaakt en geswitcht!"
            Write-Info "Tip: gebruik optie 10 om later een PR aan te maken"
        }
    }
    Write-Host "`nDruk op een toets om door te gaan..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Commit-Changes {
    Write-Host "`n💾 Wijzigingen Committen" -ForegroundColor Yellow
    Write-Host "═══════════════════════════════════" -ForegroundColor DarkGray
    
    Write-Host "`nHuidige wijzigingen:" -ForegroundColor Cyan
    git status --short
    
    if (-not (git status --porcelain)) {
        Write-Warning "Geen wijzigingen om te committen"
        Write-Host "`nDruk op een toets om door te gaan..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        return
    }
    
    $addAll = Read-Host "`nAlle wijzigingen toevoegen? (j/n)"
    if ($addAll -eq 'j') {
        git add .
        Write-Success "✅ Alle bestanden toegevoegd"
    }
    else {
        Write-Host "Selectieve toevoeging - voer bestanden in (spatie gescheiden):"
        $files = Read-Host "Bestanden"
        if ($files) {
            git add $files.Split(' ')
        }
    }
    
    # Commit type voor conventional commits
    Write-Host "`nCommit type:" -ForegroundColor Cyan
    Write-Host "1. feat: (nieuwe feature)"
    Write-Host "2. fix: (bug fix)"
    Write-Host "3. docs: (documentatie)"
    Write-Host "4. style: (formatting)"
    Write-Host "5. refactor: (code restructuring)"
    Write-Host "6. test: (tests toevoegen)"
    Write-Host "7. chore: (maintenance)"
    Write-Host "8. custom (geen prefix)"
    
    $commitType = Read-Host "Kies type (1-8)"
    $prefix = switch ($commitType) {
        '1' { "feat: " }
        '2' { "fix: " }
        '3' { "docs: " }
        '4' { "style: " }
        '5' { "refactor: " }
        '6' { "test: " }
        '7' { "chore: " }
        '8' { "" }
        default { "" }
    }
    
    $message = Read-Host "Commit bericht"
    if ($message) {
        git commit -m "$prefix$message"
        if ($?) {
            Write-Success "✅ Commit succesvol!"
            
            $pushNow = Read-Host "`nDirect pushen? (j/n)"
            if ($pushNow -eq 'j') {
                Push-Changes
                return
            }
        }
    }
    Write-Host "`nDruk op een toets om door te gaan..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Push-Changes {
    $currentBranch = git rev-parse --abbrev-ref HEAD
    Write-Host "`n📤 Push naar Remote" -ForegroundColor Yellow
    Write-Host "═══════════════════════════════════" -ForegroundColor DarkGray
    Write-Info "Branch: $currentBranch"
    
    Write-Host "`nPushing..." -ForegroundColor Cyan
    git push -u origin $currentBranch 2>&1 | Tee-Object -Variable pushOutput
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "✅ Push succesvol!"
        
        # Check of het een nieuwe branch is
        if ($pushOutput -match "new branch") {
            Write-Host "`n🎉 Nieuwe branch gepusht!" -ForegroundColor Green
            $createPR = Read-Host "Wil je direct een Pull Request aanmaken? (j/n)"
            if ($createPR -eq 'j') {
                Create-PullRequest
                return
            }
        }
    } else {
        Write-Error "❌ Push mislukt"
    }
    
    Write-Host "`nDruk op een toets om door te gaan..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Pull-Changes {
    $currentBranch = git rev-parse --abbrev-ref HEAD
    Write-Host "`n📥 Pull van Remote" -ForegroundColor Yellow
    Write-Host "═══════════════════════════════════" -ForegroundColor DarkGray
    Write-Info "Branch: $currentBranch"
    
    Write-Host "`nPulling..." -ForegroundColor Cyan
    git pull origin $currentBranch
    
    if ($?) {
        Write-Success "✅ Pull succesvol!"
    } else {
        Write-Error "❌ Pull mislukt - mogelijk merge conflicts"
    }
    
    Write-Host "`nDruk op een toets om door te gaan..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Switch-Branch {
    Write-Host "`n🔄 Branch Wisselen" -ForegroundColor Yellow
    Write-Host "═══════════════════════════════════" -ForegroundColor DarkGray
    
    # Check for uncommitted changes
    $changes = git status --porcelain
    if ($changes) {
        Write-Warning "⚠️  Je hebt uncommitted changes!"
        $stash = Read-Host "Wil je deze stashen? (j/n)"
        if ($stash -eq 'j') {
            git stash save "Auto-stash before branch switch"
            Write-Success "Changes gestashed"
        }
    }
    
    Write-Host "`nBeschikbare branches:" -ForegroundColor Cyan
    git branch
    
    Write-Host "`nRemote branches:" -ForegroundColor Cyan
    git branch -r | Select-String -NotMatch "HEAD"
    
    $branchName = Read-Host "`nNaar welke branch wisselen?"
    if ($branchName) {
        git checkout $branchName
        if ($?) {
            Write-Success "✅ Geswitcht naar $branchName"
            
            # Check if stash needs to be applied
            if ($stash -eq 'j') {
                $applyStash = Read-Host "Stashed changes terugzetten? (j/n)"
                if ($applyStash -eq 'j') {
                    git stash pop
                }
            }
        }
    }
    Write-Host "`nDruk op een toets om door te gaan..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Show-Branches {
    Write-Host "`n🌳 Branches Overzicht" -ForegroundColor Yellow
    Write-Host "═══════════════════════════════════" -ForegroundColor DarkGray
    
    $current = git rev-parse --abbrev-ref HEAD
    Write-Info "Huidige branch: $current"
    
    Write-Host "`n📍 Lokale branches:" -ForegroundColor Cyan
    git branch -v
    
    Write-Host "`n🌐 Remote branches:" -ForegroundColor Cyan
    git branch -r -v
    
    Write-Host "`n📊 Branch statistieken:" -ForegroundColor Cyan
    git for-each-ref --format='%(refname:short) %(committerdate:relative)' refs/heads/ | Sort-Object
    
    Write-Host "`nDruk op een toets om door te gaan..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Sync-WithMain {
    Write-Host "`n🔄 Synchroniseren met Main" -ForegroundColor Yellow
    Write-Host "═══════════════════════════════════" -ForegroundColor DarkGray
    
    $currentBranch = git rev-parse --abbrev-ref HEAD
    Write-Info "Huidige branch: $currentBranch"
    
    if ($currentBranch -eq "main") {
        Write-Warning "Je bent al op main branch!"
        git pull origin main
    } else {
        # Stash changes if needed
        $hasChanges = git status --porcelain
        if ($hasChanges) {
            Write-Warning "Lokale wijzigingen gevonden, deze worden tijdelijk opgeslagen..."
            git stash save "Auto-stash voor main sync"
        }
        
        # Fetch latest
        Write-Info "Fetching laatste wijzigingen..."
        git fetch origin main
        
        # Choose merge strategy
        Write-Host "`nKies sync methode:" -ForegroundColor Cyan
        Write-Host "1. Merge (behoud history)"
        Write-Host "2. Rebase (cleane history)"
        
        $choice = Read-Host "Keuze (1/2)"
        
        if ($choice -eq '2') {
            git rebase origin/main
        } else {
            git merge origin/main
        }
        
        if ($?) {
            Write-Success "✅ Sync succesvol!"
        } else {
            Write-Error "❌ Conflicts gevonden - los deze op en commit"
        }
        
        # Restore stash if needed
        if ($hasChanges) {
            Write-Info "Lokale wijzigingen terugzetten..."
            git stash pop
        }
    }
    
    Write-Host "`nDruk op een toets om door te gaan..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Delete-Branch {
    Write-Host "`n🗑️ Branch Verwijderen" -ForegroundColor Yellow
    Write-Host "═══════════════════════════════════" -ForegroundColor DarkGray
    
    Write-Host "`nLokale branches:" -ForegroundColor Cyan
    git branch
    
    $branchName = Read-Host "`nWelke branch verwijderen?"
    if ($branchName) {
        if ($branchName -eq "main") {
            Write-Error "❌ Kan main branch niet verwijderen!"
        } else {
            $deleteRemote = Read-Host "Ook van remote verwijderen? (j/n)"
            
            # Delete local
            git branch -D $branchName
            if ($?) {
                Write-Success "✅ Lokale branch verwijderd"
            }
            
            # Delete remote if requested
            if ($deleteRemote -eq 'j') {
                git push origin --delete $branchName
                if ($?) {
                    Write-Success "✅ Remote branch verwijderd"
                }
            }
        }
    }
    
    Write-Host "`nDruk op een toets om door te gaan..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Create-PullRequest {
    Write-Host "`n🚀 CREATE PULL REQUEST - Azure DevOps" -ForegroundColor Yellow
    Write-Host "═══════════════════════════════════" -ForegroundColor DarkGray
    
    # CHECK VOOR AUTO-PR.PS1 EN GEBRUIK DAT ALS HET BESTAAT
    $autoPrScript = Join-Path $PSScriptRoot "auto-pr.ps1"
    if (Test-Path $autoPrScript) {
        Write-Info "✨ Using automated PR script (auto-pr.ps1)..."
        Write-Host ""
        & $autoPrScript
        Write-Host "`nDruk op een toets om door te gaan..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        return
    }
    
    # FALLBACK: Oude methode als auto-pr.ps1 niet bestaat
    Write-Warning "auto-pr.ps1 niet gevonden, gebruik browser-based PR creation..."
    
    # Check current branch
    $currentBranch = git rev-parse --abbrev-ref HEAD
    
    if ($currentBranch -eq "main") {
        Write-Error "❌ Kan geen PR maken vanaf main branch!"
        Write-Info "Maak eerst een feature branch (optie 2)"
        Write-Host "`nDruk op een toets om door te gaan..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        return
    }
    
    Write-Info "Branch: $currentBranch"
    
    # Check for uncommitted changes
    $changes = git status --porcelain
    if ($changes) {
        Write-Warning "⚠️  Uncommitted changes gevonden!"
        $commitFirst = Read-Host "Wil je deze eerst committen? (j/n)"
        if ($commitFirst -eq 'j') {
            Commit-Changes
        }
    }
    
    # Push branch first
    Write-Info "`n📤 Branch pushen naar remote..."
    git push -u origin $currentBranch 2>&1 | Out-Null
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "❌ Push mislukt - fix eerst push problemen"
        Write-Host "`nDruk op een toets om door te gaan..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        return
    }
    
    Write-Success "✅ Branch gepusht"
    
    # Gather PR details
    Write-Host "`n📝 Pull Request Details:" -ForegroundColor Cyan
    
    # Smart title suggestion based on branch name
    $suggestedTitle = $currentBranch -replace '^(feature/|bugfix/|hotfix/)', '' -replace '-', ' '
    $suggestedTitle = (Get-Culture).TextInfo.ToTitleCase($suggestedTitle)
    
    Write-Host "Voorgestelde titel: $suggestedTitle" -ForegroundColor Gray
    $prTitle = Read-Host "PR Titel (Enter voor suggestie)"
    if (-not $prTitle) {
        $prTitle = $suggestedTitle
    }
    
    # Get recent commits for description
    Write-Host "`nRecente commits op deze branch:" -ForegroundColor Gray
    git log origin/main..HEAD --oneline --max-count=5
    
    $prDescription = Read-Host "`nPR Beschrijving"
    if (-not $prDescription) {
        # Auto-generate description from commits
        $commits = git log origin/main..HEAD --pretty=format:"- %s" --max-count=10
        $prDescription = "## Changes`n`n$commits"
    }
    
    # Generate URL for manual creation
    $encodedTitle = [System.Web.HttpUtility]::UrlEncode($prTitle)
    $encodedDescription = [System.Web.HttpUtility]::UrlEncode($prDescription)
    
    $prUrl = "https://dev.azure.com/bluemonkeys123/AI-training/_git/AI-training-application/pullrequestcreate" +
             "?sourceRef=$currentBranch" +
             "&targetRef=main" +
             "&title=$encodedTitle" +
             "&description=$encodedDescription"
    
    Write-Host "`n📋 Opening browser voor PR creation..." -ForegroundColor Green
    Write-Info "Titel en beschrijving zijn vooringevuld"
    Start-Process $prUrl
    Write-Success "✅ Browser geopend - klik 'Create' om de PR aan te maken"
    
    Write-Host "`nDruk op een toets om door te gaan..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Show-PullRequests {
    Write-Host "`n📋 Open Pull Requests" -ForegroundColor Yellow
    Write-Host "═══════════════════════════════════" -ForegroundColor DarkGray
    
    Write-Warning "Deze functie vereist Azure CLI (niet geïnstalleerd)"
    Write-Info "Opening browser met PR lijst..."
    
    Start-Process "https://dev.azure.com/bluemonkeys123/AI-training/_git/AI-training-application/pullrequests"
    
    Write-Host "`nDruk op een toets om door te gaan..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Check-PRStatus {
    Write-Host "`n📊 PR Status Controleren" -ForegroundColor Yellow
    Write-Host "═══════════════════════════════════" -ForegroundColor DarkGray
    
    $currentBranch = git rev-parse --abbrev-ref HEAD
    Write-Info "Huidige branch: $currentBranch"
    
    Write-Warning "Deze functie vereist Azure CLI (niet geïnstalleerd)"
    Write-Info "Check manual in browser..."
    
    $prUrl = "https://dev.azure.com/bluemonkeys123/AI-training/_git/AI-training-application/pullrequests?_a=mine"
    Start-Process $prUrl
    
    Write-Host "`nDruk op een toets om door te gaan..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Stash-Changes {
    Write-Host "`n📦 Stash Wijzigingen" -ForegroundColor Yellow
    Write-Host "═══════════════════════════════════" -ForegroundColor DarkGray
    
    $changes = git status --porcelain
    if (-not $changes) {
        Write-Warning "Geen wijzigingen om te stashen"
    } else {
        Write-Host "Te stashen wijzigingen:" -ForegroundColor Cyan
        git status --short
        
        $message = Read-Host "`nStash beschrijving (optioneel)"
        if ($message) {
            git stash push -m "$message"
        } else {
            git stash push
        }
        
        if ($?) {
            Write-Success "✅ Wijzigingen gestashed!"
            
            Write-Host "`nHuidige stashes:" -ForegroundColor Cyan
            git stash list | Select-Object -First 5
        }
    }
    
    Write-Host "`nDruk op een toets om door te gaan..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Apply-Stash {
    Write-Host "`n📤 Stash Toepassen" -ForegroundColor Yellow
    Write-Host "═══════════════════════════════════" -ForegroundColor DarkGray
    
    $stashList = git stash list
    if (-not $stashList) {
        Write-Warning "Geen stashes beschikbaar"
    } else {
        Write-Host "Beschikbare stashes:" -ForegroundColor Cyan
        git stash list | ForEach-Object {
            Write-Host "  $_"
        }
        
        Write-Host "`nOpties:" -ForegroundColor Cyan
        Write-Host "1. Apply (behoud stash)"
        Write-Host "2. Pop (apply en verwijder stash)"
        
        $action = Read-Host "Keuze (1/2)"
        $stashIndex = Read-Host "Welke stash? (0, 1, 2, etc.)"
        
        if ($stashIndex -ne '') {
            if ($action -eq '2') {
                git stash pop "stash@{$stashIndex}"
            } else {
                git stash apply "stash@{$stashIndex}"
            }
            
            if ($?) {
                Write-Success "✅ Stash toegepast!"
            } else {
                Write-Error "❌ Mogelijk conflicts - check git status"
            }
        }
    }
    
    Write-Host "`nDruk op een toets om door te gaan..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Show-Log {
    Write-Host "`n📜 Git Log" -ForegroundColor Yellow
    Write-Host "═══════════════════════════════════" -ForegroundColor DarkGray
    
    Write-Host "Log opties:" -ForegroundColor Cyan
    Write-Host "1. Laatste 10 commits (simpel)"
    Write-Host "2. Laatste 20 commits (graph)"
    Write-Host "3. Commits van vandaag"
    Write-Host "4. Commits van deze week"
    Write-Host "5. Search commits by message"
    
    $choice = Read-Host "`nKeuze (1-5)"
    
    switch ($choice) {
        '1' { 
            git log --oneline -10 --decorate
        }
        '2' { 
            git log --oneline -20 --graph --all --decorate
        }
        '3' { 
            git log --since="00:00" --oneline --decorate
        }
        '4' { 
            git log --since="1 week ago" --oneline --decorate
        }
        '5' { 
            $search = Read-Host "Zoekterm"
            git log --grep="$search" --oneline --decorate
        }
        default { 
            git log --oneline -10 --graph --decorate
        }
    }
    
    Write-Host "`nDruk op een toets om door te gaan..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Quick-Deploy {
    Write-Host "`n⚡ QUICK COMMIT, PUSH & PR" -ForegroundColor Magenta
    Write-Host "═══════════════════════════════════" -ForegroundColor DarkGray
    Write-Warning "Dit zal alle wijzigingen committen, pushen en een PR aanmaken!"
    
    $currentBranch = git rev-parse --abbrev-ref HEAD
    
    if ($currentBranch -eq "main") {
        Write-Error "❌ Kan niet vanaf main branch!"
        Write-Host "`nDruk op een toets om door te gaan..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        return
    }
    
    $changes = git status --porcelain
    if (-not $changes) {
        Write-Warning "Geen wijzigingen gevonden"
        Write-Host "`nDruk op een toets om door te gaan..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        return
    }
    
    Write-Host "`nWijzigingen:" -ForegroundColor Cyan
    git status --short
    
    $confirm = Read-Host "`nDoorgaan? (j/n)"
    if ($confirm -ne 'j') {
        Write-Info "Geannuleerd"
        Write-Host "`nDruk op een toets om door te gaan..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        return
    }
    
    # Quick commit
    $message = Read-Host "Commit message"
    if (-not $message) {
        $message = "Quick update from $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
    }
    
    Write-Info "1️⃣ Committing..."
    git add .
    git commit -m "$message"
    
    Write-Info "2️⃣ Pushing..."
    git push -u origin $currentBranch
    
    if ($?) {
        Write-Success "✅ Commit & Push succesvol!"
        
        Write-Info "3️⃣ Creating PR..."
        Create-PullRequest
    } else {
        Write-Error "❌ Push failed - check git status"
        Write-Host "`nDruk op een toets om door te gaan..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    }
}

# Hoofdloop
do {
    Show-Menu
    $choice = Read-Host "Selecteer een optie"
    
    switch ($choice) {
        '1' { Git-Status }
        '2' { Create-Branch }
        '3' { Commit-Changes }
        '4' { Push-Changes }
        '5' { Pull-Changes }
        '6' { Switch-Branch }
        '7' { Show-Branches }
        '8' { Sync-WithMain }
        '9' { Delete-Branch }
        '10' { Create-PullRequest }
        '11' { Show-PullRequests }
        '12' { Check-PRStatus }
        '13' { Stash-Changes }
        '14' { Apply-Stash }
        '15' { Show-Log }
        '16' { Quick-Deploy }
        '0' { 
            Write-Host "`n👋 Tot ziens!" -ForegroundColor Yellow
            break 
        }
        default { 
            Write-Host "Ongeldige keuze!" -ForegroundColor Red
            Start-Sleep -Seconds 1
        }
    }
} while ($choice -ne '0')