from google.oauth2.credentials import Credentials
from config import settings
from typing import Optional

import requests

CLIENT_ID = settings.google_client_id
CLIENT_SECRET = settings.google_client_secret
CLIENT_SECRETS_FILE = "client_secret.json"  # Path to OAuth client secrets JSON
TOKEN_FILE = "token.pickle"  # Path to store user tokens
TOKEN_URI = "https://oauth2.googleapis.com/token"


def get_credentials(user_id: str) -> Optional[Credentials]:
    """Get valid user credentials from storage or return None."""
    print("Getting credentials for user:", user_id)
    data = requests.get(f"http://auth:4000/users/{user_id}/token")
    if data.status_code == 200:
        print("Credentials fetched successfully.")
        access_token = data.json().get("accessToken")
        refresh_token = data.json().get("refreshToken")
        if access_token:
            # Load the credentials from the token
            print(access_token)
            print(refresh_token)
            creds = Credentials(
                token=access_token,
                refresh_token=refresh_token,
                token_uri=TOKEN_URI,
                client_id=CLIENT_ID,
                client_secret=CLIENT_SECRET,
                scopes=settings.SCOPES,
            )
            print("Credentials loaded successfully.")
            print("Credentials:", creds)
            return creds
        else:
            print("No access token found in response.")
            return None
    else:
        print(f"Failed to fetch credentials: {data.status_code} - {data.text}")
        return None
