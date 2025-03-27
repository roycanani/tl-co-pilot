# My Node TypeScript Agent

This project implements a Node/TypeScript-based agent that simulates a language model to assist users with various queries. The agent can be triggered to provide responses and can utilize additional tools for enhanced functionality.

## Project Structure

```
my-node-agent
├── src
│   ├── agent.ts        # Defines the Agent class with methods to simulate a chat model and add tools.
│   ├── main.ts         # Entry point for the application, initializes the agent and handles user queries.
│   ├── tools.ts        # Contains utility functions for the agent, such as retrieving current weather.
│   └── daily.ts        # Contains an example daily transcript.
├── package.json        # Project configuration and dependencies.
├── tsconfig.json       # TypeScript configuration.
├── .gitignore          # Specifies files and directories to be ignored by Git.
└── README.md           # Documentation for the project.
```

## Setup Instructions

1. Install the dependencies:
   ```
   npm install
   ```

2. Build the project:
   ```
   npm run build
   ```

3. Run the agent:
   ```
   npm start
   ```

## Agent Capabilities

- The agent can respond to user queries and provide clear answers.
- It can utilize tools such as retrieving the current weather for a specified city.
- The agent is designed to be extensible, allowing for the addition of new tools as needed.

## Contributing

Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.