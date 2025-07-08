# Frontend Documentation

This document provides an overview of the frontend for the SwarnaAI application. The frontend is a React application built with Vite that provides a user interface for interacting with the SwarnaAI agent.

## Getting Started

### Prerequisites

- Node.js
- npm

### Installation

1.  Navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```
2.  Install the dependencies:
    ```bash
    npm install
    ```

### Running the Application

1.  Start the development server:
    ```bash
    npm run dev
    ```
The application will be available at `http://localhost:5173`.

## Core Components

### `src/main.tsx`

The entry point for the React application. It renders the `App` component.

### `src/App.tsx`

The main application component. It manages the chat state and user interactions.

### `src/components/Chat.tsx`

This component contains the main chat interface, including the message display area and the input form.

-   **State**:
    -   `messages`: An array of chat messages.
    -   `input`: The current value of the message input field.
    -   `isLoading`: A boolean to indicate when the AI is processing a request.
-   **Functions**:
    -   `handleSendMessage()`: Sends the user's message to the backend, updates the chat history, and displays the AI's response.

### `src/components/ChatBubble.tsx`

A presentational component for rendering individual chat messages. It uses `react-markdown` to display formatted text.

-   **Props**:
    -   `message`: The message content.
    -   `sender`: Either `'user'` or `'ai'`.

### `src/api/ai.ts`

This file contains the function for making API calls to the backend.

-   **`sendMessage(input, chatHistory)`**: Sends a `POST` request to the `/api/ai/chat` endpoint with the user's message and the conversation history.

## Styling

The application is styled using Tailwind CSS.

-   **`tailwind.config.js`**: The configuration file for Tailwind CSS.
-   **`src/index.css`**: The main CSS file where Tailwind's base styles are imported.
