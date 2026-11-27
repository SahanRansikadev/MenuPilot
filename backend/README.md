# MenuPilot backend

Express API that runs locally with Node.js and deploys to Vercel. Vercel detects
the exported Express app in `src/index.js`; `src/server.js` starts that same app
for local development.

## Run locally

```bash
npm install
npm run dev
```

The API starts at `http://localhost:5000`. Available endpoints:

- `GET /` — API status and health endpoint
- `GET /api/health` — health check

Set `PORT` to change the local port. Set `CORS_ORIGIN` to a comma-separated
list of frontend origins allowed to make browser requests (for example,
`http://localhost:3000,https://your-frontend.example`).
You can optionally copy `.env.example` to `.env` and adjust these values.

Run the API tests with `npm test`.

## Deploy to Vercel

Import the repository into Vercel and set **Root Directory** to `backend`.
Vercel will detect the Express app automatically; no separate server process
or `vercel.json` routing configuration is needed. Add `CORS_ORIGIN` in the
Vercel project's Environment Variables for the deployed frontend origin, then
deploy. The health check will be available at `/api/health`.
