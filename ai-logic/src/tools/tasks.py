from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from pydantic import BaseModel
from typing import Dict, Any
import requests

# Import authentication functions
from auth import get_credentials


class Task(BaseModel):
    """Represents a task in Google Tasks."""

    title: str
    notes: str
    due: str  # ISO 8601 format (e.g., "2025-03-31T10:00:00Z")


def postTask(task: Task) -> Dict[str, Any]:
    """Creates a new task in Google Tasks."""
    # Get user credentials through OAuth
    creds = get_credentials()
    if not creds:
        raise Exception("Not authorized. User must complete OAuth flow first.")

    try:
        service = build("tasks", "v1", credentials=creds)

        # Convert Pydantic model to dictionary
        task_dict = task.model_dump()

        # Insert the task into the default task list
        tasklist_id = "@default"  # Uses the authenticated user's default task list
        created_task = (
            service.tasks().insert(tasklist=tasklist_id, body=task_dict).execute()
        )

        # requests.post(
        #     "http://localhost:3000/tasks",
        #     headers={
        #         "accept": "application/json, text/plain, */*",
        #     },
        #     json=created_task,
        #     verify=False,
        # )

        print(f"Task created: {created_task}")
        return created_task

    except HttpError as error:
        print(f"An error occurred: {error}")
        raise
