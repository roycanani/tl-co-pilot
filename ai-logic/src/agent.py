from datetime import datetime
import json
import ollama
from ollama._types import Message
from tools.posts import upload_post
from tools.events import Event, postEvent
from tools.tasks import Task, postTask


class Agent:
    def __init__(self, model):
        self.model = model
        self.tools = []
        current_date = datetime.now().strftime("%Y-%m-%d")

        self.conversation = [
            {
                "role": "system",
                "content": (
                    f"You are an intelligent and resourceful full stack team leader assistant. Today's date is {current_date}. "
                    "Your role is to analyze meeting transcripts, emails, and other communications to extract actionable insights. "
                    "When processing a meeting transcript, for each actionable item you identify, call the appropriate tool separately. "
                    "\n\nTool calling examples:\n"
                    "1. For scheduling meetings, use the exact format:\n"
                    "   schedule_meeting({\n"
                    '     "summary": "Meeting Title",\n'
                    '     "location": "Meeting Room",\n'
                    '     "description": "Meeting description",\n'
                    '     "start": {"dateTime": "2023-03-28T10:00:00", "timeZone": "UTC"},\n'
                    '     "end": {"dateTime": "2023-03-28T11:00:00", "timeZone": "UTC"},\n'
                    '     "reminders": {"useDefault": true}\n'
                    "   })\n\n"
                    "2. For adding tasks, use:\n"
                    "   add_task({\n"
                    '     "title": "Follow up with team member",\n'
                    '     "notes": "Discuss project updates",\n'
                    f'     "due": "{current_date}T17:00:00Z"\n'
                    "   })\n\n"
                    "Make sure to generate separate tool calls for each actionable insight, even if there are multiple in one transcript. "
                    "Provide clear, concise responses that help the team leader stay organized."
                ),
            }
        ]

    def add_tool(self, tool_definition):
        self.tools.append(tool_definition)

    def trigger(self, user_query):
        self.conversation.append(
            {
                "role": "user",
                "content": (
                    "Analyze this meeting transcript and identify ALL actionable items. For EACH item:\n"
                    "1. If it mentions a meeting or sync (like 'sync with X', 'meet with Y', etc.), call schedule_meeting with appropriate details\n"
                    "2. If it mentions tasks, follow-ups, or action items (like 'check with X', 'follow up on Y', etc.), call add_task for EACH task\n"
                    "Make sure to generate SEPARATE tool calls for EACH identified item. Don't combine multiple actions into one tool call.\n"
                    "Here's the transcript:\n\n"
                    f"{user_query}"
                ),
            }
        )
        response: ollama.ChatResponse = ollama.chat(
            model=self.model, messages=self.conversation, tools=self.tools
        )
        self.conversation.append(response.get("message", {}))
        print("Response from model:")
        print(len(response.message.tool_calls))
        print(response.message.tool_calls)
        # Check for tool calls and iterate until no tool call is returned.
        while response.message.tool_calls:
            for tool_call in response.message.tool_calls:
                tool_result = self._handle_tool_call(tool_call)
                # Append the tool result to the conversation
                self.conversation.append({"role": "tool", "content": tool_result})
            # Continue the conversation with the tool result as context
            # print(*self.conversation, sep="\n")
            response = ollama.chat(
                model=self.model, messages=self.conversation, tools=self.tools
            )
            self.conversation.append(response.get("message", {}))
        return response.get("message", {})

    def _handle_tool_call(self, tool_call: Message.ToolCall) -> str:
        tool_call = tool_call.function
        # Extract function name and parameters from the tool call request.
        function_name = tool_call.get("name")
        parameters = tool_call.get("arguments", {})
        if function_name == "get_current_weather":
            city = parameters.get("city", "Unknown City")
            # Simulate a weather API call; replace with a real API call if needed.
            return f"The current weather in {city} is sunny with 25°C."
        elif function_name == "upload_post":
            title = parameters.get("title", "No Title")
            description = parameters.get("description", "No Description")
            # Call the upload_post function from the tools module.
            upload_post(title, description)
            return "Post uploaded successfully"
        elif function_name == "schedule_meeting":
            try:
                # Create safe default objects
                current_date = datetime.now().strftime("%Y-%m-%d")
                start_dict = {"dateTime": current_date, "timeZone": "UTC"}
                end_dict = {"dateTime": current_date, "timeZone": "UTC"}

                # Handle start parameter
                if parameters.get("start"):
                    if isinstance(parameters["start"], str):
                        try:
                            start_dict = json.loads(parameters["start"])
                        except json.JSONDecodeError:
                            pass
                    elif isinstance(parameters["start"], dict):
                        start_dict = parameters["start"]

                # Handle end parameter
                if parameters.get("end"):
                    if isinstance(parameters["end"], str):
                        try:
                            end_dict = json.loads(parameters["end"])
                        except json.JSONDecodeError:
                            pass
                    elif isinstance(parameters["end"], dict):
                        end_dict = parameters["end"]

                # Update the parameters with properly formatted objects
                parameters["start"] = start_dict
                parameters["end"] = end_dict

                postEvent(Event.model_validate(parameters))

                return (
                    f"Event '{parameters.get('summary', 'No Summary')}' at '{parameters.get('location', 'No Location')}' "
                    f"has been scheduled.\nDescription: {parameters.get('description', 'No Description')}\n"
                    f"Start: {start_dict.get('dateTime', 'No Start Time')} "
                    f"({start_dict.get('timeZone', 'No Timezone')})\n"
                    f"End: {end_dict.get('dateTime', 'No End Time')} "
                    f"({end_dict.get('timeZone', 'No Timezone')})\n"
                    f"Reminders: {parameters.get('reminders', {})}"
                )
            except Exception as e:
                print(f"Error in schedule_meeting: {e}")
                print(f"Parameters received: {parameters}")
                return f"Error scheduling meeting: {str(e)}"
        elif function_name == "add_task":
            try:
                postTask(Task.model_validate(parameters))
            except Exception as e:
                print(f"Error in add_task: {e}")
                print(f"Parameters received: {parameters}")
                return f"Error add_task: {str(e)}"

        else:
            print("Unknown tool call.")
            return "Unknown tool call."
