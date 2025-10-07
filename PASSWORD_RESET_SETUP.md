# Password Reset Setup Guide

## ⚠️ Email Domein Restrictie

**Belangrijk:** Alleen emailadressen met het domein `@bluemonkeysit.nl` kunnen zich registreren in de applicatie. Dit is een security maatregel om ervoor te zorgen dat alleen medewerkers van Blue Monkeys IT toegang hebben tot het systeem.

## 📧 Email Configuratie

Voor de wachtwoord reset functionaliteit moet je een email service configureren. 

### Stap 1: Email Account Setup

#### Optie A: Gmail (Aanbevolen voor development)

1. Ga naar je Gmail account
2. Schakel 2-factor authenticatie in (vereist voor app passwords)
3. Ga naar: https://myaccount.google.com/apppasswords
4. Genereer een "App Password" voor "Mail"
5. Kopieer het gegenereerde wachtwoord

#### Optie B: Andere Email Provider

Gebruik de SMTP instellingen van je email provider:
- SMTP Host (bijv. smtp.gmail.com)
- SMTP Port (meestal 587 voor TLS of 465 voor SSL)
- Username (je email adres)
- Password (je wachtwoord of app password)

### Stap 2: Environment Variables

Voeg deze variabelen toe aan `lunchmonkeys/backend/.env.development`:

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=jouw-email@gmail.com
EMAIL_PASS=jouw-app-password
EMAIL_FROM="LunchMonkeys" <noreply@lunchmonkeys.nl>
```

### Stap 3: Productie Setup

Voor productie wordt aangeraden om een professionele email service te gebruiken:
- SendGrid
- AWS SES
- Mailgun
- Postmark

## 🔐 Hoe de Password Reset Werkt

### Flow:

1. **Gebruiker vraagt reset aan**
   - Gebruiker vult email in op `/forgot-password`
   - Systeem genereert tijdelijk wachtwoord (8 karakters)
   - Tijdelijk wachtwoord wordt gehashed opgeslagen
   - Email wordt verstuurd met het tijdelijke wachtwoord

2. **Gebruiker reset wachtwoord**
   - Gebruiker gaat naar `/reset-password`
   - Vult alleen tijdelijk wachtwoord en nieuw wachtwoord in (email optioneel)
   - Systeem zoekt gebruiker via tijdelijk wachtwoord (uniek)
   - Nieuw wachtwoord wordt opgeslagen (emailVerified blijft behouden)
   - Gebruiker wordt automatisch ingelogd en doorgestuurd naar dashboard

### Security Features:

- Tijdelijk wachtwoord is slechts 1 uur geldig
- Tijdelijk wachtwoord wordt gehashed opgeslagen
- Response geeft nooit aan of email bestaat (voorkomt email enumeration)
- Na succesvol resetten wordt bevestigingsmail gestuurd
- emailVerified status blijft behouden na wachtwoord reset
- Spaties worden automatisch getrimd uit tijdelijk wachtwoord

## 🧪 Testen

### Development:

1. Start beide servers:
   ```bash
   .\dev-server.ps1  # Kies optie 3
   ```

2. Ga naar login pagina en klik "Wachtwoord vergeten?"

3. Test met een bestaand account email

4. Check je email voor het tijdelijke wachtwoord

5. Gebruik het tijdelijke wachtwoord om een nieuw wachtwoord in te stellen

### Troubleshooting:

**Email wordt niet verstuurd:**
- Check EMAIL_USER en EMAIL_PASS in .env.development
- Voor Gmail: zorg dat je een App Password gebruikt
- Check console logs in backend terminal

**"Email kon niet worden verstuurd" error:**
- Email service is niet correct geconfigureerd
- Firewall blokkeert mogelijk SMTP verkeer
- Credentials zijn incorrect

**Reset token verlopen:**
- Token is langer dan 1 uur oud
- Vraag nieuwe reset aan

## 📝 API Endpoints

### POST /api/auth/forgot-password
```json
{
  "email": "user@example.com"
}
```

Response:
```json
{
  "success": true,
  "message": "Als het emailadres bestaat, is er een reset email verstuurd"
}
```

### POST /api/auth/reset-password
```json
{
  "tempPassword": "ABC12345",
  "newPassword": "newSecurePassword123",
  "email": "user@example.com"  // optioneel
}
```

Response:
```json
{
  "success": true,
  "message": "Wachtwoord succesvol gewijzigd",
  "token": "jwt-token",
  "user": { ... }
}
```

## 🚀 Deployment Notes

Voor productie deployment:
1. Update email configuratie in productie .env
2. Test email service connectiviteit
3. Monitor email delivery rates
4. Email templates zijn nu gestyled met BlueMonkeys logo en huisstijlkleuren
5. Wachtwoord reset emails zijn responsive voor laptop en mobiel
