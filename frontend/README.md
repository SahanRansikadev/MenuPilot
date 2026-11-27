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
The frontend is a Next.js client and sends sign-up/sign-in requests to the separate Node.js API in `../backend`. Copy `.env.example` to `.env.local`; set `NEXT_PUBLIC_API_URL` to the backend API URL (default `http://localhost:5000/api`). Start the backend separately and configure its MongoDB connection in `backend/.env`; see [backend/README.md](../backend/README.md). Passwords are hashed before storage, and successful authentication sets an HTTP-only session cookie. Contact details and the contact form are still placeholders. Photography loads from Unsplash URLs, so internet access is needed for images.

The frontend authentication forms call `POST /api/auth/signup` with `{ "name": "...", "email": "...", "password": "..." }` or `POST /api/auth/signin` with `{ "email": "...", "password": "..." }` on the backend.

## GitHub
Extract this ZIP and upload its files/folders to your repository's `main` branch. Do not upload `node_modules` or `.next`.
