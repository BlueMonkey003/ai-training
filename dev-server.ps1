# Development Server Manager voor LunchMonkeys
# Gebruik: .\dev-server.ps1

$script:backendProcess = $null
$script:frontendProcess = $null

# Kleuren voor output
function Write-Success { Write-Host $args[0] -ForegroundColor Green }
function Write-Error { Write-Host $args[0] -ForegroundColor Red }
function Write-Info { Write-Host $args[0] -ForegroundColor Cyan }
function Write-Warning { Write-Host $args[0] -ForegroundColor Yellow }

function Show-Menu {
    Clear-Host
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "    LUNCHMONKEYS DEVELOPMENT SERVER    " -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Info "Status:"
    Show-RunningServers
    Write-Host ""
    Write-Host "1. Start Backend (Port 10000)" -ForegroundColor Green
    Write-Host "2. Start Frontend (Port 5173)" -ForegroundColor Green
    Write-Host "3. Start Beide Servers" -ForegroundColor Green
    Write-Host "4. Stop Backend" -ForegroundColor Yellow
    Write-Host "5. Stop Frontend" -ForegroundColor Yellow
    Write-Host "6. Stop Alle Servers" -ForegroundColor Yellow
    Write-Host "7. Restart Backend" -ForegroundColor Blue
    Write-Host "8. Restart Frontend" -ForegroundColor Blue
    Write-Host "9. Kill ALLE Node.js Processen (WAARSCHUWING!)" -ForegroundColor Red
    Write-Host "10. Toon Logs" -ForegroundColor Magenta
    Write-Host "11. Open in Browser" -ForegroundColor Cyan
    Write-Host "12. Maak .env.development bestanden" -ForegroundColor Magenta
    Write-Host "13. Install Dependencies" -ForegroundColor Magenta
    Write-Host "14. Git Status" -ForegroundColor Cyan
    Write-Host "0. Exit" -ForegroundColor Red
    Write-Host ""
}

function Show-RunningServers {
    # Check backend
    $backendRunning = Test-NetConnection -ComputerName localhost -Port 10000 -WarningAction SilentlyContinue -InformationLevel Quiet
    if ($backendRunning) {
        Write-Success "✓ Backend draait op http://localhost:10000"
    }
    else {
        Write-Error "✗ Backend is niet actief"
    }
    
    # Check frontend op beide mogelijke poorten
    $frontend5173 = Test-NetConnection -ComputerName localhost -Port 5173 -WarningAction SilentlyContinue -InformationLevel Quiet
    $frontend5174 = Test-NetConnection -ComputerName localhost -Port 5174 -WarningAction SilentlyContinue -InformationLevel Quiet
    
    if ($frontend5173) {
        Write-Success "✓ Frontend draait op http://localhost:5173"
    }
    elseif ($frontend5174) {
        Write-Success "✓ Frontend draait op http://localhost:5174 (fallback port)"
    }
    else {
        Write-Error "✗ Frontend is niet actief"
    }
    
    # Toon Node.js processen
    $nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
    if ($nodeProcesses) {
        Write-Info "`nActieve Node.js processen: $($nodeProcesses.Count)"
        $nodeProcesses | ForEach-Object {
            $ports = Get-NetTCPConnection -OwningProcess $_.Id -State Listen -ErrorAction SilentlyContinue | 
            Select-Object -ExpandProperty LocalPort -Unique
            if ($ports) {
                Write-Host "  PID: $($_.Id) - Poorten: $($ports -join ', ')"
            }
        }
    }
}

