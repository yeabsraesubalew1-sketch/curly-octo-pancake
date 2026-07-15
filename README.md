# EduSched Academic Flow

EduSched is a full-stack college scheduling portal for managing departments, instructors, courses, assignments, and generated timetables. The application combines a React/Vite frontend with an Express/Node backend and supports three roles:

- Registrar/Admin: manage records, import CSVs, set up the admin account, reset the database, and generate schedules.
- Instructor: view assigned courses and a personal timetable, and update their password.
- Student: view a department/year/section timetable and export it to PDF.

## Features

- Role-based dashboards for admin, instructor, and student users
- Department, course, and instructor record management
- Course assignment relationships between departments, years, sections, and instructors
- Automated schedule generation using a backtracking solver
- CSV import for departments, instructors, and courses
- PDF export for instructor and student timetables
- Health and database status monitoring
- Fallback mode when MongoDB is unavailable

## Tech Stack

- Frontend: React, TypeScript, Vite, React Router, Tailwind-inspired UI styling
- Backend: Node.js, Express, MongoDB/Mongoose
- Auth: JWT-based auth for admin, instructor, and student access
- Data utilities: CSV parsing and PDF generation

## Project Structure

- src/ - React application entry points, pages, components, hooks, and utilities
- server/ - Express server, API routes, database connection logic, scheduler, and seed data
- public/ - static assets

## Prerequisites

- Node.js 18+ recommended
- npm or pnpm
- A running MongoDB instance (optional; the app can fall back to in-memory demo mode if unavailable)

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create an environment file if needed:
   ```bash
   cp .env.example .env.local
   ```
   If you are using a local MongoDB instance, set:
   ```bash
   MONGODB_URI=mongodb://127.0.0.1:27017/edusched
   ```

## Running the App

### Development mode

Start both the API server and frontend together:

```bash
npm run dev
```

This runs:
- the Express server on port 5000
- Vite on port 3000

### API only

```bash
npm run server:dev
```

### Build for production

```bash
npm run build
```

### Seed demo data

```bash
npm run seed
```

The seed script clears existing academic collections and populates demo departments, instructors, courses, and assignments.

## Demo Access

After starting the app, open the frontend at:

- http://localhost:3000

The login screen allows access for:
- Student: select a department and section, then sign in as student
- Instructor: use seeded instructor credentials such as `abebe` / `123`
- Registrar/Admin: create the initial admin account from the login screen, or sign in with the account you created

## API Notes

Common API routes include:

- /api/health - service and database health check
- /api/auth/* - authentication and account management
- /api/departments - department endpoints
- /api/courses - course endpoints
- /api/instructors - instructor endpoints
- /api/assignments - course assignment endpoints
- /api/schedule - generated schedule endpoints

## Notes

- If MongoDB is unavailable, the server starts in degraded fallback mode and the UI continues to work with demo data in memory.
- The scheduler engine validates instructor hours, section capacity, and schedule conflicts before generating the timetable.
- The app includes PDF export helpers for instructor and student views.

