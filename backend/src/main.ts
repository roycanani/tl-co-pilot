import readline from "readline";
import { Agent } from "./agent";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function main() {
  const agent = new Agent("llama3.2");

  // Add tools similar to our previous definitions.
  agent.addTool({
    type: "function",
    function: {
      name: "get_current_weather",
      description: "Get the current weather for a city",
      parameters: {
        type: "object",
        properties: {
          city: {
            type: "string",
            description: "The name of the city",
          },
        },
        required: ["city"],
      },
    },
  });

  agent.addTool({
    type: "function",
    function: {
      name: "upload_post",
      description: "Upload post for social network for animals",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "The title for the post",
          },
          description: {
            type: "string",
            description: "The content of the post",
          },
        },
        required: ["title", "description"],
      },
    },
  });

  const userQuery = await askQuestion("Enter a query: ");
  const response = await agent.trigger(userQuery);
  console.log(response.message.content);
  rl.close();
}

main();
