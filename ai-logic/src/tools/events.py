from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from googleapiclient.errors import HttpError
from pydantic import BaseModel, Field
from typing import Dict, Any
from langchain_core.tools import tool
import requests

# Import authentication functions
from auth import get_credentials


class EventTime(BaseModel):
    """Represents the start or end time of an event."""

    dateTime: str
    timeZone: str = "UTC"


class EventReminders(BaseModel):
    """Represents the reminders for an event."""

    useDefault: bool = True


class Event(BaseModel):
    """Represents an event in the Google Calendar."""

    summary: str = Field(description="The summary of the event.")
    location: str = Field(
        description="The location of the event.",
    )
    description: str = Field(
        description="The description of the event.",
    )
    start: Dict[str, str] = Field(
        description="The start time with 'dateTime' and 'timeZone' fields inside dictionary.",
        examples=[{"dateTime": "2025-04-15T10:00:00Z", "timeZone": "UTC"}]
    )
    end: Dict[str, str] = Field(
        description="The end time with 'dateTime' and 'timeZone' fields inside dictionary.",
        examples=[{"dateTime": "2025-04-15T11:00:00Z", "timeZone": "UTC"}]
    )
    reminders: Dict[str, bool] = Field(
        description="The reminders for the event, defaults to using default reminders.",
        default_factory=lambda: {"useDefault": True},
        examples=[{"useDefault": True}],
    )


@tool(
    name_or_callable="schedule_meeting",
    args_schema=Event.model_json_schema(),
    parse_docstring=True,
)
def schedule_meeting(
    credentials: Credentials,
    user_id: str,
    summary: str,
    location: str,
    description: str,
    start: Dict[str, str],
    end: Dict[str, str],
    reminders: Dict[str, bool] = {"useDefault": True},
) -> Dict[str, Any]:
    """
    Creates a new event in the Google Calendar.

    Args:
        summary (str): The summary of the event.
        location (str): The location of the event.
        description (str): The description of the event.
        start (dict): The start time with "dateTime" and optional "timeZone" fields.
        end (dict): The end time with "dateTime" and optional "timeZone" fields.
        reminders (dict): The reminders for the event, defaults to using default reminders. e.g., {"useDefault": True}.
    
    Example:
        {
            "summary": "Team Meeting",
            "location": "Conference Room A",
            "description": "Discuss project updates and next steps.",
            "start": {"dateTime": "2025-04-15T10:00:00Z", "timeZone": "UTC"},
            "end": {"dateTime": "2025-04-15T11:00:00Z", "timeZone": "UTC"},
            "reminders": {"useDefault": True}
        }

    Returns:
        Dict[str, Any]: The created event details.
    """
    # Get user credentials through OAuth
    try:
        service = build("calendar", "v3", credentials=credentials)

        # Convert Pydantic model to dictionary
        event_dict = Event.model_validate(
            Event(
                summary=summary,
                location=location,
                description=description,
                start=start,
                end=end,
                reminders=reminders,
            )
        ).model_dump()

        # Insert the event into the calendar
        calendar_id = "primary"  # Uses the authenticated user's primary calendar
        created_event = (
            service.events().insert(calendarId=calendar_id, body=event_dict).execute()
        )

        requests.post(
            "http://storage:3000/events",
            headers={
                "accept": "application/json, text/plain, */*",
            },
            json={**created_event, "userId": user_id},
            verify=False,
        )
        print(f"Event created: {created_event}")

        return created_event

    except HttpError as error:
        print(f"An error occurred: {error}")
        raise
