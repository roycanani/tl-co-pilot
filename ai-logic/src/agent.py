from datetime import datetime
from langchain_ollama import ChatOllama
from langchain_core.messages import (
    HumanMessage,
    SystemMessage,
)

from tools.events import schedule_meeting
from tools.tasks import add_todo
from langchain_google_genai import ChatGoogleGenerativeAI


class Agent:
    def __init__(self, model):
        self.model_name = model
        # self.llm = ChatOllama(model=model, temperature=0.0) For local run
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash-preview-05-20",
            temperature=0,
            max_tokens=None,
            timeout=None,
            max_retries=2,
            # other params...
        )
        self.tools = []
        self.langchain_tools = []
        current_date = datetime.now().strftime("%Y-%m-%d")

        self.system_message = SystemMessage(
            content=(
                f"You are an intelligent and resourceful full stack team leader assistant. Today's date is {current_date}. in timezone UTC"
                "Your role is to analyze meeting transcripts, emails, and other communications to extract actionable insights. "
                "extract as many as possible actionable items from the transcript. "
                "When processing a meeting transcript, for each actionable item you identify, call the appropriate tool separately. "
            )
        )

        self.messages = [self.system_message]

    def trigger(self, user_query, credentials):
        # Format the user input with instructions
        user_input = HumanMessage(
            "Analyze this meeting transcript and identify ALL actionable items. For EACH item:\n"
            "1. If it mentions a meeting or sync (like 'sync with X', 'meet with Y', etc.), call schedule_meeting with appropriate details\n"
            "2. If it mentions tasks, follow-ups, or action items (like 'check with X', 'follow up on Y', etc.), call add_todo for EACH task\n"
            "Make sure to generate SEPARATE tool calls for EACH identified item. Don't combine multiple actions into one tool call.\n"
            "call as many tools as possible.\n"
            f"Here's the transcript:\n\n{user_query}",
        )
        print("triggered with user input:", user_query)

        # TODO convert to LangGraph for multiagent (instead of deprecated initialize_agent)

        # TODO Consider move to agent executor
        result = self.llm.bind_tools([schedule_meeting, add_todo]).invoke(
            [self.system_message, user_input]
        )

        for tool_call in result.tool_calls:
            if tool_call["name"] == "schedule_meeting":
                print("Schedule Meeting:", tool_call["args"])
                tool_call["args"]["credentials"] = credentials
                schedule_meeting.invoke(tool_call["args"])
            elif tool_call["name"] == "add_todo":
                print("Add Todo:", tool_call["args"])
                tool_call["args"]["credentials"] = credentials
                add_todo.invoke(tool_call["args"])
            else:
                print(f"Unknown tool call: {tool_call.name}")

        return "success_to_process"
