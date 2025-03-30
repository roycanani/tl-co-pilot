from datetime import datetime
import json
from typing import List, Dict, Any, Optional

from langchain_ollama import ChatOllama
from langchain.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.messages import (
    HumanMessage,
    SystemMessage,
    AIMessage,
    ToolMessage,
    BaseMessage,
    ChatMessage,
)
from langchain.agents import Tool, create_tool_calling_agent
from langchain_core.tools import BaseTool
from langchain.agents import create_openai_functions_agent
from langchain.agents import AgentExecutor
from langchain_core.pydantic_v1 import BaseModel, Field

from tools import upload_post
from calendarApi import Event, add_todo, schedule_meeting


class AddTodoInput(BaseModel):
    task: str = Field(description="Description of the task")
    due_date: Optional[str] = Field(description="Due date for the task")


class ScheduleMeetingInput(BaseModel):
    summary: str = Field(description="The name or summary of the event")
    location: str = Field(description="The location of the event")
    description: str = Field(description="Details or description of the event")
    start: Dict[str, str] = Field(description="Start time with dateTime and timeZone")
    end: Dict[str, str] = Field(description="End time with dateTime and timeZone")
    reminders: Dict[str, Any] = Field(description="Reminder settings")


class Agent:
    def __init__(self, model):
        self.model_name = model
        self.llm = ChatOllama(model=model, temperature=0.0)
        self.tools = []
        self.langchain_tools = []
        current_date = datetime.now().strftime("%Y-%m-%d")

        self.system_message = SystemMessage(
            content=(
                f"You are an intelligent and resourceful full stack team leader assistant. Today's date is {current_date}. "
                "Your role is to analyze meeting transcripts, emails, and other communications to extract actionable insights. "
                "extract as many as possible actionable items from the transcript. "
                "When processing a meeting transcript, for each actionable item you identify, call the appropriate tool separately. "
            )
        )

        self.messages = [self.system_message]

        # Initialize default tools
        self._initialize_default_tools()

    def _initialize_default_tools(self):
        # Add todo tool
        self.add_tool(
            {
                "type": "function",
                "function": {
                    "name": "add_todo",
                    "description": "Add a to-do item",
                    "parameters": AddTodoInput.schema(),
                },
            }
        )

        # Schedule meeting tool
        self.add_tool(
            {
                "type": "function",
                "function": {
                    "name": "schedule_meeting",
                    "description": "Post an event to the calendar",
                    "parameters": ScheduleMeetingInput.schema(),
                },
            }
        )

    def add_todo(self, task: str, due_date: Optional[str] = None) -> str:
        """Add a to-do item to the task list."""
        # This would typically connect to a task management system
        print(f"Adding todo: {task} due {due_date}")
        return f"Added todo: {task}" + (f" due {due_date}" if due_date else "")

    def schedule_meeting(
        self,
        summary: str,
        location: str,
        description: str,
        start: Dict[str, str],
        end: Dict[str, str],
        reminders: Dict[str, Any],
    ) -> str:
        """Schedule a meeting in the calendar."""
        try:
            event_data = {
                "summary": summary,
                "location": location,
                "description": description,
                "start": start,
                "end": end,
                "reminders": reminders,
            }
            schedule_meeting(Event.model_validate(event_data))

            return (
                f"Event '{summary}' at '{location}' has been scheduled.\n"
                f"Description: {description}\n"
                f"Start: {start.get('dateTime', 'No Start Time')} "
                f"({start.get('timeZone', 'No Timezone')})\n"
                f"End: {end.get('dateTime', 'No End Time')} "
                f"({end.get('timeZone', 'No Timezone')})\n"
                f"Reminders: {reminders}"
            )
        except Exception as e:
            print(f"Error in schedule_meeting: {e}")
            return f"Error scheduling meeting: {str(e)}"

    def add_tool(self, tool_definition):
        self.tools.append(tool_definition)

        # Convert to LangChain tool format
        function_def = tool_definition["function"]
        name = function_def["name"]
        description = function_def["description"]

        if name == "add_todo":
            langchain_tool = Tool(
                name=name, description=description, func=self.add_todo
            )
        elif name == "schedule_meeting":
            langchain_tool = Tool(
                name=name, description=description, func=self.schedule_meeting
            )
        else:
            print(f"Unknown tool: {name}")
            return

        self.langchain_tools.append(langchain_tool)

    def trigger(self, user_query):
        # Format the user input with instructions
        user_input = HumanMessage(
            "Analyze this meeting transcript and identify ALL actionable items. For EACH item:\n"
            "1. If it mentions a meeting or sync (like 'sync with X', 'meet with Y', etc.), call schedule_meeting with appropriate details\n"
            "2. If it mentions tasks, follow-ups, or action items (like 'check with X', 'follow up on Y', etc.), call add_todo for EACH task\n"
            "Make sure to generate SEPARATE tool calls for EACH identified item. Don't combine multiple actions into one tool call.\n"
            f"Here's the transcript:\n\n{user_query}",
        )

        # TODO convert to LangGraph for multiagent (instead of deprecated initialize_agent)

        # agent = create_tool_calling_agent(
        #     llm=self.llm,
        #     tools=self.langchain_tools,
        #     # agent_type="zero-shot-react-description",
        #     prompt=ChatPromptTemplate.from_messages(
        #         [
        #             ("system", self.system_message.content),
        #             ("placeholder", "{chat_history}"),
        #             ("human", "{input}"),
        #             ("placeholder", "{agent_scratchpad}"),
        #         ]
        #     ),
        # )
        # agent_executor = AgentExecutor(
        #     agent=agent,
        #     tools=[schedule_meeting, add_todo],
        #     verbose=True,
        # )
        # result = agent_executor.invoke({"input": user_input.content})

        # TODO Consider move to agent executor

        result = self.llm.bind_tools([schedule_meeting, add_todo]).invoke(
            [self.system_message, user_input]
        )
        print("result", result)

        for tool_call in result.tool_calls:
            print(tool_call)

        # # Process the response to match the expected format
        # response = {
        #     "content": result.get("output", ""),
        #     "tool_calls": [],  # LangChain handles tool calls internally
        # }

        return result
