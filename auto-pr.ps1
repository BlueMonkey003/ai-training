

# Parameters moeten bovenaan (voor alle andere code) 
param(
    [switch]$TestConnection,
    [switch]$ListPRs,
    [ValidateSet('major', 'feat', 'fix', 'chore', 'docs', 'style', 'refactor', 'test', 'build', '')]
    [string]$Type = ''
)

# CONFIGURATIE - TOKEN VIA ENVIRONMENT VARIABLE OF FALLBACK
# Optie 1: Zet token in environment variable: $env:AZURE_PAT = "je-token-hier"
# Optie 2: Of gebruik het fallback bestand .pat-token.txt (zet dit in .gitignore!)
if ($env:AZURE_PAT) {
    $GLOBAL_PAT_TOKEN = $env:AZURE_PAT
}
elseif (Test-Path "$PSScriptRoot\.pat-token.txt") {
    $GLOBAL_PAT_TOKEN = Get-Content "$PSScriptRoot\.pat-token.txt" -Raw | ForEach-Object { $_.Trim() }
}
else {
    Write-Host "⚠️  PAT Token niet gevonden!" -ForegroundColor Yellow
    Write-Host "Opties:" -ForegroundColor White
    Write-Host "1. Zet environment variable: `$env:AZURE_PAT = 'je-token'" -ForegroundColor Gray
    Write-Host "2. Of maak bestand: .pat-token.txt (in zelfde map als script)" -ForegroundColor Gray
    $GLOBAL_PAT_TOKEN = Read-Host "Of plak token hier voor deze sessie"
}

