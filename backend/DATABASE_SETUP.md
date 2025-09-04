# Database Setup voor LunchMonkeys

## 🗄️ Database Structuur

MongoDB met Mongoose maakt automatisch collections aan bij eerste gebruik. De applicatie gebruikt deze collections:

### Collections (worden automatisch aangemaakt):
- **users** - Gebruikers (admin/employee)
- **restaurants** - Restaurant informatie
- **orders** - Lunch bestellingen
- **orderitems** - Individuele items in een bestelling
- **notifications** - Gebruiker notificaties

## 🚀 Productie Database Setup

### 1. Database is al aangemaakt
Je hebt al `lunchmonkeys-prod` aangemaakt in MongoDB Atlas ✅

### 2. Initialiseer met Admin User

**Optie A: Lokaal uitvoeren (aanbevolen)**
```bash
cd backend

# Maak een .env bestand met productie credentials
# (of gebruik bestaande .env met juiste MONGO_URI)

# Run het productie seed script
npm run seed:prod
```

**Optie B: Handmatig in MongoDB Atlas**
1. Ga naar Collections → lunchmonkeys-prod
2. Create Collection → "users"
3. Insert Document:
```json
{
  "name": "Admin Blue Monkeys",
  "email": "admin@bluemonkeys.nl",
  "passwordHash": "$2b$10$...", // Gebruik bcrypt om te hashen
  "role": "admin",
  "createdAt": new Date(),
  "updatedAt": new Date()
}
```

### 3. Environment Variable voor Admin Password (Optioneel)

Voor het seed script kun je een custom admin password instellen:
```env
ADMIN_PASSWORD=JouwVeiligAdminWachtwoord123!
```

Anders gebruikt het script: `Admin123!@#`

## 🔐 Na Deployment

1. **Login als admin**: admin@bluemonkeys.nl
2. **Verander direct het wachtwoord** via profiel pagina
3. **Maak andere admin accounts** indien nodig
4. **Verwijder of disable** het default admin account

## 📊 Database Migratie (Optioneel)

Als je data wilt kopiëren van development naar productie:

```bash
# Export van development
mongodump --uri="mongodb+srv://user:pass@cluster.mongodb.net/lunchmonkeys" --out=./backup

# Import naar productie (VOORZICHTIG!)
mongorestore --uri="mongodb+srv://user:pass@cluster.mongodb.net/lunchmonkeys-prod" ./backup/lunchmonkeys --nsFrom="lunchmonkeys.*" --nsTo="lunchmonkeys-prod.*"
```

## ⚠️ Belangrijke Opmerkingen

1. **Collections worden automatisch aangemaakt** - Je hoeft geen schema's te definiëren
2. **Indexes worden automatisch aangemaakt** - Mongoose handelt dit af
3. **Validatie gebeurt op applicatie niveau** - Via Mongoose schemas
4. **Backup regelmatig** - MongoDB Atlas heeft automated backups

## 🧪 Verificatie

Na deployment, check in MongoDB Atlas:
1. Browse Collections → lunchmonkeys-prod
2. Je zou moeten zien:
   - `users` collection met admin user
   - Andere collections verschijnen bij eerste gebruik
