# LunchMonkeys 🍔

Een moderne webapplicatie voor het organiseren van lunchbestellingen bij Blue Monkeys.

## Features

- 🔐 Authenticatie met JWT (email + wachtwoord)
- 👥 Rollen: Admin en Medewerker
- 🍕 Restaurant beheer met afbeeldingen (Cloudinary)
- 📝 Dagelijkse lunchbestellingen
- 🔔 Realtime updates via Socket.IO
- 📱 Volledig responsive design
- 🎨 Moderne UI met Tailwind CSS en shadcn/ui

## Tech Stack

### Backend
- Node.js + Express.js
- TypeScript
- MongoDB (Mongoose ODM)
- Socket.IO
- JWT authenticatie
- Cloudinary voor afbeeldingen

### Frontend
- React + Vite
- TypeScript
- Tailwind CSS
- Socket.IO Client
- Axios

## Installatie

### Vereisten
- Node.js 18+
- MongoDB Atlas account
- Cloudinary account

### Backend Setup

```bash
cd backend
npm install
```

Maak een `.env` bestand aan (zie `.env.example`):
```env
MONGO_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
PORT=10000
NODE_ENV=development
```

Start de development server:
```bash
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
```

Maak een `.env` bestand aan:
```env
VITE_API_URL=http://localhost:10000
```

Start de development server:
```bash
npm run dev
```

## Deployment op Render.com

### Backend (Web Service)

1. Maak een nieuwe Web Service op Render
2. Verbind je GitHub repository
3. Configuratie:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
4. Voeg environment variables toe (zie `.env.example`)

### Frontend (Static Site)

1. Maak een nieuwe Static Site op Render
2. Verbind je GitHub repository
3. Configuratie:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `build`
4. Voeg environment variable toe:
   - `VITE_API_URL`: URL van je backend service

## API Documentatie

Swagger documentatie is beschikbaar op:
```
http://localhost:10000/api-docs
```

## Gebruikers Rollen

- **Admin**: Kan restaurants beheren en bestellingen starten/sluiten
- **Medewerker**: Kan bestellingen toevoegen en eigen profiel beheren

## Socket.IO Events

- `order:new` - Nieuwe bestelling gestart
- `order:update` - Bestelling item toegevoegd/gewijzigd
- `order:closed` - Bestelling gesloten
- `notification:new` - Nieuwe notificatie

## License

MIT 