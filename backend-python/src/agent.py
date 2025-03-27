import ollama
from ollama._types import Message
from tools import upload_post


class Agent:
    def __init__(self, model):
        self.model = model
        self.tools = []
        self.conversation = [
            {
                "role": "system",
                "content": "You are a helpful assistant that provides clear answers.",
                # "content": (
                #     "You are an intelligent and resourceful full stack team leader assistant. "
                #     "Your role is to analyze meeting transcripts, emails, and other communications "
                #     "to extract actionable insights and help manage the team's tasks and schedules. "
                #     "When a meeting or email is processed, identify key tasks, deadlines, and events, "
                #     "and trigger appropriate tool calls to update third party services such as Google Calendar "
                #     "and Google TODO. Provide clear, concise, and context-aware responses that help the team leader "
                #     "stay organized and focused on their mission. "
                #     "If necessary, ask for additional context to perform a precise and effective action."
                # ),
            }
        ]

    def add_tool(self, tool_definition):
        self.tools.append(tool_definition)

    def trigger(self, user_query):
        self.conversation.append({"role": "user", "content": user_query})
        response: ollama.ChatResponse = ollama.chat(
            model=self.model, messages=self.conversation, tools=self.tools
        )
        self.conversation.append(response.get("message", {}))

        # Check for tool calls and iterate until no tool call is returned.
        while response.message.tool_calls:
            for tool_call in response.message.tool_calls:
                tool_result = self._handle_tool_call(tool_call)
                # Append the tool result to the conversation
                self.conversation.append({"role": "tool", "content": tool_result})
            # Continue the conversation with the tool result as context
            print(*self.conversation, sep="\n")
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
        else:
            print("Unknown tool call.")
            return "Unknown tool call."
