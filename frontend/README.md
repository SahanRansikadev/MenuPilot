# MenuPilot — Homepage Website

Presentation-style responsive homepage for a food, menu, kitchen and event management platform.

## Included
- Sticky responsive header/navigation
- Hero with 3 rotating food/event image slides, automatic animation, arrows and dots
- Get started call-to-action
- About section with supporting images
- Six service cards
- Breakfast, lunch & dinner, BBQ, events/functions image cards
- Contact details and demo contact form
- Footer with navigation and social links

## Tech
Next.js App Router, React, TypeScript, CSS, Lucide icons.

## Run
```bash
npm install
npm run dev
```
Open http://localhost:3000

## Authentication
The frontend is a Next.js client and sends authentication requests to the separate Node.js API in `../backend`. Copy `.env.example` to `.env.local`; set `NEXT_PUBLIC_API_URL` to the backend API URL (default `http://localhost:5000/api` for local development). In the frontend Vercel project, set `NEXT_PUBLIC_API_URL=https://menu-pilot-backend.vercel.app/api` for Production and Preview. The app uses that deployed URL as its fallback as well. Start the backend separately and configure its MongoDB connection in `backend/.env`; see [backend/README.md](../backend/README.md). The dashboard loads the signed-in user's name and email from the API, and sign-out revokes the server session. Passwords are hashed before storage, and authentication uses an HTTP-only session cookie. Contact details and the contact form are still placeholders. Photography loads from Unsplash URLs, so internet access is needed for images.

The frontend uses `POST /api/auth/signup` with `{ "name": "...", "email": "...", "password": "..." }`, `POST /api/auth/signin` with `{ "email": "...", "password": "..." }`, `GET /api/auth/me` for the current user's details, and `POST /api/auth/logout` to sign out.

## GitHub
Extract this ZIP and upload its files/folders to your repository's `main` branch. Do not upload `node_modules` or `.next`.
