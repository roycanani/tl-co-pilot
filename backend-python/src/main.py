from agent import Agent
from daily import daily


def main():
    agent = Agent("llama3.2")
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
        },
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
                        "data": {
                            "type": "object",
                            "description": "The data to be saved",
                        },
                    },
                    "required": ["data"],
                },
            },
        },
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
        },
    )
    # user_query = "Upload please post in my social network that will introduce me as a helpful assistant."
    # user_query = input("Enter a query: ")
    user_query = daily
    response = agent.trigger(user_query)
    print(response.content)


if __name__ == "__main__":
    main()
