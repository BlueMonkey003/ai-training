# Git Helper Script voor LunchMonkeys
# Gebruik: .\git-helper.ps1

function Show-Menu {
    Clear-Host
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "       GIT HELPER - LUNCHMONKEYS       " -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Status bekijken" -ForegroundColor Green
    Write-Host "2. Nieuwe branch aanmaken" -ForegroundColor Green
    Write-Host "3. Wijzigingen committen" -ForegroundColor Green
    Write-Host "4. Push naar remote" -ForegroundColor Green
    Write-Host "5. Pull van remote" -ForegroundColor Green
    Write-Host "6. Branch wisselen" -ForegroundColor Green
    Write-Host "7. Branches bekijken" -ForegroundColor Green
    Write-Host "8. Pull Request info (Azure DevOps)" -ForegroundColor Green
    Write-Host "9. Sync met main branch" -ForegroundColor Green
    Write-Host "10. Stash wijzigingen" -ForegroundColor Green
    Write-Host "11. Stash toepassen" -ForegroundColor Green
    Write-Host "12. Git log bekijken" -ForegroundColor Green
    Write-Host "0. Exit" -ForegroundColor Red
    Write-Host ""
}

function Git-Status {
    Write-Host "`nGit Status:" -ForegroundColor Yellow
    git status
    Write-Host "`nDruk op een toets om door te gaan..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Create-Branch {
    $branchName = Read-Host "Geef de naam van de nieuwe branch"
    if ($branchName) {
        git checkout -b $branchName
        Write-Host "Branch '$branchName' aangemaakt en geswitcht!" -ForegroundColor Green
    }
    Write-Host "`nDruk op een toets om door te gaan..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Commit-Changes {
    Write-Host "`nHuidige wijzigingen:" -ForegroundColor Yellow
    git status --short
    
    $addAll = Read-Host "`nAlle wijzigingen toevoegen? (j/n)"
    if ($addAll -eq 'j') {
        git add .
    }
    else {
        $files = Read-Host "Welke bestanden toevoegen? (spatie gescheiden)"
        if ($files) {
            git add $files.Split(' ')
        }
    }
    
    $message = Read-Host "Commit bericht"
    if ($message) {
        git commit -m $message
        Write-Host "Commit succesvol!" -ForegroundColor Green
    }
    Write-Host "`nDruk op een toets om door te gaan..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Push-Changes {
    $currentBranch = git rev-parse --abbrev-ref HEAD
    Write-Host "Huidige branch: $currentBranch" -ForegroundColor Yellow
    
    $confirm = Read-Host "Push naar origin/$currentBranch? (j/n)"
    if ($confirm -eq 'j') {
        git push origin $currentBranch
        Write-Host "Push succesvol!" -ForegroundColor Green
        
        # Als het een nieuwe branch is, toon PR link
        if ($LASTEXITCODE -eq 0) {
            Write-Host "`nPull Request aanmaken?" -ForegroundColor Cyan
            Write-Host "Ga naar: https://dev.azure.com/bluemonkeys123/AI-training/_git/AI-training-application/pullrequestcreate?sourceRef=$currentBranch&targetRef=main" -ForegroundColor Blue
        }
    }
    Write-Host "`nDruk op een toets om door te gaan..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Pull-Changes {
    $currentBranch = git rev-parse --abbrev-ref HEAD
    Write-Host "Pull van origin/$currentBranch..." -ForegroundColor Yellow
    git pull origin $currentBranch
    Write-Host "`nDruk op een toets om door te gaan..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Switch-Branch {
    Write-Host "`nBeschikbare branches:" -ForegroundColor Yellow
    git branch -a
    $branchName = Read-Host "`nNaar welke branch wisselen?"
    if ($branchName) {
        git checkout $branchName
    }
    Write-Host "`nDruk op een toets om door te gaan..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Show-Branches {
    Write-Host "`nLokale branches:" -ForegroundColor Yellow
    git branch
    Write-Host "`nRemote branches:" -ForegroundColor Yellow
    git branch -r
    Write-Host "`nDruk op een toets om door te gaan..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Show-PRInfo {
    $currentBranch = git rev-parse --abbrev-ref HEAD
    Write-Host "`nPull Request informatie:" -ForegroundColor Yellow
    Write-Host "Huidige branch: $currentBranch" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Om een Pull Request aan te maken:" -ForegroundColor Green
    Write-Host "1. Push eerst je branch: git push origin $currentBranch"
    Write-Host "2. Ga naar Azure DevOps:"
    Write-Host "   https://dev.azure.com/bluemonkeys123/AI-training/_git/AI-training-application/pullrequests" -ForegroundColor Blue
    Write-Host "3. Klik op 'New pull request'"
    Write-Host "4. Selecteer je branch als source en 'main' als target"
    Write-Host ""
    Write-Host "Direct link voor nieuwe PR:" -ForegroundColor Green
    Write-Host "https://dev.azure.com/bluemonkeys123/AI-training/_git/AI-training-application/pullrequestcreate?sourceRef=$currentBranch&targetRef=main" -ForegroundColor Blue
    Write-Host "`nDruk op een toets om door te gaan..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Sync-WithMain {
    $currentBranch = git rev-parse --abbrev-ref HEAD
    Write-Host "Synchroniseren met main branch..." -ForegroundColor Yellow
    
    # Stash eventuele wijzigingen
    $hasChanges = git status --porcelain
    if ($hasChanges) {
        Write-Host "Lokale wijzigingen gevonden, deze worden tijdelijk opgeslagen..." -ForegroundColor Cyan
        git stash
    }
    
    # Fetch laatste wijzigingen
    git fetch origin main
    
    # Merge of rebase
    $mergeType = Read-Host "Merge (m) of Rebase (r) met main? (m/r)"
    if ($mergeType -eq 'r') {
        git rebase origin/main
    }
    else {
        git merge origin/main
    }
    
    # Stash terugzetten indien nodig
    if ($hasChanges) {
        Write-Host "Lokale wijzigingen terugzetten..." -ForegroundColor Cyan
        git stash pop
    }
    
    Write-Host "`nDruk op een toets om door te gaan..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Stash-Changes {
    $message = Read-Host "Stash beschrijving (optioneel)"
    if ($message) {
        git stash save $message
    }
    else {
        git stash
    }
    Write-Host "Wijzigingen opgeslagen in stash!" -ForegroundColor Green
    Write-Host "`nDruk op een toets om door te gaan..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Apply-Stash {
    Write-Host "`nBeschikbare stashes:" -ForegroundColor Yellow
    git stash list
    $stashIndex = Read-Host "`nWelke stash toepassen? (0, 1, 2, etc.)"
    if ($stashIndex -ne '') {
        git stash apply "stash@{$stashIndex}"
    }
    Write-Host "`nDruk op een toets om door te gaan..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Show-Log {
    Write-Host "`nGit Log (laatste 10 commits):" -ForegroundColor Yellow
    git log --oneline -10 --graph --decorate
    Write-Host "`nDruk op een toets om door te gaan..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
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
        '8' { Show-PRInfo }
        '9' { Sync-WithMain }
        '10' { Stash-Changes }
        '11' { Apply-Stash }
        '12' { Show-Log }
        '0' { 
            Write-Host "Tot ziens!" -ForegroundColor Yellow
            break 
        }
        default { 
            Write-Host "Ongeldige keuze!" -ForegroundColor Red
            Start-Sleep -Seconds 1
        }
    }
} while ($choice -ne '0')
