# 🍽️ LunchMonkeys

Interne webapplicatie voor lunchbestellingen binnen BlueMonkeys IT. Administrators beheren restaurants, openen/sluiten een dagelijkse order en beheren gebruikers. Medewerkers voegen hun eigen lunchitems toe. Iedereen krijgt realtime notificaties.

## 🌟 Kernfeatures
- **Authenticatie & autorisatie**: JWT-bearer tokens, protected routes; admin-only acties. Registratie met email verificatie (activatielink geldig 24u); wachtwoord vereist: min 8 chars, hoofdletter, kleine letter, cijfer, speciaal teken. Alleen `@bluemonkeysit.nl` emails toegestaan (invoer: alleen username). Wachtwoord reset: alleen tijdelijk wachtwoord nodig (email optioneel), auto-login na reset, emailVerified blijft behouden.
- **Restaurants**: Admin kan restaurants aanmaken/bewerken/verwijderen, incl. afbeelding (Cloudinary), website en optionele menulink.
- **Orders & items**: Admin opent/sluit dagorder; medewerkers voegen items toe (naam/notities/prijs). Realtime updates met Socket.IO. Bij openen en sluiten gaat een notificatie naar alle gebruikers. Employees zien alleen orders vanaf hun registratiedatum; admins zien volledige geschiedenis.
- **Notificaties**: Lijst, markeer gelezen/alles-gelezen; realtime bell-counter en toast bij nieuwe notificaties. Admins ontvangen automatisch een notificatie bij uploaden van een bonnetje. Notificaties bevatten nu een route (bijv. `/orders/{id}` of `/receipts`) en zijn klikbaar.
- **Uploads**: Profielfoto upload via `multipart/form-data` naar Cloudinary.
- **Bonnetjes (admin)**: upload bon bij gesloten order; overzicht met downloads; dashboards (totaal, per restaurant, per persoon).
- **Menu-varianten & add-ons**: Menukaarten ondersteunen varianten (bijv. 15/30 cm) en optiegroepen (single/multi) met prijsdelta's. Frontend toont automatisch dropdowns/checkboxes en rekent de prijs live uit. Import via XML/JSON.
- **Versie-informatie**: Header toont `vX.Y.Z (build N)`; Over/Instellingen toont versie/build en de laatste wijzigingen.
- **Email templates**: Alle emails (verificatie, wachtwoord reset, bevestigingen) zijn gestyled met BlueMonkeys logo en huisstijlkleuren, responsive voor laptop en mobiel.

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
- Auth: `POST /auth/register` (met birthDate, stuurt verificatie email), `GET /auth/verify-email/{token}`, `POST /auth/login` (check emailVerified en isActive), `GET /auth/me`, `POST /auth/forgot-password` (alleen username), `POST /auth/reset-password` (tijdelijk wachtwoord + nieuw wachtwoord, email optioneel)
- Users: `GET /users` (admin), `GET/PATCH /users/{id}`, `PATCH /users/{id}/role`, `PATCH /users/{id}/status`, `POST /users/{id}/reset-password`, `DELETE /users/{id}`
- Restaurants: `GET /restaurants`; `POST/PATCH/DELETE /restaurants` (admin, met upload)
- Restaurants Menu: `GET /restaurants/{id}/menu`, `POST /restaurants/{id}/menu/import` (XML/JSON of `multipart/form-data`, admin). Menu-items ondersteunen optioneel `variants` en `optionGroups` met `priceDelta` (zie voorbeeld hieronder).
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
- `recentCommits` maximaal 5 items, nieuwste bovenaan. De app toont standaard de laatste 3 (frontend kan tot 5 tonen).
- Pipelines overschrijven `recentCommits` niet. Het Auto PR-script gebruikt deze bullets en werkt ze bij indien nodig.

## 📄 Voorbeeld XML voor menu (met varianten en add-ons)
```xml
<restaurant>
  <info>
    <name>Subway</name>
    <currency>EUR</currency>
  </info>

  <categories>
    <category id="subs" name="Subs">
      <items>
        <item id="italian_bmt">
          <name>Italian B.M.T.</name>
          <price>5.50</price>
          <description>Salami, pepperoni, ham</description>

          <variants required="true">
            <variant id="15cm" name="15 cm" priceDelta="0.00"/>
            <variant id="30cm" name="30 cm" priceDelta="3.00"/>
          </variants>

          <optionGroups>
            <optionGroup id="bread" name="Brood" type="single" required="false">
              <option id="white" name="Wit" priceDelta="0.00"/>
              <option id="wholegrain" name="Volkoren" priceDelta="0.00"/>
            </optionGroup>

            <optionGroup id="cheese" name="Kaas" type="single" required="false">
              <option id="cheddar" name="Cheddar" priceDelta="0.50"/>
              <option id="mozzarella" name="Mozzarella" priceDelta="0.50"/>
            </optionGroup>

            <optionGroup id="extras" name="Extra's" type="multi" maxSelect="3">
              <option id="extra_meat" name="Extra vlees" priceDelta="1.50"/>
              <option id="extra_cheese" name="Dubbel kaas" priceDelta="0.50"/>
              <option id="guacamole" name="Guacamole" priceDelta="1.00"/>
            </optionGroup>

            <optionGroup id="sauces" name="Sauzen" type="multi" maxSelect="3">
              <option id="mayo" name="Mayonaise" priceDelta="0.00"/>
              <option id="bbq" name="BBQ" priceDelta="0.00"/>
            </optionGroup>
          </optionGroups>
        </item>

        <item id="veggie_delite">
          <name>Veggie Delite</name>
          <price>4.90</price>
          <variants required="false">
            <variant id="15cm" name="15 cm" priceDelta="0.00"/>
            <variant id="30cm" name="30 cm" priceDelta="2.50"/>
          </variants>
          <optionGroups>
            <optionGroup id="extras" name="Extra's" type="multi" maxSelect="2">
              <option id="extra_cheese" name="Extra kaas" priceDelta="0.50"/>
              <option id="avocado" name="Avocado" priceDelta="1.00"/>
            </optionGroup>
          </optionGroups>
        </item>
      </items>
    </category>

    <category id="drinks" name="Drinken">
      <items>
        <item id="cola_33cl">
          <name>Coca-Cola 33cl</name>
          <price>2.50</price>
        </item>
      </items>
    </category>
  </categories>
</restaurant>
```

## 📱 Mobielvriendelijk
- Layouts zijn responsive voor laptop en telefoon. Release notes-tekst wordt niet afgekapt (break-words) en blijft volledig leesbaar.

## 🆘 Troubleshooting
- CORS of 401: check `VITE_API_URL` en backend CORS-config.
- DB-issues: verifieer `MONGO_URI` en IP-whitelist in Atlas.
- Cloudinary: controleer keys en upload-limieten.

## 🤝 Contributie
- Gebruik conventional commits en feature branches (`feature/*`, `bugfix/*`, `hotfix/*`).
- Bij PRs: zorg dat Swagger up-to-date is en, indien van toepassing, release notes zijn bijgewerkt in `version.json`.