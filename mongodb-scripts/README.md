# MongoDB Scripts

Deze folder bevat MongoDB scripts voor database migraties en onderhoud.

## 🚀 Scripts Overzicht

| Script | Beschrijving | Wanneer gebruiken |
|--------|--------------|-------------------|
| `add-isactive-field.js` | Voegt `isActive` field toe aan alle users | Bij deployment van user management feature |
| `verify-users.js` | Controleert data integriteit van users | Na migraties of bij problemen |
| `rollback-isactive.js` | Verwijdert isActive field (rollback) | Alleen bij problemen met migratie |

## 📋 Hoe te gebruiken

### Optie 1: MongoDB Atlas (Aanbevolen voor productie)

1. Login op [MongoDB Atlas](https://cloud.mongodb.com)
2. Ga naar je cluster
3. Klik op **"Browse Collections"**
4. Selecteer de juiste database:
   - `lunchmonkeys-prod` voor productie
   - `lunchmonkeys` voor development
5. Klik op de **"Shell"** tab onderaan
6. Kopieer en plak het script
7. Druk Enter om uit te voeren

### Optie 2: MongoDB Compass

1. Open MongoDB Compass
2. Connect met je database
3. Selecteer de juiste database
4. Open **">_MONGOSH"** onderaan
5. Plak het script en run

### Optie 3: Command Line (mongosh)

```bash
# Voor productie
mongosh "mongodb+srv://username:password@cluster.mongodb.net/lunchmonkeys-prod" < add-isactive-field.js

# Voor development
mongosh "mongodb://localhost:27017/lunchmonkeys" < add-isactive-field.js
```

## ⚠️ Belangrijke Notities

### Voor Productie:
1. **ALTIJD** eerst het `verify-users.js` script runnen
2. Maak een backup van je database voor grote migraties
3. Test eerst op development/staging

### Database Namen:
- **Productie**: `lunchmonkeys-prod`
- **Development**: `lunchmonkeys`

Pas dit aan in de scripts waar nodig!

## 🔍 Script Details

### add-isactive-field.js
- Voegt `isActive: true` toe aan alle users zonder dit field
- Maakt een index aan voor performance
- Toont before/after statistieken
- Update ook het `updatedAt` field

### verify-users.js
- Controleert missende required fields
- Zoekt duplicate emails
- Toont user statistieken
- List alle indexes

### rollback-isactive.js
- **GEVAARLIJK**: Verwijdert isActive field
- Heeft safety check - uncomment om uit te voeren
- Verwijdert ook de isActive index

## 📊 MongoDB Atlas Tips

1. **Monitoring**: Check de Performance tab voor query performance
2. **Backups**: Atlas maakt automatisch backups, maar maak een manual backup voor grote migraties
3. **Indexes**: Check de Indexes tab om te zien welke indexes bestaan

## 🆘 Troubleshooting

**"Authentication failed"**
- Check je connection string
- Verify user permissions
- Check IP whitelist in Atlas

**"Cannot use db.users"**
- Zorg dat je eerst `use database-name` runt
- Check of de users collection bestaat

**Script hangt**
- Bij grote databases kan het even duren
- Check Atlas Performance tab voor activiteit
