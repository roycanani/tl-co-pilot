from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from pydantic import BaseModel
from typing import Dict, Any
import requests

# Import authentication functions
from auth import get_credentials


class Event(BaseModel):
    """Represents an event in the Google Calendar."""

    summary: str
    location: str
    description: str
    start: dict
    end: dict
    reminders: dict


def postEvent(event: Event) -> Dict[str, Any]:
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

        # requests.post(
        #     "http://localhost:3000/events",
        #     headers={
        #         "accept": "application/json, text/plain, */*",
        #     },
        #     json=created_event,
        #     verify=False,
        # )
        print(f"Event created: {created_event}")

        return created_event

    except HttpError as error:
        print(f"An error occurred: {error}")
        raise
