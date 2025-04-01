from fastapi import FastAPI, HTTPException, Request, Response, Depends
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any, List, Union
from agent import Agent
from daily import daily  # Keep this for testing if needed
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
import secrets


from auth import get_authorization_url, get_credentials_from_code, is_authorized

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
# agent = Agent("llama3.1")
agent = Agent("qwen2.5")


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
    return response


@app.get("/authorize")
async def authorize(request: Request):
    authorization_url, state = get_authorization_url()
    request.session["oauth_state"] = state

    return {"authorization_url": authorization_url}


@app.get("/oauth2callback")
async def oauth2callback(request: Request, code: str, state: Optional[str] = None):
    session_state = request.session.get("oauth_state")
    if not session_state or state != session_state:
        raise HTTPException(status_code=400, detail="Invalid OAuth state")

    try:
        get_credentials_from_code(code)
        return {"message": "Authentication successful! You can close this window."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Authentication error: {str(e)}")


@app.get("/auth/status")
async def auth_status():
    """Check if user is authorized."""
    return {"authorized": is_authorized()}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
