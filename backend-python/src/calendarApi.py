from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# Use the service account credentials
SERVICE_ACCOUNT_FILE = "credentials.json"  # Path to your service account JSON file
SCOPES = ["https://www.googleapis.com/auth/calendar"]


def postEvent(event):
    """Creates a new event in the Google Calendar."""
    # Authenticate using the service account
    creds = Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE, scopes=SCOPES)

    try:
        service = build("calendar", "v3", credentials=creds)

        # Insert the event into the calendar
        calendar_id = "cb1f39381fb979a0497a127be2b7765ca3dd2fd2286ccf4b4db9494f9ba46eb3@group.calendar.google.com"  # Replace with the secondary calendar ID
        created_event = (
            service.events().insert(calendarId=calendar_id, body=event).execute()
        )

        print(f"Event created: {created_event.get('htmlLink')}")

    except HttpError as error:
        print(f"An error occurred: {error}")

