# 🍽️ LunchMonkeys

Interne webapplicatie voor lunchbestellingen binnen BlueMonkeys IT. Administrators beheren restaurants, openen/sluiten een dagelijkse order en beheren gebruikers. Medewerkers voegen hun eigen lunchitems toe. Iedereen krijgt realtime notificaties.

## 🌟 Kernfeatures
- **Authenticatie & autorisatie**: JWT-bearer tokens, protected routes; admin-only acties. Registratie alleen met e-mails die eindigen op `@bluemonkeysit.nl`.
- **Restaurants**: Admin kan restaurants aanmaken/bewerken/verwijderen, incl. afbeelding (Cloudinary), website en optionele menulink.
- **Orders & items**: Admin opent/sluitt dagorder; medewerkers voegen items toe (naam/notities/prijs). Realtime updates met Socket.IO. Bij openen en sluiten gaat een notificatie naar alle gebruikers.
- **Notificaties**: Lijst, markeer gelezen/alles-gelezen; realtime bell-counter en toast bij nieuwe notificaties. Admins ontvangen automatisch een notificatie bij uploaden van een bonnetje. Notificaties bevatten nu een route (bijv. `/orders/{id}` of `/receipts`) en zijn klikbaar.
- **Uploads**: Profielfoto upload via `multipart/form-data` naar Cloudinary.
- **Bonnetjes (admin)**: upload bon bij gesloten order; overzicht met downloads; dashboards (totaal, per restaurant, per persoon).
- **Versie-informatie**: Header toont `vX.Y.Z (build N)`; Over/Instellingen toont versie/build en de laatste wijzigingen.

## 🧱 Architectuur & stack
- **Backend**: Node.js, Express, TypeScript, MongoDB (Mongoose), JWT, Socket.IO, Swagger (`swagger-ui-express` + `swagger-jsdoc`), `helmet`, `compression`, rate limiting, CORS.
- **Frontend**: React + Vite + TypeScript, React Router, axios, Tailwind, `react-hot-toast`, Socket service.
- **Monorepo**: `lunchmonkeys/backend`, `lunchmonkeys/frontend`, gedeelde types in `lunchmonkeys/shared/types.ts`.

## 📁 Projectstructuur (hoofdlijnen)
- `lunchmonkeys/backend`: API, sockets, modellen, controllers, routes, Swagger.
- `lunchmonkeys/frontend`: React app, pages, components, services (axios/socket).
- `lunchmonkeys/version.json`: bron voor versie/build en release notes (zie verderop).

## 🚀 Snel starten (development)
1. Installeer dependencies:
   - Backend: `cd lunchmonkeys/backend && npm install`
   - Frontend: `cd lunchmonkeys/frontend && npm install`
2. Maak `.env.development` aan:
   - Backend (`lunchmonkeys/backend/.env.development`):
     ```env
     MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/lunchmonkeys
     JWT_SECRET=SuperGeheim123!@#
     CLOUDINARY_CLOUD_NAME=your-cloud-name
     CLOUDINARY_API_KEY=your-api-key
     CLOUDINARY_API_SECRET=your-api-secret
     PORT=10000
     NODE_ENV=development
     ```
   - Frontend (`lunchmonkeys/frontend/.env.development`):
     ```env
     VITE_API_URL=http://localhost:10000
     ```
3. Start via het helper-script:
   ```powershell
   .\dev-server.ps1  # kies optie 3 om beide te starten
   ```
4. Open: Frontend `http://localhost:5173` (of 5174) en Swagger: `http://localhost:10000/api-docs`.

## 🔐 Security
- Registratie en wachtwoordreset accepteren uitsluitend `@bluemonkeysit.nl` e-mails.
- Gebruik rate limiting, CORS en `helmet`; zet secrets alleen in `.env.development` (nooit committen).
- Uploads verlopen via `multipart/form-data` en worden gevalideerd.

## 📚 Endpoints (indicatief, onder `/api`)
- Auth: `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `POST /auth/forgot-password`, `POST /auth/reset-password`
- Users: `GET /users` (admin), `GET/PATCH /users/{id}`, `PATCH /users/{id}/role`, `PATCH /users/{id}/status`, `POST /users/{id}/reset-password`, `DELETE /users/{id}`
- Restaurants: `GET /restaurants`; `POST/PATCH/DELETE /restaurants` (admin, met upload)
 - Restaurants: `GET /restaurants`; `POST/PATCH/DELETE /restaurants` (admin, met upload); Menu: `GET /restaurants/{id}/menu`, `POST /restaurants/{id}/menu/import` (XML/JSON of `multipart/form-data`, admin)
- Orders: `GET /orders` (filters: status/date), `POST /orders` (admin), `GET /orders/{id}`, `PATCH /orders/{id}` (close, admin)
- Order items: `POST/PATCH/DELETE /orders/{id}/items`
- Notifications: `GET /notifications?unread=bool`, `PATCH /notifications/{id}/read`, `PATCH /notifications/read-all`
- Upload: `POST /upload/profile`
- Receipts (admin): `POST /orders/{orderId}/receipts` (multipart), `GET /receipts`, `GET /receipts/summary`, `GET /receipts/{id}`, `DELETE /receipts/{id}`, `GET /receipts/{id}/download`
- Health: `GET /health` (status, versie, build, DB)

Swagger is beschikbaar op `/api-docs`. Bij wijzigingen aan endpoints: altijd Swagger JSDoc-annotaties updaten.

## 🧩 Realtime
- Socket.IO pusht events voor nieuwe bestellingen, gesloten bestellingen en notificaties.

## 📝 Release notes beleid
- `lunchmonkeys/version.json` is de enige bron voor “Laatste wijzigingen”.
- Schema:
  ```json
  {
    "version": "1.7.1",
    "buildNumber": 13,
    "lastUpdated": "2025-09-19",
    "recentCommits": [
      { "date": "YYYY-MM-DD", "message": "..." }
    ]
  }
  ```
- `recentCommits` maximaal 5 items, nieuwste bovenaan. De app toont de laatste 3.
- Pipelines overschrijven `recentCommits` niet. Het Auto PR-script gebruikt deze bullets en werkt ze bij indien nodig.

## 📱 Mobielvriendelijk
- Layouts zijn responsive voor laptop en telefoon. Release notes-tekst wordt niet afgekapt (break-words) en blijft volledig leesbaar.

## 🆘 Troubleshooting
- CORS of 401: check `VITE_API_URL` en backend CORS-config.
- DB-issues: verifieer `MONGO_URI` en IP-whitelist in Atlas.
- Cloudinary: controleer keys en upload-limieten.

## 🤝 Contributie
- Gebruik conventional commits en feature branches (`feature/*`, `bugfix/*`, `hotfix/*`).
- Bij PRs: zorg dat Swagger up-to-date is en, indien van toepassing, release notes zijn bijgewerkt in `version.json`.