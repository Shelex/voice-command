# Voice Assistant - Petro

A voice-activated assistant application with React frontend, Node.js backend, and OpenRouter LLM integration.

## Features

-   Voice recognition with "Hello World" phrase activation
-   Speech-to-text conversion using Web Speech API
-   OpenRouter LLM integration with streaming responses
-   Text-to-speech response playback

## Architecture

-   **Frontend**: React + TypeScript + Vite + shadcn/ui
-   **Backend**: Node.js + Express + TypeScript
-   **AI Integration**: OpenRouter API for LLM access

## Quick Start

### Prerequisites

-   Node.js 18+
-   Docker and Docker Compose
-   OpenRouter API key

### Development Setup

1. **Clone and navigate to project:**

```bash
cd voice-command
```

2. **Set up environment variables:**

```bash
cp .env.example .env
# Edit .env and add your OpenRouter API key
```

3. **Install dependencies:**

```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

4. **Run development servers:**

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

5. **Access the application:**

-   Frontend: http://localhost:3000
-   Backend API: http://localhost:8003

### Docker Deployment

1. **Set up environment:**

```bash
cp .env.example .env
# Add your OpenRouter API key
```

2. **Build and run with Docker Compose:**

```bash
docker-compose up --build
```

3. **Access the application at http://localhost:3000**

## Usage

1. **Voice Activation**: Say "Hello World" to activate voice input
2. Request to the backend will be sent automatically after 2s delay
3. **Response**: Listen to the AI response via text-to-speech

## API Configuration

The app uses OpenRouter for LLM access. Get your API key from [OpenRouter](https://openrouter.ai/).

### Supported Models

Just any free model with some reasonable uptime and latency

-   Configurable in `backend/src/services/openrouter.ts`

## Browser Compatibility

-   Chrome/Edge: Full support
-   Firefox: Full support
-   Safari: Partial (speech recognition limited)
