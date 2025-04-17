from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from google.auth.transport.requests import Request
import os.path
import pickle
import json
from typing import Optional, Tuple

# OAuth configuration
CLIENT_SECRETS_FILE = "client_secret.json"  # Path to OAuth client secrets JSON
TOKEN_FILE = "token.pickle"  # Path to store user tokens
SCOPES = [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/tasks",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "openid",
]
REDIRECT_URI = "http://localhost:8000/oauth2callback"


def create_flow() -> Flow:
    """Create an OAuth flow object."""
    with open(CLIENT_SECRETS_FILE, "r") as f:
        client_config = json.load(f)

    flow = Flow.from_client_config(
        client_config, scopes=SCOPES, redirect_uri=REDIRECT_URI
    )
    return flow


def get_authorization_url() -> Tuple[str, str]:
    """Get authorization URL for OAuth flow."""
    flow = create_flow()
    authorization_url, state = flow.authorization_url(
        access_type="offline", include_granted_scopes="true", prompt="consent"
    )
    return authorization_url, state


def get_credentials_from_code(code: str) -> Credentials:
    """Exchange authorization code for credentials."""
    flow = create_flow()
    flow.fetch_token(code=code)
    creds = flow.credentials

    # Save the credentials for future runs
    with open(TOKEN_FILE, "wb") as token:
        pickle.dump(creds, token)

    return creds


def get_credentials() -> Optional[Credentials]:
    """Get valid user credentials from storage or return None."""
    creds = None
    # Load credentials from token file if it exists
    if os.path.exists(TOKEN_FILE):
        with open(TOKEN_FILE, "rb") as token:
            creds = pickle.load(token)

    # If credentials exist and are valid, return them
    if creds and creds.valid:
        return creds

    # If credentials exist but are expired and have refresh token, refresh them
    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
        with open(TOKEN_FILE, "wb") as token:
            pickle.dump(creds, token)
        return creds

    # Otherwise return None to indicate new authorization is needed
    return None


def is_authorized() -> bool:
    """Check if we have valid credentials."""
    return get_credentials() is not None
