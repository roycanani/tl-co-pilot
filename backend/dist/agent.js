"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Agent = void 0;
const tools_1 = require("./tools");
const ollama_1 = __importDefault(require("ollama"));
class Agent {
    constructor(model) {
        this.tools = [];
        this.conversation = [
            {
                role: "system",
                content: "You are a helpful assistant that provides clear answers.",
            },
        ];
        this.model = model;
    }
    addTool(toolDefinition) {
        this.tools.push(toolDefinition);
    }
    async trigger(userQuery) {
        // Append the user query to conversation.
        this.conversation.push({ role: "user", content: userQuery });
        let response = await ollama_1.default.chat({
            model: this.model,
            messages: this.conversation,
            tools: this.tools,
        });
        this.conversation.push(response.message);
        // Process tool calls until none remain.
        while (response.message.tool_calls &&
            response.message.tool_calls.length > 0) {
            for (const toolCall of response.message.tool_calls) {
                const toolResult = await this.handleToolCall(toolCall);
                // Append tool result to conversation.
                console.log(toolResult);
                this.conversation.push({ role: "tool", content: toolResult });
            }
            console.log(this.conversation);
            response = await ollama_1.default.chat({
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
    async handleToolCall(toolCall) {
        const { name, arguments: args } = toolCall.function;
        if (name === "get_current_weather") {
            const { city } = args;
            // Call the tools function.
            const weather = (0, tools_1.getCurrentWeather)(city);
            return `The current weather in ${weather.city} is ${weather.temperature} and ${weather.condition}.`;
            //   return `The current weather in ${weather.city} is ${weather.temperature} and ${weather.condition}.`;
        }
        else if (name === "upload_post") {
            const { title, description } = args;
            await (0, tools_1.uploadPost)(title, description);
            return "Post uploaded successfully.";
        }
        else {
            return "Unknown tool call.";
        }
    }
}
exports.Agent = Agent;
