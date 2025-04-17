from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from pydantic import BaseModel, Field
from typing import Dict, Any
from langchain_core.tools import tool
import requests

# Import authentication functions
from auth import get_credentials


class Task(BaseModel):
    """Represents a task in Google Tasks."""

    title: str = Field(description="The title of the task.")
    notes: str = Field(
        description="The notes or description of the task.",
    )
    due: str = Field(
        description="The due date and time of the task in ISO 8601 format (e.g., '2025-03-31T10:00:00Z').",
        examples=["2025-04-15T14:00:00Z"],
    )


@tool(
    name_or_callable="add_todo",
    args_schema=Task.model_json_schema(),
    parse_docstring=True,
)
def add_todo(title: str, notes: str, due: str) -> Dict[str, Any]:
    """
    Creates a new task in Google Tasks.

    Args:
        title (str): The title of the task.
        notes (str): The notes or description of the task.
        due (str): The due date and time of the task in ISO 8601 format (e.g., "2025-03-31T10:00:00Z").
    """
    # Get user credentials through OAuth
    creds = get_credentials()
    if not creds:
        raise Exception("Not authorized. User must complete OAuth flow first.")

    # TODO - remove this after fix llm hilosinations
    if isinstance(due, dict):
        if "dateTime" in due:
            due = due["dateTime"]
        elif "date" in due:
            due = due["date"] + "T00:00:00Z"

    try:
        service = build("tasks", "v1", credentials=creds)

        # Convert Pydantic model to dictionary
        task_dict = Task(
            title=title,
            notes=notes,
            due=due,
        ).model_dump()

        print(task_dict)

        # Insert the task into the default task list
        tasklist_id = "@default"  # Uses the authenticated user's default task list
        created_task = (
            service.tasks().insert(tasklist=tasklist_id, body=task_dict).execute()
        )

        requests.post(
            "http://localhost:3000/tasks",
            headers={
                "accept": "application/json, text/plain, */*",
            },
            json=created_task,
            verify=False,
        )

        print(f"Task created: {created_task}")
        return created_task

    except HttpError as error:
        print(f"An error occurred: {error}")
        raise
