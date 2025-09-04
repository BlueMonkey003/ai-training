# Database Migraties

## 🚀 Productie Database Migratie

### Voor Render.com Deployment:

1. **Lokaal de migratie testen:**
   ```bash
   cd backend
   npm run migrate:isactive
   ```

2. **Voor productie op Render.com:**
   
   **Optie A: Via Render Shell (Aanbevolen)**
   - Ga naar je backend service op Render.com
   - Klik op "Shell" tab
   - Run:
     ```bash
     cd backend
     npm run migrate:isactive
     ```

   **Optie B: Lokaal met productie .env:**
   - Maak een `.env` bestand in de backend folder
   - Kopieer je productie MONGO_URI
   - Run: `npm run migrate:isactive`
   - **BELANGRIJK:** Verwijder de .env file na gebruik!

### Beschikbare Migraties:

| Script | Beschrijving | Command |
|--------|--------------|---------|
| migrate:isactive | Voegt `isActive` field toe aan alle users | `npm run migrate:isactive` |

## 🔄 Nieuwe Migratie Toevoegen:

1. Maak een nieuw script in `backend/src/scripts/`:
   ```typescript
   // migrate-[beschrijving].ts
   ```

2. Voeg toe aan `backend/package.json`:
   ```json
   "migrate:[naam]": "NODE_ENV=production ts-node src/scripts/migrate-[naam].ts"
   ```

3. Test lokaal eerst!

## ⚡ Automatische Migraties (Toekomst):

Voor automatische migraties bij deployment, voeg toe aan je Render.com build command:
```bash
npm install && npm run build && npm run migrate:isactive
```

**Let op:** Dit runt de migratie bij ELKE deployment. Voor productie is het beter om migraties handmatig te runnen.

## 📊 Database Schema Versioning:

Het is aan te raden om een schema versie collection toe te voegen:
```javascript
{
  _id: "schema_version",
  version: 1,
  lastMigration: "add-isactive",
  migrationDate: new Date()
}
```

Dit helpt bij het bijhouden welke migraties al zijn uitgevoerd.