function Start-Backend {
    Write-Info "`nBackend starten..."
    
    # Check of backend al draait
    $backendRunning = Test-NetConnection -ComputerName localhost -Port 10000 -WarningAction SilentlyContinue -InformationLevel Quiet
    if ($backendRunning) {
        Write-Warning "Backend draait al op poort 10000!"
        return
    }
    
    # Start backend in nieuwe terminal
    $backendPath = Join-Path $PSScriptRoot "backend"
    
    # Check of node_modules bestaat
    if (-not (Test-Path "$backendPath\node_modules")) {
        Write-Warning "Backend dependencies ontbreken. Installeren..."
        Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; npm install; npm run dev" -Wait
    }
    else {
        Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host 'BACKEND SERVER' -ForegroundColor Yellow; Write-Host '==============' -ForegroundColor Yellow; npm run dev"
    }
    
    Write-Info "Backend wordt opgestart..."
    Start-Sleep -Seconds 3
    
    # Verifieer dat het draait
    $retries = 10
    while ($retries -gt 0) {
        if (Test-NetConnection -ComputerName localhost -Port 10000 -WarningAction SilentlyContinue -InformationLevel Quiet) {
            Write-Success "Backend succesvol gestart op http://localhost:10000"
            Write-Success "Swagger docs: http://localhost:10000/api-docs"
            break
        }
        $retries--
        Start-Sleep -Seconds 1
    }
    
    if ($retries -eq 0) {
        Write-Error "Backend start mogelijk mislukt. Check de terminal voor errors."
    }
}

function Start-Frontend {
    Write-Info "`nFrontend starten..."
    
    # Check of frontend al draait op een van de poorten
    $frontend5173 = Test-NetConnection -ComputerName localhost -Port 5173 -WarningAction SilentlyContinue -InformationLevel Quiet
    $frontend5174 = Test-NetConnection -ComputerName localhost -Port 5174 -WarningAction SilentlyContinue -InformationLevel Quiet
    
    if ($frontend5173) {
        Write-Warning "Frontend draait al op poort 5173!"
        return
    }
    if ($frontend5174) {
        Write-Warning "Frontend draait al op poort 5174!"
        return
    }
    
    # Start frontend in nieuwe terminal
    $frontendPath = Join-Path $PSScriptRoot "frontend"
    
    # Check of node_modules bestaat
    if (-not (Test-Path "$frontendPath\node_modules")) {
        Write-Warning "Frontend dependencies ontbreken. Installeren..."
        Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npm install; npm run dev" -Wait
    }
    else {
        Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; Write-Host 'FRONTEND SERVER' -ForegroundColor Cyan; Write-Host '===============' -ForegroundColor Cyan; npm run dev"
    }
    
    Write-Info "Frontend wordt opgestart..."
    Start-Sleep -Seconds 3
    
    # Verifieer dat het draait (check beide poorten)
    $retries = 10
    while ($retries -gt 0) {
        if (Test-NetConnection -ComputerName localhost -Port 5173 -WarningAction SilentlyContinue -InformationLevel Quiet) {
            Write-Success "Frontend succesvol gestart op http://localhost:5173"
            break
        }
        elseif (Test-NetConnection -ComputerName localhost -Port 5174 -WarningAction SilentlyContinue -InformationLevel Quiet) {
            Write-Success "Frontend succesvol gestart op http://localhost:5174 (fallback)"
            Write-Warning "Let op: Frontend draait op fallback poort 5174. Mogelijk draait er al iets op 5173."
            break
        }
        $retries--
        Start-Sleep -Seconds 1
    }
    
    if ($retries -eq 0) {
        Write-Error "Frontend start mogelijk mislukt. Check de terminal voor errors."
    }
}

function Stop-Backend {
    Write-Info "`nBackend stoppen..."
    
    # Vind Node proces op poort 10000
    $connections = Get-NetTCPConnection -LocalPort 10000 -State Listen -ErrorAction SilentlyContinue
    if ($connections) {
        $connections | ForEach-Object {
            Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
        }
        Write-Success "Backend gestopt"
    }
    else {
        Write-Warning "Backend was niet actief"
    }
}

