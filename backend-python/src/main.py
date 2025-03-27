from agent import Agent


def main():
    agent = Agent("llama3.2")
    agent.add_tool(
        {
            "type": "function",
            "function": {
                "name": "get_current_weather",
                "description": "Get the current weather for a city",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "city": {
                            "type": "string",
                            "description": "The name of the city",
                        },
                    },
                    "required": ["city"],
                },
            },
        },
    )
    agent.add_tool(
        {
            "type": "function",
            "function": {
                "name": "upload_post",
                "description": "Upload post for social network for animals",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "title": {
                            "type": "string",
                            "description": "The title for the post",
                        },
                        "description": {
                            "type": "string",
                            "description": "The content of the post",
                        },
                    },
                    "required": ["title", "description"],
                },
            },
        },
    )
    # user_query = "Upload please post in my social network that will introduce me as a helpful assistant."
    user_query = input("Enter a query: ")
    response = agent.trigger(user_query)
    print(response.content)


if __name__ == "__main__":
    main()
