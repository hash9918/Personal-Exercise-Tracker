# Circuit — workout builder with accounts, MongoDB, and streaks

A full-stack version of the exercise/circuit timer: users sign up, add exercises
with sets/reps/duration and an image or GIF (uploaded to the backend and stored
on disk, path saved in MongoDB), run a per-exercise or full-circuit timer, and
see their streaks and total training time on a dedicated page.

## Stack

- **Backend:** Node, Express, MongoDB (Mongoose), JWT auth (bcrypt password
  hashing), Multer for image uploads (stored in `backend/uploads`, served
  statically).
- **Frontend:** React + Vite, React Router, `lucide-react` icons, plain CSS
  (no Tailwind) — same gym/iron visual style as the original prototype.

## Project layout

```
circuit-app/
  backend/
    config/db.js
    models/User.js, Exercise.js, WorkoutLog.js
    middleware/auth.js, upload.js
    routes/auth.routes.js, exercise.routes.js, log.routes.js
    server.js
    uploads/            <- uploaded images land here
  frontend/
    src/
      pages/  Login, Register, Dashboard, Streaks
      components/  Navbar, ProtectedRoute, TimerView
      context/AuthContext.jsx
      api.js
      styles.css
```

## 1. MongoDB

Use a local MongoDB instance or a free MongoDB Atlas cluster. You just need a
connection string, e.g. `mongodb://localhost:27017/circuit` or an Atlas URI.

## 2. Backend setup

```bash
cd backend
cp .env.example .env
# edit .env: set MONGODB_URI, a random JWT_SECRET, and CLIENT_ORIGIN if needed
npm install
npm run dev        # starts on http://localhost:5000 (nodemon)
```

## 3. Frontend setup

```bash
cd frontend
cp .env.example .env
# edit .env if your backend isn't on http://localhost:5000
npm install
npm run dev         # starts on http://localhost:5173
```

Open http://localhost:5173, create an account, and start adding exercises.

## How the pieces fit together

- **Auth:** `POST /api/auth/register` and `/login` return a JWT, stored in
  `localStorage` on the frontend and sent as `Authorization: Bearer <token>`
  on every request. `middleware/auth.js` verifies it and attaches `req.userId`
  so all exercise/log data is scoped per user.
- **Images:** the "Add exercise" form sends a `multipart/form-data` request.
  If you attach a file, Multer saves it to `backend/uploads/<random>.ext` and
  the exercise document stores that path (`/uploads/...`). If you paste a URL
  instead, that URL is stored directly. The frontend's `imageSrc()` helper
  resolves relative `/uploads/...` paths against the API's origin.
- **Timer:** unchanged from the original — per-exercise countdown, or a full
  circuit with a configurable rest between moves.
- **Streaks:** every time a single exercise or a full circuit finishes, the
  frontend calls `POST /api/logs` with the seconds actually trained. The
  backend groups logs by calendar date (server date) to compute the current
  streak (consecutive days up to today/yesterday), the longest streak ever,
  total time trained, and a 12-week heatmap (`GET /api/logs/stats`).

## Notes / things you may want to change

- Dates for streaks use the server's local date (`Date().toISOString().slice(0,10)`,
  which is UTC). If you want the streak day-boundary to follow the user's own
  timezone instead, pass the client's local date to `POST /api/logs` and use
  that instead of computing it server-side.
- Uploaded images are stored on local disk — fine for a single server, but if
  you deploy to somewhere with an ephemeral filesystem (e.g. many PaaS
  platforms), switch to S3/Cloudinary/GridFS instead.
- There's no password-reset flow or email verification — add those before
  using this with real users.
