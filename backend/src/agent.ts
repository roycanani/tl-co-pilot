import { uploadPost, getCurrentWeather } from "./tools";
import ollama, { ChatResponse, Message, Tool, ToolCall } from "ollama";

export class Agent {
  private model: string;
  private tools: Tool[] = [];
  private conversation: Message[] = [
    {
      role: "system",
      content: "You are a helpful assistant that provides clear answers.",
    },
  ];

  constructor(model: string) {
    this.model = model;
  }

  public addTool(toolDefinition: Tool) {
    this.tools.push(toolDefinition);
  }

  public async trigger(userQuery: string): Promise<ChatResponse> {
    // Append the user query to conversation.
    this.conversation.push({ role: "user", content: userQuery });
    let response = await ollama.chat({
      model: this.model,
      messages: this.conversation,
      tools: this.tools,
    });
    this.conversation.push(response.message);
    // Process tool calls until none remain.
    while (
      response.message.tool_calls &&
      response.message.tool_calls.length > 0
    ) {
      for (const toolCall of response.message.tool_calls) {
        const toolResult = await this.handleToolCall(toolCall);
        // Append tool result to conversation.
        console.log(toolResult);

        this.conversation.push({ role: "tool", content: toolResult });
      }
      console.log(this.conversation);
      response = await ollama.chat({
        model: this.model,
        messages: this.conversation,
        tools: this.tools,
      });
      this.conversation.push({
        role: "system",
        content: response.message.content,
      });
    }
    return response;
  }

  private async handleToolCall(toolCall: ToolCall): Promise<string> {
    const { name, arguments: args } = toolCall.function;
    if (name === "get_current_weather") {
      const { city } = args;
      // Call the tools function.
      const weather = getCurrentWeather(city);
      return `The current weather in ${weather.city} is ${weather.temperature} and ${weather.condition}.`;
      //   return `The current weather in ${weather.city} is ${weather.temperature} and ${weather.condition}.`;
    } else if (name === "upload_post") {
      const { title, description } = args;
      await uploadPost(title, description);
      return "Post uploaded successfully.";
    } else {
      return "Unknown tool call.";
    }
  }
}
