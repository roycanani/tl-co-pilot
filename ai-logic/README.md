# My Python Agent

This project implements a Python-based agent that utilizes a language model to assist users with various queries. The agent can be triggered to provide responses and can utilize additional tools for enhanced functionality.

## Project Structure

```
my-python-agent
├── src
│   ├── agent.py        # Defines the Agent class with methods to trigger the model and add tools.
│   ├── main.py         # Entry point for the application, initializes the agent and handles user queries.
│   └── tools.py        # Contains utility functions for the agent, such as retrieving current weather.
├── requirements.txt     # Lists the dependencies required for the project.
├── .gitignore           # Specifies files and directories to be ignored by Git.
└── README.md            # Documentation for the project.
```

## Setup Instructions

1. Clone the repository:
   ```
   git clone <repository-url>
   cd my-python-agent
   ```

2. Install the required dependencies:
   ```
   pip install -r requirements.txt
   ```

## Usage

To run the agent, execute the following command:
```
python src/main.py
```

## Agent Capabilities

- The agent can respond to user queries and provide clear answers.
- It can utilize tools such as retrieving the current weather for a specified city.
- The agent is designed to be extensible, allowing for the addition of new tools as needed.

## Contributing

Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.