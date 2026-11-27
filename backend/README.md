# MenuPilot Backend

Standalone Node.js/Express API for MenuPilot authentication. MongoDB Atlas stores users and hashed session tokens.

## Setup

1. Run `npm install` in this directory.
2. Copy `.env.example` to `.env` (`copy .env.example .env` in Command Prompt or `Copy-Item .env.example .env` in PowerShell).
3. Edit `.env` and set `MONGODB_URI` to your MongoDB Atlas connection string. `.env` is loaded only by the local development server; it is ignored by Git.
4. Ensure Atlas Network Access allows the backend to connect.
5. Run `npm run dev` for development or `npm start` to start the API.

The API listens on port `5000` by default. `FRONTEND_URL` accepts a comma-separated list of exact frontend origins (for example, `http://localhost:3000,https://your-frontend.vercel.app`); do not use a wildcard for credentialed CORS.
`MONGODB_DB_NAME` is optional and defaults to `menupilot`.

## Vercel deployment

The serverless Express app is exported from `src/app.js` and explicitly configured as a Vercel Node.js function in `vercel.json`. Vercel connects to MongoDB before handling database-backed requests; concurrent requests share the same connection attempt, and warm function instances reuse their established connection. The root and health endpoints do not require MongoDB. The standalone `src/server.js` entry point and `src/application.js` remain for local development and tests.

For the `menu-pilot-backend` Vercel project:

1. Set **Root Directory** to `backend` and leave **Include source files outside of the Root Directory** disabled.
2. Keep the **Production Branch** set to `main`. Enable Preview Deployments for Git branches and push development changes to `dev`; they will deploy as Preview Deployments.
3. Add `MONGODB_URI` in Vercel **Settings → Environment Variables** with **Preview** scope (and branch `dev` if using a branch-specific value) pointing to a development Atlas database. Configure a separate production URI under **Production** scope if the production backend is deployed. Set `MONGODB_DB_NAME=menupilot` (optional) and `FRONTEND_URL` to the exact deployed frontend origin (comma-separated if multiple origins are needed). Do not prefix database credentials with `NEXT_PUBLIC_`.
4. In the frontend Vercel project, set `NEXT_PUBLIC_API_URL=https://menu-pilot-backend.vercel.app/api` for Production and Preview. Set `FRONTEND_URL` in the backend project to the frontend's exact deployed origin; add preview origins as needed.
5. Configure MongoDB Atlas **Network Access** to allow connections from the Vercel deployment. Prefer a private network connection/peering where supported. If using IP access lists, account for Vercel's outbound IP behavior; do not assume one fixed IP unless using a Vercel feature that provides static egress.
6. Redeploy after setting environment variables.

For local smoke testing, run `npm test`, then `npm run dev` and request `http://localhost:5000/api/health`. Test the sign-up/sign-in flows against a non-production Atlas database before merging changes to `main`.

## Endpoints

- `POST /api/auth/signup` — `{ "name": "...", "email": "...", "password": "..." }`
- `POST /api/auth/signin` — `{ "email": "...", "password": "..." }`
- `GET /api/auth/me` — returns the authenticated user's name and email
- `POST /api/auth/logout` — revokes the session and clears its cookie
- `GET /` — liveness check returning `{ "status": "ok", "message": "MenuPilot Backend is running!" }`
- `GET /api/health` — liveness check returning `{ "success": true, "message": "MenuPilot Backend is running", "status": "OK" }`
- Unknown routes return a JSON 404 response.

Authentication responses set an HTTP-only session cookie. Passwords are hashed with bcrypt; only hashes of session tokens are stored in the database.
