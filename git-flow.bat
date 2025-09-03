@echo off
REM Git Flow Helper voor LunchMonkeys
REM Gebruik: git-flow.bat [commando]

if "%1"=="" goto menu

if "%1"=="status" goto status
if "%1"=="commit" goto commit
if "%1"=="push" goto push
if "%1"=="pull" goto pull
if "%1"=="branch" goto branch
if "%1"=="sync" goto sync

echo Onbekend commando: %1
goto help

:menu
echo.
echo ===== GIT FLOW HELPER =====
echo.
echo Gebruik: git-flow.bat [commando]
echo.
echo Beschikbare commando's:
echo   status  - Toon git status
echo   commit  - Stage en commit alle wijzigingen
echo   push    - Push naar remote
echo   pull    - Pull van remote
echo   branch  - Maak nieuwe branch
echo   sync    - Sync met main branch
echo.
echo Of gebruik de PowerShell scripts:
echo   .\git-helper.ps1      - Volledig interactief menu
echo   .\quick-commit.ps1    - Snel committen en pushen
echo.
goto end

:status
echo.
echo === Git Status ===
git status
goto end

:commit
echo.
echo === Quick Commit ===
git status --short
echo.
set /p message="Commit bericht: "
if "%message%"=="" (
    echo Commit geannuleerd - geen bericht opgegeven
    goto end
)
git add .
git commit -m "%message%"
echo.
echo Commit succesvol!
set /p dopush="Direct pushen? (j/n): "
if "%dopush%"=="j" goto push
goto end

:push
echo.
echo === Push naar Remote ===
for /f "tokens=*" %%i in ('git rev-parse --abbrev-ref HEAD') do set branch=%%i
echo Pushen naar origin/%branch%...
git push origin %branch%
if errorlevel 1 (
    echo Push mislukt!
) else (
    echo Push succesvol!
    if not "%branch%"=="main" (
        echo.
        echo Pull Request aanmaken:
        echo https://dev.azure.com/bluemonkeys123/AI-training/_git/AI-training-application/pullrequestcreate?sourceRef=%branch%^&targetRef=main
    )
)
goto end

:pull
echo.
echo === Pull van Remote ===
for /f "tokens=*" %%i in ('git rev-parse --abbrev-ref HEAD') do set branch=%%i
echo Pullen van origin/%branch%...
git pull origin %branch%
goto end

:branch
echo.
echo === Nieuwe Branch ===
set /p branchname="Naam voor nieuwe branch: "
if "%branchname%"=="" (
    echo Branch aanmaken geannuleerd
    goto end
)
git checkout -b %branchname%
echo Branch '%branchname%' aangemaakt en geswitcht!
goto end

:sync
echo.
echo === Sync met Main ===
for /f "tokens=*" %%i in ('git rev-parse --abbrev-ref HEAD') do set branch=%%i
echo Huidige branch: %branch%
echo.
echo Fetchen van main...
git fetch origin main
echo.
set /p mergetype="Merge (m) of Rebase (r) met main? (m/r): "
if "%mergetype%"=="r" (
    git rebase origin/main
) else (
    git merge origin/main
)
goto end

:help
echo.
echo Gebruik: git-flow.bat [commando]
echo.
echo Beschikbare commando's:
echo   status  - Toon git status
echo   commit  - Stage en commit alle wijzigingen
echo   push    - Push naar remote
echo   pull    - Pull van remote  
echo   branch  - Maak nieuwe branch
echo   sync    - Sync met main branch
goto end

:end
echo.

