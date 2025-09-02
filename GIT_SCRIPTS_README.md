# Git Scripts voor LunchMonkeys

Deze map bevat handige scripts om te werken met Git en Azure DevOps.

## 🚀 Beschikbare Scripts

### 1. **git-helper.ps1** (PowerShell - Volledig Menu)
Een interactief menu-gestuurd script met alle Git functionaliteiten.

**Gebruik:**
```powershell
.\git-helper.ps1
```

**Features:**
- Git status bekijken
- Branches aanmaken en wisselen
- Committen met interactieve file selectie
- Push/Pull operaties
- Pull Request links genereren
- Sync met main branch
- Stash management
- Git log bekijken

### 2. **quick-commit.ps1** (PowerShell - Snel Committen)
Voor snelle commits en pushes.

**Gebruik:**
```powershell
# Interactief
.\quick-commit.ps1

# Met commit message
.\quick-commit.ps1 "feat: nieuwe feature toegevoegd"
```

### 3. **git-flow.bat** (Batch - Basis Commando's)
Simpel batch script voor basis Git operaties.

**Gebruik:**
```batch
# Toon help
git-flow.bat

# Specifiek commando
git-flow.bat status
git-flow.bat commit
git-flow.bat push
git-flow.bat pull
git-flow.bat branch
git-flow.bat sync
```

## 📋 Typische Workflows

### Nieuwe Feature Ontwikkelen
1. Maak nieuwe branch: `.\git-helper.ps1` → Optie 2
2. Ontwikkel je feature
3. Commit changes: `.\quick-commit.ps1 "feat: beschrijving"`
4. Push naar remote: Script vraagt automatisch
5. Maak Pull Request via gegenereerde link

### Dagelijks Werk
```powershell
# Check status
git-flow.bat status

# Quick commit en push
.\quick-commit.ps1 "fix: bug opgelost"
```

### Sync met Main Branch
```powershell
# Via menu
.\git-helper.ps1 → Optie 9

# Via batch
git-flow.bat sync
```

## 🔗 Azure DevOps Links

- **Repository**: https://dev.azure.com/bluemonkeys123/AI-training/_git/AI-training-application
- **Pull Requests**: https://dev.azure.com/bluemonkeys123/AI-training/_git/AI-training-application/pullrequests
- **Branches**: https://dev.azure.com/bluemonkeys123/AI-training/_git/AI-training-application/branches

## 💡 Tips

1. **PowerShell Execution Policy**: Als je een foutmelding krijgt, run:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

2. **Commit Messages**: Gebruik conventional commits:
   - `feat:` voor nieuwe features
   - `fix:` voor bug fixes
   - `docs:` voor documentatie
   - `style:` voor styling changes
   - `refactor:` voor code refactoring
   - `test:` voor tests
   - `chore:` voor onderhoud

3. **Branch Naming**: Gebruik duidelijke branch namen:
   - `feature/beschrijving`
   - `bugfix/beschrijving`
   - `hotfix/beschrijving`

## 🛠️ Script Aanpassen

Voel je vrij om de scripts aan te passen naar je eigen workflow. Ze staan in:
- `git-helper.ps1`
- `quick-commit.ps1`
- `git-flow.bat`
