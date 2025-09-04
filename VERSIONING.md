# 🔢 Versioning System

Dit project gebruikt een intelligent automatisch versioning systeem dat de versie verhoogt op basis van het type wijziging.

## 📋 Versie Formaat

We gebruiken Semantic Versioning: `MAJOR.MINOR.PATCH`

- **MAJOR** (1.0.0): Breaking changes
- **MINOR** (0.1.0): Nieuwe features
- **PATCH** (0.0.1): Bug fixes

Daarnaast houden we een build nummer bij voor elke deployment.

## 🤖 Automatische Versie Updates

### Branch-based Detection

Het systeem detecteert automatisch het type wijziging op basis van de branch naam:

| Branch Pattern | Type | Versie Impact | Voorbeeld |
|----------------|------|---------------|-----------|
| `feature/*` | Feature | Minor (+0.1.0) | feature/user-management → 1.2.0 → 1.3.0 |
| `feat/*` | Feature | Minor (+0.1.0) | feat/dark-mode → 1.2.0 → 1.3.0 |
| `bugfix/*` | Bug Fix | Patch (+0.0.1) | bugfix/login-error → 1.2.0 → 1.2.1 |
| `hotfix/*` | Hotfix | Patch (+0.0.1) | hotfix/security-issue → 1.2.0 → 1.2.1 |
| `fix/*` | Fix | Patch (+0.0.1) | fix/typo → 1.2.0 → 1.2.1 |
| `major/*` | Major | Major (+1.0.0) | major/api-v2 → 1.2.0 → 2.0.0 |
| `breaking/*` | Breaking | Major (+1.0.0) | breaking/auth-system → 1.2.0 → 2.0.0 |

### Commit Message Detection

Voor directe commits op main, detecteert het systeem het type uit de commit message:

| Commit Pattern | Type | Versie Impact |
|----------------|------|---------------|
| `feat: ...` | Feature | Minor (+0.1.0) |
| `fix: ...` | Bug Fix | Patch (+0.0.1) |
| `breaking: ...` | Breaking | Major (+1.0.0) |
| `BREAKING CHANGE:` | Breaking | Major (+1.0.0) |

### Conventional Commits

We ondersteunen [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Types:
- `feat`: Nieuwe feature (Minor)
- `fix`: Bug fix (Patch)
- `docs`: Documentatie (geen versie bump)
- `style`: Code style (geen versie bump)
- `refactor`: Refactoring (geen versie bump)
- `test`: Tests (geen versie bump)
- `chore`: Onderhoud (geen versie bump)

## 📝 Pull Request Titels

Bij het maken van een PR via `auto-pr.ps1`, wordt automatisch het juiste format gebruikt:

```
🔧 fix: login validatie probleem opgelost
✨ feat: dark mode toegevoegd
📝 chore: dependencies updated
```

## 🏭 Pipeline Integration

De Azure DevOps pipeline:
1. Detecteert automatisch het change type
2. Verhoogt de juiste versie component
3. Update `version.json` en `package.json` files
4. Commit de wijzigingen met `[skip ci]` tag
5. Mirrort naar GitHub

## 🛠️ Handmatig Versie Bumpen

Voor lokaal testen of handmatige bumps:

```powershell
# Auto-detect type
.\scripts\smart-version-bump.ps1

# Specifiek type
.\scripts\smart-version-bump.ps1 -Type minor

# Dry run (geen wijzigingen)
.\scripts\smart-version-bump.ps1 -DryRun

# Met branch naam
.\scripts\smart-version-bump.ps1 -BranchName "feature/new-stuff"

# Met commit message
.\scripts\smart-version-bump.ps1 -CommitMessage "feat: added new feature"
```

## 📊 Version File

Het `version.json` bestand bevat:

```json
{
    "version": "1.2.3",
    "lastUpdated": "2025-01-09",
    "buildNumber": 45
}
```

## 🔍 Versie Informatie

De huidige versie is zichtbaar op:
- Settings page in de app
- `/api/health` endpoint
- `version.json` in de repository

## 📌 Best Practices

1. **Gebruik descriptieve branch namen**: `feature/user-authentication` ipv `feature/auth`
2. **Volg conventional commits**: `feat: add user authentication` ipv `added auth`
3. **Major changes**: Gebruik `breaking/` branch prefix of voeg `BREAKING CHANGE:` toe aan commit
4. **Hotfixes**: Gebruik altijd `hotfix/` prefix voor urgente productie fixes

## 🚀 Voorbeeld Workflow

1. **Nieuwe Feature**:
   ```bash
   git checkout -b feature/dark-mode
   # ... werk aan feature ...
   .\auto-pr.ps1  # Maakt PR met titel: "✨ feat: Dark Mode"
   # Na merge: versie gaat van 1.2.0 → 1.3.0
   ```

2. **Bug Fix**:
   ```bash
   git checkout -b bugfix/login-validation
   # ... fix de bug ...
   .\auto-pr.ps1  # Maakt PR met titel: "🐛 fix: Login Validation"
   # Na merge: versie gaat van 1.3.0 → 1.3.1
   ```

3. **Direct op Main** (niet aanbevolen):
   ```bash
   git commit -m "fix: typo in error message"
   git push
   # Pipeline detecteert 'fix:' → versie gaat van 1.3.1 → 1.3.2
   ```