function Stop-Frontend {
    Write-Info "`nFrontend stoppen..."
    
    # Vind Node proces op poort 5173 of 5174
    $stopped = $false
    
    $connections5173 = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue
    if ($connections5173) {
        $connections5173 | ForEach-Object {
            Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
        }
        Write-Success "Frontend gestopt (poort 5173)"
        $stopped = $true
    }
    
    $connections5174 = Get-NetTCPConnection -LocalPort 5174 -State Listen -ErrorAction SilentlyContinue
    if ($connections5174) {
        $connections5174 | ForEach-Object {
            Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
        }
        Write-Success "Frontend gestopt (poort 5174)"
        $stopped = $true
    }
    
    if (-not $stopped) {
        Write-Warning "Frontend was niet actief"
    }
}

function Kill-AllNode {
    Write-Warning "`n⚠️  WAARSCHUWING: ALLE Node.js processen worden gestopt!"
    Write-Warning "Dit zal ook andere Node.js applicaties stoppen die mogelijk draaien:"
    
    # Toon huidige Node processen
    $nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
    if ($nodeProcesses) {
        Write-Info "`nActieve Node.js processen die gestopt zullen worden:"
        $nodeProcesses | ForEach-Object {
            $ports = Get-NetTCPConnection -OwningProcess $_.Id -State Listen -ErrorAction SilentlyContinue | 
            Select-Object -ExpandProperty LocalPort -Unique
            Write-Host "  - PID: $($_.Id) | Memory: $([math]::Round($_.WorkingSet64/1MB))MB | Ports: $($ports -join ', ')"
        }
        
        Write-Host "`nGevolgen:" -ForegroundColor Yellow
        Write-Host "- Alle development servers stoppen" -ForegroundColor Yellow
        Write-Host "- Andere Node.js apps (VS Code extensions, npm scripts, etc.) stoppen" -ForegroundColor Yellow
        Write-Host "- Je moet servers handmatig herstarten" -ForegroundColor Yellow
    }
    else {
        Write-Info "Geen actieve Node.js processen gevonden."
        return
    }
    
    $confirm = Read-Host "`nWeet je het zeker? Type 'KILL' om te bevestigen"
    
    if ($confirm -eq 'KILL') {
        Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
        Write-Success "✓ Alle Node.js processen zijn gestopt"
        Write-Info "Tip: Gebruik optie 3 om beide servers weer te starten"
    }
    else {
        Write-Info "Geannuleerd - geen processen gestopt"
    }
}

function Show-Logs {
    Write-Info "`nBeschikbare logs:"
    Write-Host "1. Backend console output"
    Write-Host "2. Frontend console output"
    Write-Host "3. MongoDB connectie test"
    Write-Host "4. Port status"
    Write-Host "5. Check environment variables"
    
    $choice = Read-Host "`nKies een optie"
    
    switch ($choice) {
        '1' {
            Write-Info "`nBackend logs worden getoond in de backend terminal..."
        }
        '2' {
            Write-Info "`nFrontend logs worden getoond in de frontend terminal..."
        }
        '3' {
            Write-Info "`nMongoDB connectie test..."
            $envFile = "$PSScriptRoot\backend\.env.development"
            if (Test-Path $envFile) {
                $mongoUri = Get-Content $envFile | Where-Object { $_ -match "^MONGO_URI=" } | ForEach-Object { $_.Split('=', 2)[1] }
                if ($mongoUri) {
                    Write-Success "MongoDB URI gevonden in .env.development"
                    Write-Info "URI start met: $($mongoUri.Substring(0, [Math]::Min(30, $mongoUri.Length)))..."
                }
                else {
                    Write-Warning "MongoDB URI niet gevonden in .env.development"
                }
            }
            else {
                Write-Error ".env.development bestand niet gevonden in backend folder"
            }
        }
        '4' {
            Write-Info "`nPort status:"
            Write-Host "`nLunchMonkeys poorten:" -ForegroundColor Cyan
            netstat -an | findstr "10000 5173 5174" | findstr "LISTENING"
            
            Write-Host "`nAlle Node.js gerelateerde poorten:" -ForegroundColor Cyan
            $nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
            if ($nodeProcesses) {
                $nodeProcesses | ForEach-Object {
                    $ports = Get-NetTCPConnection -OwningProcess $_.Id -State Listen -ErrorAction SilentlyContinue
                    if ($ports) {
                        $ports | ForEach-Object {
                            Write-Host "Port $($_.LocalPort) - PID $($_.OwningProcess)"
                        }
                    }
                }
            }
        }
        '5' {
            Write-Info "`nEnvironment Variables Check:"
            
            # Backend env
            $backendEnv = "$PSScriptRoot\backend\.env.development"
            if (Test-Path $backendEnv) {
                Write-Success "`nBackend .env.development:"
                Get-Content $backendEnv | Where-Object { $_ -match "^[^#].*=" } | ForEach-Object {
                    $key = $_.Split('=')[0]
                    Write-Host "  ✓ $key configured"
                }
            }
            
            # Frontend env
            $frontendEnv = "$PSScriptRoot\frontend\.env.development"
            if (Test-Path $frontendEnv) {
                Write-Success "`nFrontend .env.development:"
                Get-Content $frontendEnv | Where-Object { $_ -match "^[^#].*=" } | ForEach-Object {
                    Write-Host "  ✓ $_"
                }
            }
        }
    }
}

