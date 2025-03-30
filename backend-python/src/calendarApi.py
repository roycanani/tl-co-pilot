from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from pydantic import BaseModel
import os.path
import pickle
import json
from typing import Optional

# OAuth configuration
CLIENT_SECRETS_FILE = "client_secret.json"  # Path to OAuth client secrets JSON
TOKEN_FILE = "token.pickle"  # Path to store user tokens
SCOPES = ["https://www.googleapis.com/auth/calendar"]
REDIRECT_URI = "http://localhost:8000/oauth2callback"


class Event(BaseModel):
    """Represents an event in the Google Calendar."""

    summary: str
    location: str
    description: str
    start: dict
    end: dict
    reminders: dict


def create_flow():
    """Create an OAuth flow object."""
    with open(CLIENT_SECRETS_FILE, "r") as f:
        client_config = json.load(f)

    flow = Flow.from_client_config(
        client_config, scopes=SCOPES, redirect_uri=REDIRECT_URI
    )
    return flow


def get_authorization_url():
    """Get authorization URL for OAuth flow."""
    flow = create_flow()
    authorization_url, state = flow.authorization_url(
        access_type="offline", include_granted_scopes="true", prompt="consent"
    )
    return authorization_url, state


def get_credentials_from_code(code: str):
    flow = create_flow()
    flow.fetch_token(code=code)
    creds = flow.credentials

    # Save the credentials for future runs
    with open(TOKEN_FILE, "wb") as token:
        pickle.dump(creds, token)

    return creds


def get_credentials():
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


def is_authorized():
    """Check if we have valid credentials."""
    return get_credentials() is not None


def postEvent(event: Event):
    """Creates a new event in the Google Calendar."""
    # Get user credentials through OAuth
    creds = get_credentials()
    if not creds:
        raise Exception("Not authorized. User must complete OAuth flow first.")

    try:
        service = build("calendar", "v3", credentials=creds)

        # Convert Pydantic model to dictionary
        event_dict = event.model_dump()

        # Insert the event into the calendar
        calendar_id = "primary"  # Uses the authenticated user's primary calendar
        created_event = (
            service.events().insert(calendarId=calendar_id, body=event_dict).execute()
        )

        print(f"Event created: {created_event.get('htmlLink')}")
        return created_event

    except HttpError as error:
        print(f"An error occurred: {error}")
        raise
