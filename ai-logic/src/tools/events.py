from googleapiclient.discovery import build
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
        description="The start time with 'dateTime' and 'timeZone' fields inside dictionary."
    )
    end: Dict[str, str] = Field(
        description="The end time with 'dateTime' and 'timeZone' fields inside dictionary."
    )
    reminders: Dict[str, bool] = Field(
        description="The reminders for the event, defaults to using default reminders."
    )


@tool(
    name_or_callable="schedule_meeting",
    args_schema=Event.model_json_schema(),
    parse_docstring=True,
)
def schedule_meeting(
    credentials: str,
    summary: str,
    location: str,
    description: str,
    start: Dict[str, str],  # Changed from EventTime to Dict
    end: Dict[str, str],  # Changed from EventTime to Dict
    reminders: Dict[str, bool] = {"useDefault": True},  # Changed from EventReminders
) -> Dict[str, Any]:
    """
    Creates a new event in the Google Calendar.

    Args:
        summary (str): The summary of the event.
        location (str): The location of the event.
        description (str): The description of the event.
        start (dict): The start time with "dateTime" and optional "timeZone" fields.
        end (dict): The end time with "dateTime" and optional "timeZone" fields.
        reminders (dict): The reminders for the event, defaults to using default reminders.
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
            "http://localhost:3000/events",
            headers={
                "accept": "application/json, text/plain, */*",
            },
            json=created_event,
            verify=False,
        )
        print(f"Event created: {created_event}")

        return created_event

    except HttpError as error:
        print(f"An error occurred: {error}")
        raise
