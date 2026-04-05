# FeedPulse - AI-Powered Product Feedback Platform

FeedPulse is a full-stack application where users submit product feedback and admins manage submissions with AI-powered analysis from Google Gemini.

This implementation includes all Must-Have requirements from the assignment PDF. Bonus/Nice-to-Have tasks are intentionally excluded except where lightweight additions do not conflict.

## Tech Stack

- Frontend: Next.js 14 (App Router), TypeScript, Tailwind CSS
- Backend: Node.js, Express, TypeScript
- Database: MongoDB with Mongoose
- AI: Google Gemini (`gemini-1.5-flash`)
- Auth: Simple admin login with JWT

## Project Structure

- `frontend/` - Next.js app (public submission page + admin pages)
- `backend/` - Express REST API + MongoDB + Gemini integration

## Environment Variables

### Backend (`backend/.env`)

Copy `backend/.env.example` to `backend/.env` and set values:

- `PORT` - backend port (default 5000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `ADMIN_EMAIL` - hardcoded admin email for login
- `ADMIN_PASSWORD` - hardcoded admin password for login
- `GEMINI_API_KEY` - Google AI Studio API key
- `CLIENT_ORIGIN` - frontend origin (default `http://localhost:3000`)

### Frontend (`frontend/.env.local`)

Copy `frontend/.env.local.example` to `frontend/.env.local`:

- `NEXT_PUBLIC_API_BASE_URL` - backend base URL (default `http://localhost:5000`)

## How to Run Locally

1. Install backend dependencies

```bash
cd backend
npm install
```

2. Install frontend dependencies

```bash
cd ../frontend
npm install
```

3. Start backend

```bash
cd ../backend
npm run dev
```

4. Start frontend

```bash
cd ../frontend
npm run dev
```

5. Open the app

- Public feedback form: `http://localhost:3000`
- Admin login: `http://localhost:3000/admin`
- Admin dashboard: `http://localhost:3000/dashboard`

## Must-Have Features Implemented

- Public feedback submission page with required fields
- Client-side validation (title required, description min 20 chars)
- Submission to Express API and persistence to MongoDB
- Submission success/error states
- Gemini analysis after feedback save
- Graceful fallback when Gemini fails (feedback still saved)
- Sentiment badge visible on dashboard
- Admin login (hardcoded credentials via env)
- Protected dashboard route
- Feedback list with required columns
- Category and status filters
- Status update workflow (`New -> In Review -> Resolved`)
- Complete REST API endpoints as specified
- Consistent API response shape: `{ success, data, error, message }`
- Schema validation + indexes + timestamps
- JWT-protected admin routes
- Input validation/sanitization via middleware

## API Endpoints

- `POST /api/auth/login`
- `POST /api/feedback`
- `GET /api/feedback`
- `GET /api/feedback/:id`
- `PATCH /api/feedback/:id`
- `DELETE /api/feedback/:id`
- `GET /api/feedback/summary`

## Screenshots

Add at least 2 screenshots here before submission, e.g.:

- Public feedback form
- Admin dashboard with sentiment and priority

## What I Would Build Next

- Better analytics widgets and trend reports
- Queue-based background AI processing for higher throughput
- Multi-admin role-based authentication