function New-AzureDevOpsPR {
    Write-Host "🚀 Automatische Pull Request Maker" -ForegroundColor Yellow
    Write-Host "===================================" -ForegroundColor Cyan
    
    # Check branch
    $currentBranch = git branch --show-current
    if (-not $currentBranch) {
        # Fallback voor oudere git versies
        $currentBranch = git rev-parse --abbrev-ref HEAD
    }
    
    if ($currentBranch -eq "main") {
        Write-Host "❌ Kan geen PR maken vanaf main branch!" -ForegroundColor Red
        return
    }
    
    Write-Host "📍 Branch: $currentBranch" -ForegroundColor Cyan
    
    # Push eerst (met error handling)
    # Bepaal change type uit branch naam
    $changeType = ""
    $changeEmoji = ""
    switch -Regex ($currentBranch) {
        "^hotfix/" { 
            $changeType = "fix"
            $changeEmoji = "🔧"
        }
        "^bugfix/" { 
            $changeType = "fix"
            $changeEmoji = "🐛"
        }
        "^fix/" { 
            $changeType = "fix"
            $changeEmoji = "🔧"
        }
        "^feature/" { 
            $changeType = "feat"
            $changeEmoji = "✨"
        }
        "^feat/" { 
            $changeType = "feat"
            $changeEmoji = "✨"
        }
        default { 
            $changeType = "chore"
            $changeEmoji = "📝"
        }
    }
    
    # Als expliciet type meegegeven is, override branch detectie
    if ($Type -and $Type -ne '') {
        switch ($Type) {
            'major' { $changeType = 'major'; $changeEmoji = '💥' }
            'feat' { $changeType = 'feat'; $changeEmoji = '✨' }
            'fix' { $changeType = 'fix'; $changeEmoji = '🔧' }
            'chore' { $changeType = 'chore'; $changeEmoji = '📝' }
            'docs' { $changeType = 'docs'; $changeEmoji = '📝' }
            'style' { $changeType = 'style'; $changeEmoji = '🎨' }
            'refactor' { $changeType = 'refactor'; $changeEmoji = '🛠️' }
            'test' { $changeType = 'test'; $changeEmoji = '🧪' }
            'build' { $changeType = 'build'; $changeEmoji = '🏗️' }
        }
    }
    else {
        # Override type/emoji op basis van laatste commits (major heeft hoogste prioriteit)
        try {
            $subjects = @(git log -n 10 --pretty=format:"%s")
            $subjects = $subjects | Where-Object { $_ -notmatch 'chore: update release notes' }
            $detected = $null
            foreach ($s in $subjects) {
                $lc = $s.ToLower()
                if ($lc -match "^[\p{P}\p{S}\s]*major:" -or $lc -match "^[\p{P}\p{S}\s]*breaking:" -or $lc -match "breaking[\s-]change") { $detected = 'major'; break }
                elseif (-not $detected -and $lc -match "^feat:") { $detected = 'feat' }
                elseif (-not $detected -and $lc -match "^fix:") { $detected = 'fix' }
            }
            if ($detected) {
                switch ($detected) {
                    'major' { $changeType = 'major'; $changeEmoji = '💥' }
                    'feat' { $changeType = 'feat'; $changeEmoji = '✨' }
                    'fix' { $changeType = 'fix'; $changeEmoji = '🔧' }
                }
            }
        }
        catch {}
    }
    
    # Get PR info
    $suggestedTitle = $currentBranch -replace '^(feature/|bugfix/|hotfix/|feat/|fix/)', '' -replace '-', ' '
    $suggestedTitle = (Get-Culture).TextInfo.ToTitleCase($suggestedTitle)
    $fullSuggestedTitle = "$changeEmoji $($changeType): $suggestedTitle"
    
    Write-Host "`nSuggestie: $fullSuggestedTitle" -ForegroundColor DarkGray
    $title = Read-Host "PR Titel (Enter voor suggestie)"
    if (-not $title) { 
        $title = $fullSuggestedTitle
        Write-Host "Gebruik: $title" -ForegroundColor Gray
    }
    elseif (-not ($title -match "^[\W]*(major|feat|fix|chore|docs|style|refactor|test|build):")) {
        # Als gebruiker geen type prefix heeft, voeg het toe
        $title = "$changeEmoji $($changeType): $title"
        Write-Host "Aangepast naar: $title" -ForegroundColor Gray
    }
    
    # Release notes:  eerst probe ren uit version.json (vandaag); anders vragen we ze
    $bullets = @()
    try {
        $versionFile = Join-Path $PSScriptRoot "version.json"
        if (Test-Path $versionFile) {
            $today = Get-Date -Format 'yyyy-MM-dd'
            $versionData = Get-Content $versionFile -Raw | ConvertFrom-Json
            if ($versionData -and $versionData.recentCommits) {
                $bullets = @($versionData.recentCommits | Where-Object { $_.date -like "$today*" } | Select-Object -ExpandProperty message)
            }
        }
    }
    catch { $bullets = @() }

    if (-not $bullets -or $bullets.Count -eq 0) {
        Write-Host "`n📝 Vul de wijzigingen in (bulletpoints). Druk op ENTER op een lege regel om te stoppen." -ForegroundColor Yellow
        $capture = @()
        while ($true) {
            $line = Read-Host "-"
            if ([string]::IsNullOrWhiteSpace($line)) { break }
            $capture += $line.Trim()
        }
        if ($capture.Count -gt 0) {
            $bullets = $capture
            # Schrijf naar version.json zodat de app dezelfde bron gebruikt (max 5 items)
            try {
                $versionFile = Join-Path $PSScriptRoot "version.json"
                if (Test-Path $versionFile) {
                    $versionData = Get-Content $versionFile -Raw | ConvertFrom-Json
                    if (-not ($versionData.PSObject.Properties.Name -contains 'recentCommits')) {
                        $versionData | Add-Member -NotePropertyName recentCommits -NotePropertyValue @() -Force
                    }
                    $today = Get-Date -Format 'yyyy-MM-dd'
                    $newItems = @()
                    foreach ($b in $bullets) { $newItems += @{ date = $today; message = $b } }
                    $existing = @()
                    if ($versionData.recentCommits) {
                        $existing = @($versionData.recentCommits | Where-Object { $_.message -and $_.date -ne $today })
                    }
                    $merged = @($newItems + $existing)
                    if ($merged.Count -gt 5) { $merged = $merged[0..4] }
                    $versionData.recentCommits = $merged
                    $versionData | ConvertTo-Json -Depth 10 | Set-Content $versionFile
                    git add $versionFile | Out-Null
                    git commit -m "chore: update release notes in version.json [skip ci]" 2>$null | Out-Null
                }
            }
            catch { Write-Host "⚠️ Kon version.json niet updaten: $_" -ForegroundColor Yellow }
        }
    }

    $releaseNotes = ($bullets | ForEach-Object { "- $_" }) -join "`n"
    $releaseNotesBlock = "<!-- RELEASE_NOTES_START -->`n$releaseNotes`n<!-- RELEASE_NOTES_END -->"

    # Schrijf release notes naar version.json (VOORDAT we pushen) – max 5 items
    try {
        $versionFile = Join-Path $PSScriptRoot "version.json"
        if (Test-Path $versionFile) {
            $versionData = Get-Content $versionFile -Raw | ConvertFrom-Json
            if (-not ($versionData.PSObject.Properties.Name -contains 'recentCommits')) {
                $versionData | Add-Member -NotePropertyName recentCommits -NotePropertyValue @() -Force
            }
            $today = Get-Date -Format 'yyyy-MM-dd'
            $newItems = @()
            foreach ($b in $bullets) { $newItems += @{ date = $today; message = $b } }
            $existing = @()
            if ($versionData.recentCommits) {
                $existing = @($versionData.recentCommits | Where-Object { $_.message -and $_.date -ne $today })
            }
            $merged = @($newItems + $existing)
            if ($merged.Count -gt 5) { $merged = $merged[0..4] }
            $versionData.recentCommits = $merged
            $versionData | ConvertTo-Json -Depth 10 | Set-Content $versionFile
            git add $versionFile
            git commit -m "chore: update release notes in version.json [skip ci]" 2>$null | Out-Null
        }
    }
    catch { Write-Host "⚠️ Kon version.json niet updaten: $_" -ForegroundColor Yellow }

    # Nu pas pushen (inclusief version.json commit)
    Write-Host "📤 Pushing naar remote..." -ForegroundColor Yellow
    $pushOutput = git push -u origin $currentBranch 2>&1
    if ($LASTEXITCODE -ne 0 -and $pushOutput -notmatch "Everything up-to-date") {
        Write-Host "❌ Push mislukt: $pushOutput" -ForegroundColor Red
        return
    }
    Write-Host "✅ Push succesvol of branch was al up-to-date" -ForegroundColor Green

    # Optionele extra beschrijving
    $extraDescription = Read-Host "Extra toelichting (optioneel)"
    $description = "## Wijzigingen`n`n$releaseNotesBlock"
    if ($extraDescription) { $description += "`n`n## Beschrijving`n$extraDescription" }
    
    # Gebruik het hardcoded PAT token
    $PAT = $GLOBAL_PAT_TOKEN
    
    # Maak headers voor API call
    $base64AuthInfo = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes(":$PAT"))
    $headers = @{
        Authorization  = "Basic $base64AuthInfo"
        "Content-Type" = "application/json"
        Accept         = "application/json"
    }
    
    # Body voor PR request
    $body = @{
        sourceRefName = "refs/heads/$currentBranch"
        targetRefName = "refs/heads/main"
        title         = $title
        description   = $description
        isDraft       = $false
    } | ConvertTo-Json -Depth 10
    
    # Azure D evOps API URL
    $uri = "https://dev.azure.com/bluemonkeys123/AI-training/_apis/git/repositories/AI-training-application/pullrequests?api-version=7.1-preview.1"
    
    Write-Host "`n🔄 PR aanmaken..." -ForegroundColor Yellow
    Write-Host "Van: $currentBranch → main" -ForegroundColor Gray
    
    # Debug info (optioneel - comment uit voor productie)
    # Write-Host "`n🔍 Debug Info:" -ForegroundColor DarkGray
    # Write-Host "API URL: $uri" -ForegroundColor DarkGray
    # Write-Host "Request Body:" -ForegroundColor DarkGray
    # Write-Host $body -ForegroundColor DarkGray
    # Write-Host "" 
    
    try {
        # Zorg voor TLS 1.2
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        
        # Disable progress bar voor deze request
        $ProgressPreference = 'SilentlyContinue'
        
        $response = Invoke-RestMethod -Uri $uri -Method POST -Headers $headers -Body $body -ErrorAction Stop
        
        # Re-enable progress bar
        $ProgressPreference = 'Continue'
        
        if ($response -and $response.pullRequestId) {
            Write-Host "`n✅ SUCCES! Pull Request aangemaakt!" -ForegroundColor Green
            Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
            Write-Host "PR ID: #$($response.pullRequestId)" -ForegroundColor Cyan
            Write-Host "Titel: $($response.title)" -ForegroundColor White
            Write-Host "Status: $($response.status)" -ForegroundColor White
            if ($response.createdBy.displayName) {
                Write-Host "Aangemaakt door: $($response.createdBy.displayName)" -ForegroundColor White
            }
            
            $prUrl = "https://dev.azure.com/bluemonkeys123/AI-training/_git/AI-training-application/pullrequest/$($response.pullRequestId)"
            Write-Host "URL: $prUrl" -ForegroundColor Blue
            
            # Kopieer URL naar clipboard (met error handling)
            try {
                Set-Clipboard -Value $prUrl
                Write-Host "`n📋 URL gekopieerd naar klembord!" -ForegroundColor Green
            }
            catch {
                # Clipboard might not work in alle terminals
            }
            
            Write-Host "🌐 Opening in browser..." -ForegroundColor Yellow
            Start-Process $prUrl
            
            return $response.pullRequestId
        }
        else {
            Write-Host "❌ Onverwacht antwoord van server (geen PR ID ontvangen)" -ForegroundColor Red
            Write-Host "Response:" -ForegroundColor Gray
            $response | ConvertTo-Json -Depth 5 | Write-Host -ForegroundColor Gray
        }
    }
    catch {
        Write-Host "`n❌ Fout bij aanmaken PR!" -ForegroundColor Red
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Red
        
        # Re-enable progress bar
        $ProgressPreference = 'Continue'
        
        # Probeer de error response te parsen
        $errorMessage = $_.Exception.Message
        $errorDetails = $null
        
        if ($_.ErrorDetails -and $_.ErrorDetails.Message) {
            try {
                $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
                $errorMessage = $errorDetails.message
                
                # Azure DevOps specific error message parsing
                if ($errorDetails.typeKey) {
                    $errorMessage = "$($errorDetails.typeKey): $errorMessage"
                }
            }
            catch {
                $errorMessage = $_.ErrorDetails.Message
            }
        }
        
        Write-Host "Foutmelding: $errorMessage" -ForegroundColor Red
        
        # Specifieke error handling
        if ($errorMessage -match "TF401027|already exists") {
            Write-Host "`nℹ️  Er bestaat al een PR voor deze branch!" -ForegroundColor Yellow
            Write-Host "Check: https://dev.azure.com/bluemonkeys123/AI-training/_git/AI-training-application/pullrequests?_a=active" -ForegroundColor Cyan
            
            # Open de PR lijst
            Start-Process "https://dev.azure.com/bluemonkeys123/AI-training/_git/AI-training-application/pullrequests?_a=active"
        }
        elseif ($errorMessage -match "TF401019|401|Unauthorized|Access Denied") {
            Write-Host "`n⚠️  Authenticatie probleem!" -ForegroundColor Yellow
            Write-Host "Het PAT token is waarschijnlijk:" -ForegroundColor White
            Write-Host "1. Verlopen" -ForegroundColor White
            Write-Host "2. Heeft niet de juiste rechten (Code Read & Write + Pull Request Read & Write)" -ForegroundColor White
            Write-Host "3. Is niet correct gekopieerd" -ForegroundColor White
            Write-Host "`nMaak een nieuw token aan via:" -ForegroundColor Yellow
            Write-Host "https://dev.azure.com/bluemonkeys123/_usersSettings/tokens" -ForegroundColor Cyan
            Write-Host "`nZorg dat je het VOLLEDIGE token kopieert en update het bovenaan dit script!" -ForegroundColor Yellow
        }
        elseif ($errorMessage -match "TF200016|not found") {
            Write-Host "`n⚠️  Branch niet gevonden op remote!" -ForegroundColor Yellow
            Write-Host "Push eerst je branch: git push -u origin $currentBranch" -ForegroundColor White
        }
        elseif ($errorMessage -match "TF400948") {
            Write-Host "`n⚠️  Geen verschillen tussen branches!" -ForegroundColor Yellow
            Write-Host "Er zijn geen changes tussen $currentBranch en main" -ForegroundColor White
        }
        elseif ($errorMessage -match "GitRepositoryNotFoundException") {
            Write-Host "`n⚠️  Repository niet gevonden!" -ForegroundColor Yellow
            Write-Host "Check of 'AI-training-application' de correcte repository naam is" -ForegroundColor White
        }
        else {
            # Toon raw response voor debugging
            if ($_.Exception.Response) {
                try {
                    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                    $reader.BaseStream.Position = 0
                    $reader.DiscardBufferedData()
                    $responseBody = $reader.ReadToEnd()
                    Write-Host "`nServer response:" -ForegroundColor Gray
                    
                    # Probeer JSON te parsen voor betere leesbaarheid
                    try {
                        $jsonResponse = $responseBody | ConvertFrom-Json
                        $jsonResponse | ConvertTo-Json -Depth 5 | Write-Host -ForegroundColor Gray
                    }
                    catch {
                        Write-Host $responseBody -ForegroundColor Gray
                    }
                }
                catch {
                    Write-Host "Kon server response niet lezen" -ForegroundColor Gray
                }
            }
        }
        
        Write-Host "`n💡 Troubleshooting tips:" -ForegroundColor Yellow
        Write-Host "1. Test het token met: .\auto-pr.ps1 -TestConnection" -ForegroundColor White
        Write-Host "2. Check of de repository naam 'AI-training-application' correct is" -ForegroundColor White
        Write-Host "3. Bekijk bestaande PRs met: .\auto-pr.ps1 -ListPRs" -ForegroundColor White
        Write-Host "4. Probeer handmatig een PR aan te maken via de browser" -ForegroundColor White
    }
}

