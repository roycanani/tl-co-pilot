from datetime import datetime
from typing import Dict, Any, Optional

from langchain_ollama import ChatOllama
from langchain_core.messages import (
    HumanMessage,
    SystemMessage,
)
from langchain.agents import Tool
from langchain_core.pydantic_v1 import BaseModel, Field

from calendarApi import add_todo, schedule_meeting


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
                f"You are an intelligent and resourceful full stack team leader assistant. Today's date is {current_date}. in timezone UTC"
                "Your role is to analyze meeting transcripts, emails, and other communications to extract actionable insights. "
                "extract as many as possible actionable items from the transcript. "
                "When processing a meeting transcript, for each actionable item you identify, call the appropriate tool separately. "
            )
        )

        self.messages = [self.system_message]

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
            "call as many tools as possible.\n"
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

        for tool_call in result.tool_calls:
            if tool_call["name"] == "schedule_meeting":
                print("Schedule Meeting:", tool_call["args"])
                schedule_meeting.invoke(tool_call["args"])
            elif tool_call["name"] == "add_todo":
                print("Add Todo:", tool_call["args"])
                add_todo.invoke(tool_call["args"])
            else:
                print(f"Unknown tool call: {tool_call.name}")

        return result