function Open-InBrowser {
    Write-Info "`nOpen in browser:"
    
    # Check welke poort de frontend gebruikt
    $frontendPort = 5173
    if (Test-NetConnection -ComputerName localhost -Port 5174 -WarningAction SilentlyContinue -InformationLevel Quiet) {
        $frontendPort = 5174
    }
    
    Write-Host "1. Frontend (http://localhost:$frontendPort)"
    Write-Host "2. Backend Swagger (http://localhost:10000/api-docs)"
    Write-Host "3. Beide"
    
    $choice = Read-Host "`nKies een optie"
    
    switch ($choice) {
        '1' { Start-Process "http://localhost:$frontendPort" }
        '2' { Start-Process "http://localhost:10000/api-docs" }
        '3' { 
            Start-Process "http://localhost:$frontendPort"
            Start-Process "http://localhost:10000/api-docs"
        }
    }
}

function Install-Dependencies {
    Write-Info "`nDependencies installeren..."
    
    Write-Host "1. Backend dependencies"
    Write-Host "2. Frontend dependencies"
    Write-Host "3. Beide"
    Write-Host "4. Clean install (verwijder node_modules eerst)"
    
    $choice = Read-Host "`nKies een optie"
    
    switch ($choice) {
        '1' {
            $backendPath = Join-Path $PSScriptRoot "backend"
            Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host 'Installing backend dependencies...' -ForegroundColor Yellow; npm install" -Wait
        }
        '2' {
            $frontendPath = Join-Path $PSScriptRoot "frontend"
            Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; Write-Host 'Installing frontend dependencies...' -ForegroundColor Cyan; npm install" -Wait
        }
        '3' {
            $backendPath = Join-Path $PSScriptRoot "backend"
            $frontendPath = Join-Path $PSScriptRoot "frontend"
            Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host 'Installing backend dependencies...' -ForegroundColor Yellow; npm install"
            Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; Write-Host 'Installing frontend dependencies...' -ForegroundColor Cyan; npm install"
        }
        '4' {
            Write-Warning "Clean install - dit verwijdert node_modules folders"
            $confirm = Read-Host "Weet je het zeker? (j/n)"
            if ($confirm -eq 'j') {
                Write-Info "Removing node_modules..."
                Remove-Item -Path "$PSScriptRoot\backend\node_modules" -Recurse -Force -ErrorAction SilentlyContinue
                Remove-Item -Path "$PSScriptRoot\frontend\node_modules" -Recurse -Force -ErrorAction SilentlyContinue
                Write-Success "node_modules verwijderd. Kies nu optie 3 om beide opnieuw te installeren."
            }
        }
    }
}

