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


class Event(BaseModel):
    """Represents an event in the Google Calendar."""

    summary: str
    location: str
    description: str
    start: dict
    end: dict
    reminders: dict


# @tool(name_or_callable="schedule_meeting", args_schema=Event.model_json_schema())
@tool
def schedule_meeting(event: Event) -> Dict[str, Any]:
    """
    Creates a new event in the Google Calendar.

    Args:
        event (Event): The event to be scheduled.
    """
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


@tool
def add_todo(task: str, due_date: Optional[str] = None) -> str:
    """
    Add a to-do item to the task list.

    Args:
        task (str): The task to be added.
        due_date (Optional[str]): The due date for the task.
    """
    # This would typically connect to a task management system
    print(f"Adding todo: {task} due {due_date}")
    return f"Added todo: {task}" + (f" due {due_date}" if due_date else "")
