from fastapi import FastAPI, HTTPException, Request, Response, Depends
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any, List, Union
from agent import Agent
from daily import daily  # Keep this for testing if needed
import calendarApi
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
import secrets

# Create FastAPI app
app = FastAPI(
    title="Team Leader Co-Pilot API",
    description="API for processing meeting transcripts and identifying actionable items",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Add session middleware to handle OAuth state
app.add_middleware(SessionMiddleware, secret_key=secrets.token_urlsafe(32))

# Initialize agent once to be reused across requests
agent = Agent("llama3.2")

# Add tools to the agent during initialization
agent.add_tool(
    {
        "type": "function",
        "function": {
            "name": "add_todo",
            "description": "Add a to-do item",
            "parameters": {
                "type": "object",
                "properties": {
                    "task": {
                        "type": "string",
                        "description": "Description of the task",
                    },
                    "due_date": {
                        "type": "string",
                        "description": "Due date for the task",
                    },
                },
                "required": ["task"],
            },
        },
    }
)

agent.add_tool(
    {
        "type": "function",
        "function": {
            "name": "save_to_database",
            "description": "Save meeting insights in the database",
            "parameters": {
                "type": "object",
                "properties": {
                    "data": {"type": "object", "description": "The data to be saved"}
                },
                "required": ["data"],
            },
        },
    }
)

agent.add_tool(
    {
        "type": "function",
        "function": {
            "name": "schedule_meeting",
            "description": "Post an event to the calendar",
            "parameters": {
                "type": "object",
                "properties": {
                    "summary": {
                        "type": "string",
                        "description": "The name or summary of the event",
                    },
                    "location": {
                        "type": "string",
                        "description": "The location of the event",
                    },
                    "description": {
                        "type": "string",
                        "description": "Details or description of the event",
                    },
                    "start": {
                        "type": "object",
                        "properties": {
                            "dateTime": {
                                "type": "string",
                                "description": "Start time in ISO format",
                            },
                            "timeZone": {
                                "type": "string",
                                "description": "Timezone of the start time",
                            },
                        },
                        "required": ["dateTime", "timeZone"],
                    },
                    "end": {
                        "type": "object",
                        "properties": {
                            "dateTime": {
                                "type": "string",
                                "description": "End time in ISO format",
                            },
                            "timeZone": {
                                "type": "string",
                                "description": "Timezone of the end time",
                            },
                        },
                        "required": ["dateTime", "timeZone"],
                    },
                    "reminders": {
                        "type": "object",
                        "properties": {
                            "useDefault": {
                                "type": "boolean",
                                "description": "Whether to use default reminders",
                            },
                            "overrides": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "method": {
                                            "type": "string",
                                            "description": "Reminder method (e.g., email, popup)",
                                        },
                                        "minutes": {
                                            "type": "integer",
                                            "description": "Minutes before the event to trigger the reminder",
                                        },
                                    },
                                    "required": ["method", "minutes"],
                                },
                            },
                        },
                        "required": ["useDefault"],
                    },
                },
                "required": [
                    "summary",
                    "location",
                    "description",
                    "start",
                    "end",
                    "reminders",
                ],
            },
        },
    }
)


# Define request model
class TranscriptRequest(BaseModel):
    transcript: str
    options: Optional[Dict[str, Any]] = None


# Define response model
class ProcessResponse(BaseModel):
    content: str
    tool_calls: Optional[List[Dict[str, Any]]] = None


@app.post("/process", response_model=ProcessResponse)
async def process_transcript(request: TranscriptRequest):
    try:
        response = agent.trigger(request.transcript)
        return ProcessResponse(
            content=response.get("content", ""),
            tool_calls=response.get("tool_calls", []),
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error processing transcript: {str(e)}"
        )


# For local testing
@app.get("/test")
async def test_with_sample():
    response = agent.trigger(daily)
    return ProcessResponse(
        content=response.get("content", ""), tool_calls=response.get("tool_calls", [])
    )


@app.get("/authorize")
async def authorize(request: Request):
    authorization_url, state = calendarApi.get_authorization_url()
    request.session["oauth_state"] = state

    return {"authorization_url": authorization_url}


@app.get("/oauth2callback")
async def oauth2callback(request: Request, code: str, state: Optional[str] = None):
    session_state = request.session.get("oauth_state")
    if not session_state or state != session_state:
        raise HTTPException(status_code=400, detail="Invalid OAuth state")

    try:
        calendarApi.get_credentials_from_code(code)
        return {"message": "Authentication successful! You can close this window."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Authentication error: {str(e)}")


@app.get("/auth/status")
async def auth_status():
    """Check if user is authorized."""
    return {"authorized": calendarApi.is_authorized()}


# ... [existing endpoints remain unchanged] ...

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
