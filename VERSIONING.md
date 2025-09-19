# 🔢 Versioning & Release Notes

Dit project gebruikt pipeline-gestuurd versiebeheer en een expliciet release-notesbeleid. De versie wordt verhoogd op basis van het type wijziging en `version.json` is de bron voor versie/build en recente wijzigingen.

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

`lunchmonkeys/version.json` is de enige bron voor versie, build en release notes die in de app getoond worden.

Schema:

```json
{
  "version": "1.7.1",
  "lastUpdated": "2025-09-19",
  "buildNumber": 13,
  "recentCommits": [
    { "date": "YYYY-MM-DD", "message": "..." }
  ]
}
```

Regels:
- `recentCommits` bevat maximaal 5 items; nieuwste bovenaan.
- De frontend toont de laatste 3 bullets (nieuwste eerst) op de Over/Instellingen pagina.
- Pipelines overschrijven `recentCommits` NIET; de bullets blijven leidend voor app en PR-tekst.

## 🔍 Versie Informatie

De huidige versie is zichtbaar op:
- Settings page in de app
- `/api/health` endpoint
- `version.json` in de repository

## 📝 Release Notes Flow

Ontwikkelaars onderhouden de bullets in `version.json` en PR-beschrijvingen zijn hiermee in sync.

- Optie 3 (commit) in `git-helper.ps1`:
  - Vraagt of release notes + PR gewenst zijn.
  - Bij ‘ja’: vraagt bullets → schrijft `recentCommits` (max 5, nieuwste bovenaan) → commit code + `version.json` → push → maakt PR met dezelfde bullets.
  - Bij ‘nee’: alleen commit.
- Optie 4 (push) in `git-helper.ps1`:
  - Checkt uncommitted changes; zo ja, eerst committen.
  - Vraagt of push voor deployment is; bij ‘ja’ idem bullets-flow als boven, anders alleen push.
- `auto-pr.ps1`:
  - Haalt indien mogelijk bullets van vandaag uit `version.json`; anders vraagt om bullets, schrijft terug (max 5) en commit.
  - PR-beschrijving bevat hetzelfde bulletblok (tussen markers) als in de app.

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
