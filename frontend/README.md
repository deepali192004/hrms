# Faculty HRMS frontend

## Local development

1. Install Node.js 20.19+ with Corepack and pnpm 11.25.0.
2. Copy `.env.example` to `.env.local` and set `VITE_API_BASE_URL=http://localhost:5000` while the Express backend runs on the same development machine.
3. Start the frontend with `pnpm install --frozen-lockfile` and `pnpm dev`.
4. For public faculty registration, leave `VITE_FACULTY_REGISTRATION_ENABLED=false` until the backend is verified to enforce Faculty-only public signup and reject requests assigning HOD/Admin roles. Set it to `true` only after that server-side check.

The frontend does not contain database credentials, JWT signing keys, or backend secrets. The login request sends only the entered username and password to the confirmed login endpoint. Protected requests send the returned JWT in the `Authorization: Bearer` header.

## Remote Preview and production

Do not use `localhost` as the API base for a hosted Preview or published site: it does not tunnel to the developer's machine. Set the public build variable `VITE_API_BASE_URL` to the backend's publicly reachable HTTPS base URL, configure the Express backend's CORS allowlist for the Preview/published origins, and keep all signing/database secrets only on the backend. This repository currently has no backend source or production API URL, so the remote API integration cannot be live-verified here.

Only these API paths are confirmed by the project request: `POST /api/auth/login`, `POST /api/auth/register`, `GET /api/leaves/my`, and `POST /api/leaves`. The leave-create request field schema is not available in the frontend project; the frontend must not submit a guessed body. Attendance, profile, timetable, notifications, HOD, Admin, and password-recovery API paths are not confirmed.
