# Delete User API Guide

## Overzicht
De Delete User API endpoint stelt administrators in staat om gebruikers uit het systeem te verwijderen. Deze API is alleen toegankelijk voor gebruikers met de 'admin' rol.

## Endpoint Details
- **URL**: `/api/users/{id}`
- **Method**: `DELETE`
- **Authentication**: Bearer token (admin rechten vereist)

## Admin Credentials (voor testing)
```json
{
  "email": "algemeen@bluemonkeysit.nl",
  "password": "BlueMonkeys123!",
  "role": "admin",
  "_id": "68b9351dfa24056b05d7f4a8"
  // Let op: alle gebruikers moeten een @bluemonkeysit.nl email hebben
}
```

## Response Codes
- **200**: Gebruiker succesvol verwijderd
- **400**: Fout bij verwijderen (bijv. laatste admin, eigen account)
- **403**: Geen admin rechten
- **404**: Gebruiker niet gevonden

## Beveiligingen
1. **Admin-only**: Alleen gebruikers met 'admin' rol kunnen deze endpoint gebruiken
2. **Zelf-verwijdering preventie**: Admins kunnen hun eigen account niet verwijderen
3. **Laatste admin bescherming**: Het systeem voorkomt het verwijderen van de laatste admin

## Gebruik in Robot Framework

### Installatie vereisten
```bash
pip install robotframework
pip install robotframework-requests
```

### Test uitvoeren
```bash
robot delete-user-api-example.robot
```

### Voorbeeld test case
```robot
*** Test Cases ***
Delete Specific User
    ${auth_token}=    Login As Admin
    Set Global Variable    ${AUTH_TOKEN}    ${auth_token}
    
    # Vervang met werkelijk user ID
    ${user_id}=    Set Variable    507f1f77bcf86cd799439011
    Delete User By Id    ${user_id}
```

## Python Gebruik

### Direct gebruik
```python
from delete_user_api_example import LunchMonkeysAPI

api = LunchMonkeysAPI()
api.login("algemeen@bluemonkeysit.nl", "BlueMonkeys123!")
result = api.delete_user("USER_ID_HERE")
print(result['message'])
```

### In Robot Framework als Library
```robot
*** Settings ***
Library    delete-user-api-example.LunchMonkeysAPI    https://api.lunchmonkeys.bluemonkeysaapp.nl

*** Test Cases ***
Delete User Via Python Library
    Login    algemeen@bluemonkeysit.nl    BlueMonkeys123!
    ${result}=    Delete User    507f1f77bcf86cd799439011
    Log    ${result['message']}
```

## cURL Voorbeelden

### 1. Verkrijg auth token
```bash
curl -X POST 'https://api.lunchmonkeys.bluemonkeysaapp.nl/api/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"email": "algemeen@bluemonkeysit.nl", "password": "BlueMonkeys123!"}'
```

### 2. Verwijder gebruiker
```bash
curl -X DELETE 'https://api.lunchmonkeys.bluemonkeysaapp.nl/api/users/USER_ID' \
  -H 'Authorization: Bearer YOUR_TOKEN_HERE'
```

### 3. Lijst alle gebruikers (om IDs te vinden)
```bash
curl -X GET 'https://api.lunchmonkeys.bluemonkeysaapp.nl/api/users' \
  -H 'Authorization: Bearer YOUR_TOKEN_HERE'
```

## Response Voorbeelden

### Succesvolle verwijdering
```json
{
  "success": true,
  "message": "Gebruiker succesvol verwijderd",
  "deletedUserId": "507f1f77bcf86cd799439011"
}
```

### Fout: Laatste admin
```json
{
  "success": false,
  "message": "Kan de laatste admin niet verwijderen"
}
```

### Fout: Eigen account
```json
{
  "success": false,
  "message": "Je kunt je eigen account niet verwijderen"
}
```

## Swagger Documentatie
De API is ook gedocumenteerd in Swagger. Ga naar:
- Development: `http://localhost:5001/api-docs`
- Production: `https://api.lunchmonkeys.bluemonkeysaapp.nl/api-docs`

Zoek naar de DELETE `/api/users/{id}` endpoint onder de Users sectie.

## Tips voor Testing
1. Maak altijd eerst een test gebruiker aan voordat je delete test
2. Gebruik de GET `/api/users` endpoint om gebruiker IDs te vinden
3. Test ook de error scenarios (404, 403, 400)
4. Verifieer na deletion dat de gebruiker werkelijk verwijderd is

