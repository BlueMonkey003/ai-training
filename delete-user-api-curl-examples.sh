#!/bin/bash

# Delete User API Examples using cURL
# Admin credentials voor authenticatie
ADMIN_EMAIL="algemeen@bluemonkeysit.nl"
ADMIN_PASSWORD="BlueMonkeys123!"
BASE_URL="https://api.lunchmonkeys.bluemonkeysaapp.nl"

echo "========================================="
echo "LunchMonkeys Delete User API Examples"
echo "========================================="

# 1. Login als admin om token te krijgen
echo -e "\n1. Login als admin..."
LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${ADMIN_EMAIL}\",
    \"password\": \"${ADMIN_PASSWORD}\"
  }")

# Extract token met jq (als geïnstalleerd) of met grep/sed
if command -v jq &> /dev/null; then
    TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')
else
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | grep -o '[^"]*$')
fi

echo "Token verkregen: ${TOKEN:0:20}..."

# 2. Haal alle gebruikers op
echo -e "\n2. Alle gebruikers ophalen..."
curl -s -X GET "${BASE_URL}/api/users" \
  -H "Authorization: Bearer ${TOKEN}" | jq '.' || cat

# 3. Maak een test gebruiker aan
echo -e "\n3. Test gebruiker aanmaken..."
CREATE_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/auth/register" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "email": "test.delete@example.com",
    "password": "TestPassword123!",
    "name": "Test User for Deletion",
    "role": "employee"
  }')

# Extract user ID
if command -v jq &> /dev/null; then
    USER_ID=$(echo "$CREATE_RESPONSE" | jq -r '.user._id')
else
    USER_ID=$(echo "$CREATE_RESPONSE" | grep -o '"_id":"[^"]*' | head -1 | grep -o '[^"]*$')
fi

echo "Test gebruiker aangemaakt met ID: ${USER_ID}"

# 4. Verwijder de test gebruiker
echo -e "\n4. Gebruiker verwijderen..."
curl -s -X DELETE "${BASE_URL}/api/users/${USER_ID}" \
  -H "Authorization: Bearer ${TOKEN}" | jq '.' || cat

# 5. Verifieer dat gebruiker verwijderd is (verwacht 404)
echo -e "\n5. Verifieer dat gebruiker verwijderd is (verwacht 404)..."
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" \
  -X GET "${BASE_URL}/api/users/${USER_ID}" \
  -H "Authorization: Bearer ${TOKEN}"

echo -e "\n========================================="
echo "Directe cURL commando's voor copy/paste:"
echo "========================================="

echo -e "\n# Login:"
echo "curl -X POST '${BASE_URL}/api/auth/login' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"email\": \"${ADMIN_EMAIL}\", \"password\": \"${ADMIN_PASSWORD}\"}'"

echo -e "\n# Delete user (vervang USER_ID en TOKEN):"
echo "curl -X DELETE '${BASE_URL}/api/users/USER_ID' \\"
echo "  -H 'Authorization: Bearer TOKEN'"

echo -e "\n# Get all users:"
echo "curl -X GET '${BASE_URL}/api/users' \\"
echo "  -H 'Authorization: Bearer TOKEN'"

echo -e "\n# Get active employees only:"
echo "curl -X GET '${BASE_URL}/api/users?active=true&role=employee' \\"
echo "  -H 'Authorization: Bearer TOKEN'"



