# MenuPilot Backend

Standalone Node.js/Express API for MenuPilot authentication. MongoDB Atlas stores users and hashed session tokens.

## Setup

1. Run `npm install` in this directory.
2. Copy `.env.example` to `.env` (`copy .env.example .env` in Command Prompt or `Copy-Item .env.example .env` in PowerShell).
3. Edit `.env` and set `MONGODB_URI` to your rotated MongoDB Atlas connection string. The `.env.example` file is only a template; it is not loaded by the app.
4. Ensure Atlas Network Access allows the backend to connect.
5. Run `npm run dev` for development or `npm start` to start the API.

The API listens on port `5000` by default. Set `FRONTEND_URL` to the frontend origin if it differs from `http://localhost:3000`.

## Endpoints

- `POST /api/auth/signup` — `{ "name": "...", "email": "...", "password": "..." }`
- `POST /api/auth/signin` — `{ "email": "...", "password": "..." }`
- `GET /api/health` — API health status

Authentication responses set an HTTP-only session cookie. Passwords are hashed with bcrypt; only hashes of session tokens are stored in the database.
