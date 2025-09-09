*** Comments ***
# Alternatieve manier om direct een bestaande gebruiker te verwijderen:
#
# Delete Existing User Test
#    [Documentation]    Verwijder een bestaande gebruiker
#    ${auth_token}=    Login As Admin
#    Set Global Variable    ${AUTH_TOKEN}    ${auth_token}
#
#    # Vervang dit met het werkelijke user ID dat je wilt verwijderen
#    ${user_id_to_delete}=    Set Variable    507f1f77bcf86cd799439011
#
#    Delete User By Id    ${user_id_to_delete}

# Voorbeeld om alle gebruikers op te halen en dan één te verwijderen:
#
# Get All Users And Delete One
#    [Documentation]    Haal alle gebruikers op en verwijder er één
#    ${auth_token}=    Login As Admin
#    Set Global Variable    ${AUTH_TOKEN}    ${auth_token}
#
#    ${headers}=    Create Dictionary    Authorization=Bearer ${AUTH_TOKEN}
#    ${response}=    GET On Session    lunchmonkeys    /api/users    headers=${headers}
#    ${users}=    Get From Dictionary    ${response.json()}    users
#
#    # Loop door gebruikers en vind er één om te verwijderen (niet de admin!)
#    FOR    ${user}    IN    @{users}
#    ${role}=    Get From Dictionary    ${user}    role
#    ${email}=    Get From Dictionary    ${user}    email
#    Run Keyword If    '${role}' == 'employee' and '${email}' != '${ADMIN_EMAIL}'
#    ...    Delete User By Id    ${user['_id']}
#    ...    AND    Exit For Loop
#    END


*** Settings ***
Library     RequestsLibrary
Library     BuiltIn
Library     Collections


*** Variables ***
${BASE_URL}                             https://api.lunchmonkeys.bluemonkeysaapp.nl
${ADMIN_EMAIL}                          algemeen@bluemonkeysit.nl
${ADMIN_PASSWORD} BlueMonkeys123!
${AUTH_TOKEN}                           ${EMPTY}


*** Test Cases ***
Delete User Test
    [Documentation]    Test om een gebruiker te verwijderen via de API
    [Tags]    api    deleteuser

    # Stap 1: Login als admin om token te krijgen
    ${auth_token}=    Login As Admin
    Set Global Variable    ${AUTH_TOKEN}    ${auth_token}

    # Stap 2: Maak eerst een test gebruiker aan (optioneel)
    ${test_user_id}=    Create Test User

    # Stap 3: Verwijder de test gebruiker
    Delete User By Id    ${test_user_id}

    # Stap 4: Verifieer dat de gebruiker verwijderd is
    Verify User Is Deleted    ${test_user_id}


*** Keywords ***
Login As Admin
    [Documentation]    Login met admin credentials en return token
    Create Session    lunchmonkeys    ${BASE_URL}    verify=True

    ${headers}=    Create Dictionary    Content-Type=application/json
    ${data}=    Create Dictionary    email=${ADMIN_EMAIL}    password=${ADMIN_PASSWORD}
    ${json_data}=    Evaluate    json.dumps(${data})    json

    ${response}=    POST On Session    lunchmonkeys    /api/auth/login
    ...    data=${json_data}
    ...    headers=${headers}

    Should Be Equal As Strings    ${response.status_code}    200
    ${response_json}=    Set Variable    ${response.json()}
    Should Be True    ${response_json['success']}

    ${token}=    Get From Dictionary    ${response_json}    token
    Log    Successfully logged in as admin
    RETURN    ${token}

Create Test User
    [Documentation]    Maak een test gebruiker aan om te verwijderen
    ${headers}=    Create Dictionary
    ...    Content-Type=application/json
    ...    Authorization=Bearer ${AUTH_TOKEN}

    ${data}=    Create Dictionary
    ...    email=test.delete@example.com
    ...    password=TestPass123!
    ...    name=Test Delete User
    ...    role=employee

    ${json_data}=    Evaluate    json.dumps(${data})    json

    ${response}=    POST On Session    lunchmonkeys    /api/auth/register
    ...    data=${json_data}
    ...    headers=${headers}

    Should Be Equal As Strings    ${response.status_code}    201
    ${response_json}=    Set Variable    ${response.json()}
    ${user_id}=    Get From Dictionary    ${response_json['user']}    _id
    Log    Created test user with ID: ${user_id}
    RETURN    ${user_id}

Delete User By Id
    [Documentation]    Verwijder gebruiker met gegeven ID
    [Arguments]    ${user_id}

    ${headers}=    Create Dictionary
    ...    Authorization=Bearer ${AUTH_TOKEN}

    ${response}=    DELETE On Session    lunchmonkeys    /api/users/${user_id}
    ...    headers=${headers}

    Should Be Equal As Strings    ${response.status_code}    200
    ${response_json}=    Set Variable    ${response.json()}
    Should Be True    ${response_json['success']}
    Should Be Equal As Strings    ${response_json['message']}    Gebruiker succesvol verwijderd
    Should Be Equal As Strings    ${response_json['deletedUserId']}    ${user_id}
    Log    Successfully deleted user with ID: ${user_id}

Verify User Is Deleted
    [Documentation]    Verifieer dat de gebruiker niet meer bestaat
    [Arguments]    ${user_id}

    ${headers}=    Create Dictionary
    ...    Authorization=Bearer ${AUTH_TOKEN}

    ${response}=    GET On Session    lunchmonkeys    /api/users/${user_id}
    ...    headers=${headers}
    ...    expected_status=404

    Should Be Equal As Strings    ${response.status_code}    404