# Test connectie functie
function Test-AzureDevOpsConnection {
    param([switch]$Silent)
    
    if (-not $Silent) {
        Write-Host "`n🔍 Test Azure DevOps Connectie" -ForegroundColor Yellow
        Write-Host "================================" -ForegroundColor Cyan
        Write-Host "Token: $($GLOBAL_PAT_TOKEN.Substring(0,10))..." -ForegroundColor Gray
    }
    
    $PAT = $GLOBAL_PAT_TOKEN
    $base64AuthInfo = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes(":$PAT"))
    $headers = @{
        Authorization  = "Basic $base64AuthInfo"
        "Content-Type" = "application/json"
    }
    
    # Test API endpoints
    $tests = @(
        @{
            Name = "Repository Access"
            Uri  = "https://dev.azure.com/bluemonkeys123/AI-training/_apis/git/repositories/AI-training-application?api-version=7.1-preview.1"
        },
        @{
            Name = "Pull Requests Access"
            Uri  = "https://dev.azure.com/bluemonkeys123/AI-training/_apis/git/repositories/AI-training-application/pullrequests?searchCriteria.status=all&`$top=1&api-version=7.1-preview.1"
        }
    )
    
    $allSuccess = $true
    
    foreach ($test in $tests) {
        if (-not $Silent) {
            Write-Host "`nTest: $($test.Name)" -ForegroundColor Cyan
        }
        
        try {
            $ProgressPreference = 'SilentlyContinue'
            $response = Invoke-RestMethod -Uri $test.Uri -Method GET -Headers $headers -ErrorAction Stop
            $ProgressPreference = 'Continue'
            
            if (-not $Silent) {
                Write-Host "✅ $($test.Name): Succesvol" -ForegroundColor Green
                if ($test.Name -eq "Repository Access" -and $response.name) {
                    Write-Host "   Repository: $($response.name)" -ForegroundColor Gray
                    Write-Host "   Project: $($response.project.name)" -ForegroundColor Gray
                }
            }
        }
        catch {
            $ProgressPreference = 'Continue'
            $allSuccess = $false
            if (-not $Silent) {
                Write-Host "❌ $($test.Name): Mislukt" -ForegroundColor Red
                
                # Parse error details
                if ($_.ErrorDetails.Message) {
                    try {
                        $errorObj = $_.ErrorDetails.Message | ConvertFrom-Json
                        Write-Host "   Error: $($errorObj.message)" -ForegroundColor Red
                    }
                    catch {
                        Write-Host "   Error: $_" -ForegroundColor Red
                    }
                }
                else {
                    Write-Host "   Error: $_" -ForegroundColor Red
                }
            }
        }
    }
    
    if (-not $Silent) {
        if ($allSuccess) {
            Write-Host "`n✅ Alle tests succesvol! Token werkt correct." -ForegroundColor Green
        }
        else {
            Write-Host "`n❌ Een of meer tests mislukt. Check je PAT token." -ForegroundColor Red
            Write-Host "Maak een nieuw token aan met:" -ForegroundColor Yellow
            Write-Host "- Code: Read & Write" -ForegroundColor White
            Write-Host "- Pull Request: Read & Write" -ForegroundColor White
            Write-Host "Via: https://dev.azure.com/bluemonkeys123/_usersSettings/tokens" -ForegroundColor Cyan
        }
    }
    
    return $allSuccess
}

