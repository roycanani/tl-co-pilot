from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from pydantic import BaseModel
from typing import Dict, Any, Optional
from langchain_core.tools import tool

# Import authentication functions
from auth import get_credentials

# OAuth configuration
CLIENT_SECRETS_FILE = "client_secret.json"  # Path to OAuth client secrets JSON
TOKEN_FILE = "token.pickle"  # Path to store user tokens
SCOPES = ["https://www.googleapis.com/auth/calendar"]
REDIRECT_URI = "http://localhost:8000/oauth2callback"


class EventTime(BaseModel):
    """Represents the start or end time of an event."""

    dateTime: str
    timeZone: str = "UTC"


class EventReminders(BaseModel):
    """Represents the reminders for an event."""

    useDefault: bool = True


class Event(BaseModel):
    """Represents an event in the Google Calendar."""

    summary: str
    location: str
    description: str
    start: EventTime
    end: EventTime
    reminders: EventReminders


@tool(
    name_or_callable="schedule_meeting",
    args_schema=Event.model_json_schema(),
    parse_docstring=True,
)
def schedule_meeting(
    summary: str,
    location: str,
    description: str,
    start: EventTime,
    end: EventTime,
    reminders: EventReminders,
) -> Dict[str, Any]:
    """
    Creates a new event in the Google Calendar.

    Args:
        summary (str): The summary of the event.
        location (str): The location of the event.
        description (str): The description of the event.
        start (EventTime): The start time of the event.
        end (EventTime): The end time of the event.
        reminders (EventReminders): The reminders for the event.
    """
    # Get user credentials through OAuth
    creds = get_credentials()
    if not creds:
        raise Exception("Not authorized. User must complete OAuth flow first.")

    try:
        service = build("calendar", "v3", credentials=creds)

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

        print(f"Event created: {created_event.get('htmlLink')}")
        return created_event

    except HttpError as error:
        print(f"An error occurred: {error}")
        raise


class TodoItem(BaseModel):
    """Represents a to-do item."""

    task: str
    due_date: str


@tool(
    name_or_callable="add_todo",
    args_schema=TodoItem.model_json_schema(),
    parse_docstring=True,
)
def add_todo(task: str, due_date: str) -> str:
    """
    Add a to-do item to the task list.

    Args:
        task (str): The task to be added.
        due_date (Optional[str]): The due date for the task.
    """
    # This would typically connect to a task management system
    print(f"Adding todo: {task} due {due_date}")
    return f"Added todo: {task}" + (f" due {due_date}" if due_date else "")
