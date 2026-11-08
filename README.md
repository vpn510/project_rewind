# Project Rewind

Project Rewind is a MERN debugging-investigation workspace. It keeps bug reports, code changes, commits, error logs, evidence files, comments, and decisions together in a chronological timeline. Its rule-based root-cause analysis ranks potentially related changes transparently; a ranking is a lead to investigate, not proof of causation.

## What is included

- React + Vite workspace with dashboard analytics, projects and member management, searchable bug investigations and assignments, timelines, code snapshots, comments, evidence uploads, activity, and settings.
- Express MVC API with MongoDB/Mongoose models, JWT authentication, bcrypt password hashing, project membership checks, paginated/filterable bug lists, and input validation.
- Chronological timeline events and explainable root-cause correlation based on file paths, error terms, and event timing.
- Synthetic seed dataset: 10 users, 8 projects, 50 bugs, 200 events, 100 comments, and 30 evidence files, with real MongoDB references.
- Focused Node test coverage for the root-cause ranking rules.

## Requirements

- Node.js 20 or newer and npm.
- MongoDB locally or a MongoDB Atlas connection string.
- Run every command from the project root (`Project-Rewind`), not from `client/` or `server/`.

## First-time setup

1. Start MongoDB and confirm it is reachable on port `27017`.

   ```powershell
   Get-Service MongoDB
   # If it is stopped:
   Start-Service MongoDB
   ```

2. Create the server environment file and set a unique `JWT_SECRET` (at least 32 characters) and your `MONGO_URI`:

   ```powershell
   Copy-Item server/.env.example server/.env
   ```

   The default values in `server/.env.example` already work for a local MongoDB on port `27017`, with the API on port `5000`:

   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/project_rewind
   JWT_SECRET=replace-with-a-long-random-secret-at-least-32-characters
   CLIENT_URL=http://localhost:5173
   NODE_ENV=development
   ```

3. Create the client environment file so the frontend calls the same API port:

   ```powershell
   Copy-Item client/.env.example client/.env
   ```

   `client/.env` should contain:

   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

   The frontend and API ports must match. If you change `PORT` in `server/.env`, update `VITE_API_URL` in `client/.env` too.

4. Install dependencies from the project root:

   ```powershell
   npm install
   ```

5. Optional: populate a fresh development database:

   ```powershell
   npm run seed
   ```

   Demo sign-in: `alex@rewind.dev` / `RewindDemo2026!`. These accounts are for local development only. If the database already contains Project Rewind users, seeding stops without changing data. To replace the existing demo dataset, explicitly run `npm run seed -w server -- --reset`.

## Run the project (every time)

From the project root:

```powershell
npm run dev
```

This starts the API and the frontend together. Then open the frontend URL printed in the terminal (normally http://localhost:5173).

- Frontend: http://localhost:5173 (Vite automatically uses the next free port, e.g. `5174`, if `5173` is already taken — check the terminal output)
- API: http://localhost:5000/api
- Health check: http://localhost:5000/api/health

Stop the servers with `Ctrl+C` in the terminal running `npm run dev`.

## Useful commands

```powershell
npm run dev      # run frontend + API together
npm run build    # build the frontend for production
npm run start    # run the API only
npm run seed     # seed the development database
npm test -w server
```

## Troubleshooting

**Ports already in use / app points at the wrong port**

Something else (often an older running copy of this project) may still be using the dev ports. List what is listening and stop the stale `node` process:

```powershell
Get-NetTCPConnection -State Listen | Where-Object { $_.LocalPort -in 5000,5173,5174,5175 } |
  Select-Object LocalPort,OwningProcess

Stop-Process -Id <PID> -Force
```

If `Stop-Process` fails with `Access is denied`, that process was started from an Administrator terminal. Close that elevated terminal (or reboot), then run `npm run dev` again.

**CORS errors in the browser console**

The API allows the origins in `CLIENT_URL` and, in development, any `localhost`/`127.0.0.1` port. If you see CORS errors, make sure `NODE_ENV=development` in `server/.env`, or add the exact frontend URL to `CLIENT_URL` (comma-separated for multiple origins).

**`Unable to start the API: connect ECONNREFUSED 127.0.0.1:27017`**

MongoDB is not running. Start the service with `Start-Service MongoDB` (or point `MONGO_URI` at your MongoDB Atlas cluster).

**Frontend loads but every request fails**

Confirm the API is up at http://localhost:5000/api/health and that `client/.env` has `VITE_API_URL=http://localhost:5000/api`. Restart `npm run dev` after changing any `.env` file.

## API outline

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET|POST /api/projects`, `GET|PUT|DELETE /api/projects/:id`
- `GET|POST /api/bugs`, `GET|PUT|DELETE /api/bugs/:id`
- `GET /api/bugs/:id/timeline`, `POST /api/bugs/:id/events`, `POST /api/bugs/:id/comments`
- `POST /api/bugs/:id/attachments`, `POST /api/bugs/:id/analyze`, `POST /api/bugs/:id/root-cause-decision`
- `GET /api/analytics/dashboard`, `GET /api/projects/:id/analytics`

Private endpoints require `Authorization: Bearer <token>`. See `server/routes` and `server/controllers` for request shapes and behavior. Uploaded evidence is stored locally in `server/uploads`; use managed object storage for production.
