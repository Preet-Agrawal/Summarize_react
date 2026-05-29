# Story Quiz (React + Node.js)

AI-powered story summarizer and quiz generator. Paste a story, get a summary and multiple-choice quiz. Built with React, Express, and MongoDB.

## Features

- AI story summarization and quiz generation
- User login, registration, and session auth
- Quiz scoring and profile history
- Contact page

## Quick start

```bash
git clone https://github.com/Preet-Agrawal/Summarize_react.git
cd Summarize_react
npm run install:all
cp .env.example .env
npm run dev
```

Open **http://localhost:5173**

### Environment (`.env`)

| Variable | Description |
|----------|-------------|
| `MONGO_URI` | Leave empty for embedded local DB (no Docker). Or use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) connection string. |
| `SECRET_KEY` | Session secret |
| `HUGGINGFACE_API_KEY` | Optional, for real AI summaries |
| `CLIENT_URL` | `http://localhost:5173` for local dev |

### Dev login

When `MONGO_URI` is empty, the server creates: **testuser** / **testpass**

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start API (port 5001) and Vite (port 5173) |
| `npm run build` | Build client for production |
| `npm start` | Run production server |

## Project structure

```
client/     React frontend (Vite)
server/     Express API + MongoDB
```

## License

MIT