# Lijst bestaande PRs
function Get-ExistingPRs {
    Write-Host "`n📋 Bestaande Pull Requests" -ForegroundColor Yellow
    Write-Host "===========================" -ForegroundColor Cyan
    
    $PAT = $GLOBAL_PAT_TOKEN
    $base64AuthInfo = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes(":$PAT"))
    $headers = @{
        Authorization  = "Basic $base64AuthInfo"
        "Content-Type" = "application/json"
    }
    
    $uri = "https://dev.azure.com/bluemonkeys123/AI-training/_apis/git/repositories/AI-training-application/pullrequests?searchCriteria.status=active&api-version=7.1-preview.1"
    
    try {
        $ProgressPreference = 'SilentlyContinue'
        $response = Invoke-RestMethod -Uri $uri -Method GET -Headers $headers -ErrorAction Stop
        $ProgressPreference = 'Continue'
        
        if ($response.count -eq 0) {
            Write-Host "`nGeen open PRs gevonden" -ForegroundColor Gray
        }
        else {
            Write-Host "`n$($response.count) Open PR(s) gevonden:" -ForegroundColor Green
            Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
            
            foreach ($pr in $response.value) {
                $sourceBranch = $pr.sourceRefName -replace 'refs/heads/', ''
                $targetBranch = $pr.targetRefName -replace 'refs/heads/', ''
                
                Write-Host "`n  PR #$($pr.pullRequestId): $($pr.title)" -ForegroundColor Cyan
                Write-Host "  $sourceBranch → $targetBranch" -ForegroundColor White
                Write-Host "  Status: $($pr.status)" -ForegroundColor Gray
                Write-Host "  Door: $($pr.createdBy.displayName)" -ForegroundColor Gray
                Write-Host "  URL: https://dev.azure.com/bluemonkeys123/AI-training/_git/AI-training-application/pullrequest/$($pr.pullRequestId)" -ForegroundColor Blue
            }
            Write-Host ""
        }
    }
    catch {
        $ProgressPreference = 'Continue'
        Write-Host "❌ Kon PRs niet ophalen: $_" -ForegroundColor Red
    }
}

# Main execution
if ($TestConnection) {
    Test-AzureDevOpsConnection
}
elseif ($ListPRs) {
    Get-ExistingPRs
}
else {
    # Check eerst snel of token werkt
    Write-Host "🔐 Token check..." -ForegroundColor Gray
    if (Test-AzureDevOpsConnection -Silent) {
        Write-Host "✅ Token OK" -ForegroundColor Green
        New-AzureDevOpsPR
    }
    else {
        Write-Host "❌ Token probleem!" -ForegroundColor Red
        Write-Host "`nWil je toch doorgaan? (j/n)" -ForegroundColor Yellow
        if ((Read-Host) -eq 'j') {
            New-AzureDevOpsPR
        }
        else {
            Write-Host "`nTroubleshooting opties:" -ForegroundColor Yellow
            Write-Host "1. Test je connectie: .\auto-pr.ps1 -TestConnection" -ForegroundColor White
            Write-Host "2. Bekijk bestaande PRs: .\auto-pr.ps1 -ListPRs" -ForegroundColor White
            Write-Host "3. Maak een nieuw PAT token via:" -ForegroundColor White
            Write-Host "   https://dev.azure.com/bluemonkeys123/_usersSettings/tokens" -ForegroundColor Cyan
        }
    }
}