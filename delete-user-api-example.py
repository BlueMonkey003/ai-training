#!/usr/bin/env python3
"""
Voorbeeld script om de delete user API te gebruiken.
Dit kan ook gebruikt worden in Robot Framework met de Library keyword.
"""

import requests
import json
from typing import Optional, Dict, Any

class LunchMonkeysAPI:
    def __init__(self, base_url: str = "https://api.lunchmonkeys.bluemonkeysaapp.nl"):
        self.base_url = base_url
        self.session = requests.Session()
        self.auth_token: Optional[str] = None
    
    def login(self, email: str, password: str) -> str:
        """Login en krijg authentication token"""
        response = self.session.post(
            f"{self.base_url}/api/auth/login",
            json={"email": email, "password": password}
        )
        response.raise_for_status()
        
        data = response.json()
        if data.get("success"):
            self.auth_token = data["token"]
            self.session.headers.update({"Authorization": f"Bearer {self.auth_token}"})
            return self.auth_token
        else:
            raise Exception(f"Login failed: {data.get('message', 'Unknown error')}")
    
    def delete_user(self, user_id: str) -> Dict[str, Any]:
        """Verwijder een gebruiker met het opgegeven ID"""
        if not self.auth_token:
            raise Exception("Not authenticated. Please login first.")
        
        response = self.session.delete(f"{self.base_url}/api/users/{user_id}")
        
        # Handle verschillende response codes
        if response.status_code == 200:
            return response.json()
        elif response.status_code == 400:
            error_data = response.json()
            raise Exception(f"Bad request: {error_data.get('message', 'Unknown error')}")
        elif response.status_code == 403:
            raise Exception("Forbidden: Je hebt geen admin rechten")
        elif response.status_code == 404:
            raise Exception(f"User with ID {user_id} not found")
        else:
            response.raise_for_status()
    
    def get_all_users(self, active: Optional[bool] = None, role: Optional[str] = None) -> Dict[str, Any]:
        """Haal alle gebruikers op (admin only)"""
        params = {}
        if active is not None:
            params["active"] = str(active).lower()
        if role:
            params["role"] = role
        
        response = self.session.get(f"{self.base_url}/api/users", params=params)
        response.raise_for_status()
        return response.json()
    
    def create_test_user(self, email: str, password: str, name: str, role: str = "employee") -> str:
        """Maak een test gebruiker aan"""
        response = self.session.post(
            f"{self.base_url}/api/auth/register",
            json={
                "email": email,
                "password": password,
                "name": name,
                "role": role
            }
        )
        response.raise_for_status()
        data = response.json()
        return data["user"]["_id"]


def main():
    """Voorbeeld gebruik van de API"""
    # Initialize API client
    api = LunchMonkeysAPI()
    
    # Admin credentials
    admin_email = "algemeen@bluemonkeysit.nl"
    admin_password = "BlueMonkeys123!"
    
    try:
        # 1. Login als admin
        print("🔐 Logging in as admin...")
        token = api.login(admin_email, admin_password)
        print(f"✅ Successfully logged in. Token: {token[:20]}...")
        
        # 2. Haal alle gebruikers op
        print("\n📋 Getting all users...")
        users_data = api.get_all_users()
        users = users_data["users"]
        print(f"✅ Found {len(users)} users")
        
        # Print gebruikers
        for user in users:
            print(f"  - {user['name']} ({user['email']}) - Role: {user['role']} - ID: {user['_id']}")
        
        # 3. Maak een test gebruiker aan om te verwijderen
        print("\n👤 Creating test user...")
        test_user_id = api.create_test_user(
            email="test.delete@example.com",
            password="TestPassword123!",
            name="Test User for Deletion"
        )
        print(f"✅ Created test user with ID: {test_user_id}")
        
        # 4. Verwijder de test gebruiker
        print(f"\n🗑️ Deleting user {test_user_id}...")
        result = api.delete_user(test_user_id)
        print(f"✅ {result['message']}")
        print(f"   Deleted user ID: {result['deletedUserId']}")
        
        # 5. Probeer een niet-bestaande gebruiker te verwijderen (voor error handling demo)
        print("\n🔍 Trying to delete non-existent user...")
        try:
            api.delete_user("507f1f77bcf86cd799439999")
        except Exception as e:
            print(f"❌ Expected error: {e}")
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Request error: {e}")
    except Exception as e:
        print(f"❌ Error: {e}")


if __name__ == "__main__":
    main()


# Voorbeeld voor gebruik in Robot Framework:
# 
# *** Settings ***
# Library    delete-user-api-example.LunchMonkeysAPI    https://api.lunchmonkeys.bluemonkeysaapp.nl
# 
# *** Test Cases ***
# Delete User Via Python Library
#     Login    algemeen@bluemonkeysit.nl    BlueMonkeys123!
#     ${result}=    Delete User    507f1f77bcf86cd799439011
#     Log    ${result['message']}