function Show-GitStatus {
    Write-Info "`nGit Status:"
    
    # Check git status
    $gitStatus = git status --porcelain 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Geen git repository gevonden"
        return
    }
    
    # Current branch
    $branch = git branch --show-current
    Write-Info "Current branch: $branch"
    
    if ($gitStatus) {
        Write-Warning "`nUncommitted changes:"
        $gitStatus | ForEach-Object {
            $status = $_.Substring(0, 2)
            $file = $_.Substring(3)
            switch ($status.Trim()) {
                'M' { Write-Host "  Modified: $file" -ForegroundColor Yellow }
                'A' { Write-Host "  Added:    $file" -ForegroundColor Green }
                'D' { Write-Host "  Deleted:  $file" -ForegroundColor Red }
                '??' { Write-Host "  Untracked: $file" -ForegroundColor Gray }
                default { Write-Host "  ${status}: $file" }
            }
        }
        
        Write-Host "`nTip: Commit je changes voordat je deployed!" -ForegroundColor Cyan
    }
    else {
        Write-Success "✓ Working directory clean"
    }
    
    # Check remote
    $ahead = git rev-list --count origin/$branch..$branch 2>$null
    $behind = git rev-list --count $branch..origin/$branch 2>$null
    
    if ($ahead -gt 0) {
        Write-Warning "⬆ $ahead commit(s) ahead of origin/$branch - push needed"
    }
    if ($behind -gt 0) {
        Write-Warning "⬇ $behind commit(s) behind origin/$branch - pull needed"
    }
}

function Test-Dependencies {
    Write-Info "`nDependencies controleren..."
    
    # Check Node.js
    try {
        $nodeVersion = node --version
        Write-Success "✓ Node.js $nodeVersion geïnstalleerd"
    }
    catch {
        Write-Error "✗ Node.js niet gevonden"
    }
    
    # Check npm
    try {
        $npmVersion = npm --version
        Write-Success "✓ npm $npmVersion geïnstalleerd"
    }
    catch {
        Write-Error "✗ npm niet gevonden"
    }
    
    # Check backend dependencies
    if (Test-Path "$PSScriptRoot\backend\node_modules") {
        $backendPackages = (Get-ChildItem "$PSScriptRoot\backend\node_modules" -Directory).Count
        Write-Success "✓ Backend dependencies geïnstalleerd ($backendPackages packages)"
    }
    else {
        Write-Warning "✗ Backend dependencies niet gevonden - run 'npm install' in backend folder"
    }
    
    # Check frontend dependencies
    if (Test-Path "$PSScriptRoot\frontend\node_modules") {
        $frontendPackages = (Get-ChildItem "$PSScriptRoot\frontend\node_modules" -Directory).Count
        Write-Success "✓ Frontend dependencies geïnstalleerd ($frontendPackages packages)"
    }
    else {
        Write-Warning "✗ Frontend dependencies niet gevonden - run 'npm install' in frontend folder"
    }
    
    # Check .env.development files
    if (Test-Path "$PSScriptRoot\backend\.env.development") {
        Write-Success "✓ Backend .env.development bestand gevonden"
    }
    else {
        Write-Warning "✗ Backend .env.development bestand niet gevonden"
        Write-Host "  Tip: Gebruik optie 12 om .env.development aan te maken" -ForegroundColor Gray
    }
    
    if (Test-Path "$PSScriptRoot\frontend\.env.development") {
        Write-Success "✓ Frontend .env.development bestand gevonden"
    }
    else {
        Write-Warning "✗ Frontend .env.development bestand niet gevonden"
        Write-Host "  Tip: Gebruik optie 12 om .env.development aan te maken" -ForegroundColor Gray
    }
}

