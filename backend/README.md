# Backend Documentation

This document provides an overview of the backend for the SwarnaAI application. The backend is a Node.js Express server responsible for handling API requests, interacting with the Vertex AI agent, and fetching data from external services.

## Getting Started

### Prerequisites

- Node.js
- npm

### Installation

1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Install the dependencies:
    ```bash
    npm install
    ```

### Running the Server

1.  Create a `.env` file in the `backend` directory and add the following environment variables:
    ```
    PROJECT_ID="your-gcp-project-id"
    LOCATION="your-gcp-location"
    MODEL="gemini-pro"
    GOLD_API_KEY="your-goldapi-key"
    GOLD_API_BASE="https://www.goldapi.io/api"
    LANGCHAIN_VERBOSE="true"
    ```
2.  Make sure you have a `service-account.json` file in the `backend` directory with your Google Cloud service account credentials.

3.  Start the server:
    ```bash
    npm start
    ```
The server will run on port 3000.

## API Endpoints

### `POST /api/ai/chat`

This is the main endpoint for interacting with the SwarnaAI agent.

-   **Request Body**:
    ```json
    {
      "input": "User's message",
      "chat_history": [
        { "sender": "user", "text": "Previous message" },
        { "sender": "ai", "text": "Previous response" }
      ]
    }
    ```
-   **Response Body**:
    ```json
    {
      "response": "AI's response"
    }
    ```

### `GET /health`

A health check endpoint to verify that the server is running.

-   **Response Body**:
    ```json
    {
      "status": "ok"
    }
    ```

## Core Components

### `server.js`

The main entry point for the Express server. It sets up middleware for JSON parsing, CORS, and error handling, and it mounts the API routes.

### `src/ai/aiAgent.js`

This file contains the core logic for the LangChain agent.

-   **`swarnaAIAgent(input, chatHistory)`**: The main function that initializes the agent, tools, and memory to process a user's request.
-   **`createVertexModel(authClient)`**: Creates and configures the `ChatVertexAI` model instance.
-   **`createTools()`**: Sets up the dynamic tools available to the agent:
    -   `getCurrentPrice`: Fetches the current gold and silver prices.
    -   `getHistoricalComparison`: Fetches and compares gold prices over a specified period.
-   **`createMemory(chat_history)`**: Creates the chat memory to maintain conversation context.

### `src/utils/googleCreds.js`

-   **`loadCredentials()`**: Loads Google Cloud credentials from the `service-account.json` file to authenticate with Vertex AI.

### Routes

-   **`src/routes/aiRoutes.js`**: Defines the `/api/ai/chat` route and links it to the controller that calls the `swarnaAIAgent`.
-   **`src/routes/healthRoutes.js`**: Defines the `/health` route.
