# Story Quiz

AI-powered story summarizer and quiz generator. Paste a story, get an instant summary and a 5-question multiple-choice quiz that adapts its difficulty to how well you're doing. Built as a full-stack JavaScript app (React + Express + MongoDB).

Developed by students at IIIT Surat as a 3rd-year project.

---

## Features

- **AI story summarization** — condenses pasted text into a short summary.
- **Auto-generated quizzes** — 5 multiple-choice questions per story, with instant right/wrong feedback and a confetti celebration on a perfect score.
- **Adaptive difficulty** — the next quiz gets easier or harder based on your last 3 scored attempts.
- **JWT-based auth** — register, log in, log out via an httpOnly cookie; passwords hashed with bcrypt.
- **Profile & history** — quiz count, average/best score, and full attempt history with IST timestamps.
- **Contact form** — sends the message to an admin inbox and an auto-reply to the sender (when mail is configured).
- **Zero-setup local dev** — an embedded, in-memory MongoDB spins up automatically if no `MONGO_URI` is set, so there's no DB install required to run the project locally.

## Tech Stack

**Client** (`client/`)
- React 18 + React Router 6
- Vite (dev server + build)
- `canvas-confetti` for the perfect-score effect

**Server** (`server/`)
- Express 4
- MongoDB driver + `mongodb-memory-server` (embedded DB for local dev)
- `jsonwebtoken` + `cookie-parser` for auth, `bcryptjs` for password hashing
- `nodemailer` for the contact form
- Hugging Face Inference API (`facebook/bart-large-cnn` for summaries, `google/flan-t5-large` for quiz questions) — optional, with an offline heuristic fallback

## Architecture

Express serves the JSON API under `/api/*` and, in production, the built React app (`client/dist`) as static files with an SPA fallback. In development, Vite runs on its own port and proxies `/api` calls to Express (see `client/vite.config.js`).

```
dev:  Vite (5173)  ──proxy /api──▶  Express (5001)
prod: Express (PORT) serves client/dist AND /api/*
                │
                ▼
         MongoDB (Atlas / local mongod / embedded in-memory)
```

## Project Structure

```
Summarize/
├── client/src/
│   ├── components/Navbar.jsx    Shared header, shows auth state
│   ├── context/AuthContext.jsx  login/register/logout/me
│   ├── pages/                   Home, Login, Register, Profile, Users, Contact, AuthChoice
│   ├── App.jsx                  Route table
│   └── main.jsx                 App entry point
├── server/
│   ├── index.js                 Express app: middleware, routes, bootstrap
│   ├── middleware/auth.js       JWT auth guard for protected routes
│   ├── utils/jwt.js             sign/verify helpers
│   ├── difficulty.js            Pure adaptive-difficulty logic (unit-testable)
│   └── test-difficulty.js       Standalone assertion-based tests
├── .env.example                 Documented environment variable template
└── package.json                 Root scripts that orchestrate client + server
```

## Getting Started

### Prerequisites

- Node.js (v18+ recommended — the server uses the built-in `fetch` and `AbortSignal.timeout`)
- npm

No Docker or local MongoDB install is required — see [Environment Variables](#environment-variables).

### Install & Run

```bash
git clone https://github.com/Preet-Agrawal/Summarize_react.git
cd Summarize_react
npm run install:all
cp .env.example .env
npm run dev
```

Open **http://localhost:5173**.

### Dev login

When `MONGO_URI` is left empty, the server creates a test account on startup:

- **Username:** `testuser`
- **Password:** `testpass`

## Environment Variables

Defined in `.env` (see `.env.example` for the template):

| Variable | Required | Description |
|---|---|---|
| `JWT_SECRET` | **Yes** | Secret used to sign auth tokens. The server refuses to start without it (no insecure default). |
| `JWT_EXPIRES` | No | How long a login stays valid before re-login is required. Defaults to `7d`. |
| `MONGO_URI` | No | MongoDB connection string (Atlas or local `mongod`). Leave empty to use an embedded in-memory MongoDB — data resets on every server restart. |
| `HUGGINGFACE_API_KEY` | No | Enables real AI summaries/quizzes via Hugging Face Inference API. Without it, the deterministic fallback generator is used. |
| `CLIENT_URL` | No | Origin allowed by CORS; defaults to `http://localhost:5173`. |
| `PORT` | No | Server port; defaults to `5001` locally (auto-provided by hosts like Render in production). |
| `MAIL_SERVER`, `MAIL_PORT`, `MAIL_USE_TLS`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_DEFAULT_SENDER` | No | SMTP config for the contact form. Without these, contact messages are still stored in MongoDB, just not emailed. |
| `ADMIN_EMAIL` | No | Where contact-form submissions are sent; falls back to `MAIL_USERNAME`. |

> `.env` is gitignored — never commit real credentials.

## Scripts

Run from the repo root (`Summarize/`):

| Command | Description |
|---|---|
| `npm run dev` | Runs API (port 5001) and Vite client (port 5173) concurrently |
| `npm run dev:server` | Server only, with `--watch` for auto-restart |
| `npm run dev:client` | Client only (Vite) |
| `npm run install:all` | Installs dependencies for both `server/` and `client/` |
| `npm run build` | Builds the client for production into `client/dist` |
| `npm start` | Runs the production server (serves API + built client) |

## API Reference

All endpoints are prefixed with `/api`. Protected routes require a valid `token` cookie, sent automatically once the client is logged in (`credentials: 'include'`).

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | — | Health check |
| GET | `/auth/me` | ✅ | Returns the current username |
| POST | `/auth/register` | — | Create an account and log in (`username`, `password`, min 4 chars) |
| POST | `/auth/login` | — | Log in, issues the JWT cookie |
| POST | `/auth/logout` | — | Clears the JWT cookie |
| POST | `/generate` | ✅ | Generates summary + 5-question quiz from `{ text }`; picks difficulty from recent performance |
| POST | `/save_score` | ✅ | Records `{ score, quiz_id }` against the generated quiz |
| GET | `/profile` | ✅ | User info + full quiz history |
| GET | `/users` | ✅ | List of registered usernames |
| POST | `/contact` | — | Stores a contact message and emails admin + sender (if mail configured) |

## Adaptive Difficulty

`server/difficulty.js` scores the last 3 completed attempts and adjusts the next quiz: average ≥ 0.8 levels up, average ≤ 0.4 levels down, otherwise it stays the same (defaults to `medium` with no history).

## AI Generation & Fallback

`POST /api/generate` uses Hugging Face (`bart-large-cnn` for the summary, `flan-t5-large` for questions) when `HUGGINGFACE_API_KEY` is set. If the key is missing or the API call fails, it falls back to a deterministic offline generator that builds questions from names, locations, objects, and actions extracted from the text.

## Testing

```bash
cd server
node test-difficulty.js
```

## Deployment

`npm run build` builds the client into `client/dist`. In production, `npm start` runs only the Express server, serving both the build and `/api/*` — no separate frontend host needed. Set `MONGO_URI` to a real database.

## License

MIT
