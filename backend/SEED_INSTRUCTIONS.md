# Seed Instructions voor LunchMonkeys

## 📝 Environment Setup

Voordat je een seed script runt, zorg dat je een `.env` of `.env.development` bestand hebt:

### Maak `.env.development` aan:
```env
NODE_ENV=development
MONGO_URI=mongodb+srv://bluemonkeysaapUser:0Av1oS3IL3pw4p8I@cluster0.del2o.mongodb.net/lunchmonkeys?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=SuperGeheim123!@#
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
PORT=10000
```

## 🌱 Seed Commands

### Development Database (lunchmonkeys)
```bash
npm run seed:dev
```
Dit voegt test data toe:
- Admin user
- Test employee
- Sample restaurants
- Sample orders

### Production Database (lunchmonkeys-prod)
```bash
npm run seed:prod
```
Dit voegt alleen toe:
- Admin user (admin@bluemonkeys.nl)
- Wachtwoord: Admin123!@# (verander dit direct!)

## ⚠️ Belangrijke Opmerkingen

1. Het seed:prod script gebruikt ALTIJD de `lunchmonkeys-prod` database
2. Het seed:dev script gebruikt de normale `lunchmonkeys` database
3. Beide scripts gebruiken dezelfde MONGO_URI maar passen de database naam aan

## 🔧 Troubleshooting

Als je deze error krijgt:
```
❌ MONGO_URI not found in environment variables
```

Check:
1. Of `.env.development` bestaat in de backend folder
2. Of MONGO_URI correct is ingesteld
3. Run het script vanuit de backend folder: `cd backend && npm run seed:prod`
