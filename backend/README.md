# MenuPilot Backend

Standalone Node.js/Express API for MenuPilot authentication, guest bookings, administration, menus, and kitchen tasks. MongoDB Atlas stores users and their roles, hashed session tokens, the shared food catalog, menus, bookings, and kitchen tasks.

## Setup

1. Run `npm install` in this directory.
2. Copy `.env.example` to `.env` (`copy .env.example .env` in Command Prompt or `Copy-Item .env.example .env` in PowerShell).
3. Edit `.env` and set `MONGODB_URI` to your MongoDB Atlas connection string. `.env` is loaded only by the local development server; it is ignored by Git.
4. Ensure Atlas Network Access allows the backend to connect.
5. Run `npm run dev` for development or `npm start` to start the API.

## Initial administrator

Sign up the account that should become the first administrator, then promote that account once in MongoDB Atlas (or `mongosh`):

```js
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

Confirm `matchedCount` and `modifiedCount` are both `1`. The account can then sign in and open `/dashboard/admin`. New sign-ups always receive the `guest` role; users cannot select or grant themselves a role. Admins can update user details and assign `admin`, `kitchenTeam`, or `guest` roles from User management. The last administrator cannot be demoted or deleted; active kitchen tasks must be completed or declined before changing or deleting a kitchen account.

The API listens on port `5000` by default. `FRONTEND_URL` accepts a comma-separated list of exact frontend origins (for example, `http://localhost:3000,https://your-frontend.vercel.app`); do not use a wildcard for credentialed CORS.
`MONGODB_DB_NAME` is an optional explicit database override. If unset, the app uses the database path in `MONGODB_URI`; only when the URI has no database path does it default to `menupilot`.

## Vercel deployment

The serverless Express app is exported from `src/app.js` and explicitly configured as a Vercel Node.js function in `vercel.json`. Vercel connects to MongoDB before handling database-backed requests; concurrent requests share the same connection attempt, and warm function instances reuse their established connection. The root and health endpoints do not require MongoDB. The standalone `src/server.js` entry point and `src/application.js` remain for local development and tests.

For the `menu-pilot-backend` Vercel project:

1. Set **Root Directory** to `backend` and leave **Include source files outside of the Root Directory** disabled.
2. The current `menu-pilot-backend` Vercel project uses `dev` as its Production Branch. Keep that setting if pushes to `dev` should update Production; other branches can deploy as Preview.
3. The Atlas integration currently provides `MONGODB_URI` in Production and Preview. If it contains a database path, leave `MONGODB_DB_NAME` unset to use that database; set `MONGODB_DB_NAME` only when intentionally overriding it. `MONGODB_DB_NAME` is not currently required. Set `FRONTEND_URL` to the exact deployed frontend origin (comma-separated if multiple origins are needed). Do not prefix database credentials with `NEXT_PUBLIC_`.
4. In the frontend Vercel project, set `NEXT_PUBLIC_API_URL=https://menu-pilot-backend.vercel.app/api` for Production and Preview. Set `FRONTEND_URL` in the backend project to the frontend's exact deployed origin; add preview origins as needed.
5. Configure MongoDB Atlas **Network Access** to allow connections from the Vercel deployment. Prefer a private network connection/peering where supported. If using IP access lists, account for Vercel's outbound IP behavior; do not assume one fixed IP unless using a Vercel feature that provides static egress.
6. Redeploy after setting environment variables.

For local smoke testing, run `npm test`, then `npm run dev` and request `http://localhost:5000/api/health`. Test the sign-up/sign-in flows against a non-production Atlas database before merging changes to `main`.

## Endpoints

- `POST /api/auth/signup` — `{ "name": "...", "email": "...", "password": "..." }`
- `POST /api/auth/signin` — `{ "email": "...", "password": "..." }`
- `GET /api/auth/me` — returns the authenticated user's identity and role
- `POST /api/auth/logout` — revokes the session and clears its cookie
- `GET /api/admin/users` — admin-only account list
- `PUT /api/admin/users/:id` and `DELETE /api/admin/users/:id` — admin-only user editing and deletion
- `PATCH /api/admin/users/:id/role` — admin-only role management
- `GET /api/admin/bookings` and `PATCH /api/admin/bookings/:id/status` — admin booking management
- `GET /api/admin/hotels`, `POST /api/admin/hotels`, `PUT /api/admin/hotels/:id`, `DELETE /api/admin/hotels/:id` — admin hotel management
- `GET /api/admin/menus`, `POST /api/admin/menus`, `PUT /api/admin/menus/:id`, `DELETE /api/admin/menus/:id` — admin menu management using hotel, meal type, separate food and dessert name lists, and description
- `GET /api/menus` — guest menu view grouped by hotel and ordered by meal type, with foods and desserts returned separately
- `GET /api/feedback` — admin and kitchen-team read-only view of guest profile feedback
- `PATCH /api/feedback/:userId/reply` and `PATCH /api/feedback/:userId/like` — admin-only feedback response and like controls
- `GET`/`POST /api/admin/foods` and `/api/admin/ingredients`, plus `PUT`/`DELETE /api/admin/foods/:id` and `/api/admin/ingredients/:id` — admin catalog management; items referenced by existing bookings cannot be deleted
- `GET /api/admin/kitchen/tasks` — admin view of kitchen tasks
- `POST /api/admin/kitchen/meal-tasks` — assign one booking meal, its recipe, and quantified supply list to a kitchen team member; guest-provided ingredients are rejected and missing catalog ingredients are added
- `GET /api/admin/kitchen/costing` and `PATCH /api/admin/kitchen/tasks/:id/costing` — review and confirm the kitchen team's actual cost
- `POST /api/admin/kitchen/tasks` — legacy menu-recipe task assignment
- `GET /api/kitchen/tasks` — kitchen-team member's assigned tasks
- `PATCH /api/kitchen/tasks/:id/status` — kitchen team advances an assigned task through accepted, preparing, and ready
- `PATCH /api/kitchen/tasks/:id/supply` — kitchen team submits received/missing supply checks and actual supplier total
- `GET /api/hotels` — guest-accessible hotel branch list for booking
- `GET /api/foods?search=...` — searches the authenticated shared food catalog
- `POST /api/foods` — adds a food to the catalog or returns its existing match
- `GET /api/bookings` and `GET /api/bookings/:id` — lists or views the authenticated guest's bookings
- `POST /api/bookings` and `PUT /api/bookings/:id` — save or update a booking with a hotel branch, meals, food, and dessert selections
- `DELETE /api/bookings/:id` — deletes the authenticated guest's booking and cancels its open kitchen tasks
- `GET /` — liveness check returning `{ "status": "ok", "message": "MenuPilot Backend is running!" }`
- `GET /api/health` — liveness check returning `{ "success": true, "message": "MenuPilot Backend is running", "status": "OK" }`
- Unknown routes return a JSON 404 response.

Authentication responses set an HTTP-only session cookie. Passwords are hashed with bcrypt; only hashes of session tokens are stored in the database.