function Create-EnvFiles {
    Write-Info "`n.env.development bestanden aanmaken/controleren..."
    
    # Backend .env.development
    $backendEnvPath = "$PSScriptRoot\backend\.env.development"
    if (-not (Test-Path $backendEnvPath)) {
        Write-Warning "Backend .env.development ontbreekt. Aanmaken..."
        
        # Check if .env exists (production)
        $prodEnvPath = "$PSScriptRoot\backend\.env"
        if (Test-Path $prodEnvPath) {
            Write-Info "Kopiëren van .env naar .env.development..."
            Copy-Item $prodEnvPath $backendEnvPath
            Write-Success "Backend .env.development gekopieerd van .env"
        }
        else {
            $backendEnv = @"
# MongoDB Database
MONGO_URI=mongodb+srv://username:password@cluster0.mongodb.net/lunchmonkeys

# JWT Secret
JWT_SECRET=SuperGeheim123!@#

# Cloudinary Config
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Server Config
PORT=10000
NODE_ENV=development
"@
            $backendEnv | Out-File -FilePath $backendEnvPath -Encoding UTF8
            Write-Success "Backend .env.development aangemaakt!"
            Write-Warning "BELANGRIJK: Vul je eigen MongoDB en Cloudinary credentials in!"
        }
    }
    else {
        Write-Success "Backend .env.development bestaat al"
    }
    
    # Frontend .env.development
    $frontendEnvPath = "$PSScriptRoot\frontend\.env.development"
    if (-not (Test-Path $frontendEnvPath)) {
        Write-Warning "Frontend .env.development ontbreekt. Aanmaken..."
        
        $frontendEnv = @"
# Backend API URL
VITE_API_URL=http://localhost:10000
"@
        $frontendEnv | Out-File -FilePath $frontendEnvPath -Encoding UTF8
        Write-Success "Frontend .env.development aangemaakt!"
    }
    else {
        Write-Success "Frontend .env.development bestaat al"
        # Check if VITE_API_URL is correct
        $content = Get-Content $frontendEnvPath
        if ($content -notmatch "VITE_API_URL=http://localhost:10000") {
            Write-Warning "Let op: VITE_API_URL wijkt af van standaard (http://localhost:10000)"
        }
    }
}

# Main execution
Clear-Host
Write-Host "╔═══════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     LunchMonkeys Development Server Manager    ║" -ForegroundColor Yellow
Write-Host "╚═══════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check dependencies bij start
Test-Dependencies
Write-Host "`nDruk op een toets om door te gaan..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Hoofdloop
do {
    Show-Menu
    $choice = Read-Host "Selecteer een optie"
    
    switch ($choice) {
        '1' { Start-Backend }
        '2' { Start-Frontend }
        '3' { 
            Start-Backend
            Start-Sleep -Seconds 2
            Start-Frontend
        }
        '4' { Stop-Backend }
        '5' { Stop-Frontend }
        '6' { 
            Stop-Backend
            Stop-Frontend
        }
        '7' { 
            Stop-Backend
            Start-Sleep -Seconds 1
            Start-Backend
        }
        '8' { 
            Stop-Frontend
            Start-Sleep -Seconds 1
            Start-Frontend
        }
        '9' { Kill-AllNode }
        '10' { Show-Logs }
        '11' { Open-InBrowser }
        '12' { Create-EnvFiles }
        '13' { Install-Dependencies }
        '14' { Show-GitStatus }
        '0' { 
            Write-Host "`n👋 Tot ziens!" -ForegroundColor Yellow
            Write-Host "Tip: Vergeet niet te committen en pushen!" -ForegroundColor Cyan
            break 
        }
        default { 
            Write-Error "Ongeldige keuze!"
        }
    }
    
    if ($choice -ne '0') {
        Write-Host "`nDruk op een toets om door te gaan..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    }
} while ($choice -ne '0')