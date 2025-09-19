# LunchMonkeys Frontend (React + Vite)

React + Vite + TypeScript frontend voor de LunchMonkeys applicatie.

## Features
- Tailwind CSS UI, responsive layout (mobiel en laptop).
- Auth flows (login/registratie met `@bluemonkeysit.nl`), protected routes.
- Realtime notificaties via Socket.IO.
- Settings/Over-pagina toont versie/build en laatste 3 wijzigingen.

## Ontwikkelen
1. Dependencies installeren:
   ```bash
   npm install
   ```
2. `.env.development` toevoegen:
   ```env
   VITE_API_URL=http://localhost:10000
   ```
3. Starten:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:5173` (Vite kiest automatisch 5174 als 5173 bezet is).

## Build
```bash
npm run build
npm run preview
```

## Structuur (kort)
- `src/pages`: `LoginPage`, `DashboardPage`, `RestaurantsPage`, `NotificationsPage`, `OrderDetailPage`, `SettingsPage`, etc.
- `src/components/ui`: basis UI-componenten.
- `src/services/api.ts`: axios-instantie met auth-interceptor.
- `src/services/socket.ts`: Socket.IO client.
- `src/contexts/AuthContext.tsx`: auth state en role-based helpers.

## Release notes
De app leest `lunchmonkeys/version.json` en toont de laatste 3 bullets van `recentCommits` (nieuwste eerst). Tekst wordt niet afgekapt en blijft leesbaar op mobiel.
