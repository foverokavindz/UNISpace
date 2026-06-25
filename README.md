# UNISpace

**UNISpace** is a role-based educational platform that gives university students and admins a single place to share academic resources, take and grade quizzes, host live study sessions, and stay in sync through notifications and inline comments.

It's built as a monorepo with a **TypeScript Express API** (backend) and a **React 19 + Vite** single-page app (frontend), backed by **Microsoft SQL Server**.

---

## Table of Contents

- [About the Project](#about-the-project)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [1. Clone the repository](#1-clone-the-repository)
  - [2. Database setup](#2-database-setup)
  - [3. Backend setup](#3-backend-setup)
  - [4. Frontend setup](#4-frontend-setup)
- [Environment Variables](#environment-variables)
- [Default Admin Account](#default-admin-account)
- [Available Scripts](#available-scripts)
- [API Overview](#api-overview)
- [Application Routes](#application-routes)
- [Database Schema](#database-schema)
- [Troubleshooting](#troubleshooting)

---

## About the Project

UNISpace solves a common problem in university programs: course materials, assessments, and study coordination are scattered across email, chat apps, and drives. UNISpace centralizes them under one roof with **two roles**:

- **Students** — browse resources by level/semester/subject/category, take quizzes, join live study sessions, comment on resources, and receive notifications.
- **Admins** — upload and manage resources, create quizzes (manually or via CSV import), review submissions and grades, and schedule/host live sessions.

Access is gated by **JWT authentication** with **role-based route guards** on both the frontend (`ProtectedRoute`) and the backend (auth middleware).

---

## Features

- **🔐 Authentication & Accounts**
  - JWT-based login/registration with **bcrypt** password hashing.
  - Self-service password reset via **email OTP** (`forgot-password` → `verify-otp` → `reset-password`), sent through **nodemailer**.
  - Per-tab independent sessions using `sessionStorage`.

- **📚 Resource Management**
  - Hierarchical organization: **Level → Semester → Subject → Category**.
  - File upload & retrieval via **multer**; static files served from `/uploads`.
  - In-browser `.docx` previews rendered with **mammoth**.

- **📝 Quizzes**
  - Two quiz types: **MCQ** and **document-based**.
  - Dynamic MCQ builder — add/remove question blocks with **no fixed limit** (min 1 question).
  - **CSV import** of questions via **papaparse**.
  - Student submission, automatic MCQ scoring, and admin review of submissions.

- **🎥 Live Study Sessions**
  - Scheduled video meetings powered by **Jitsi** (`@jitsi/react-sdk`).
  - **Calendar view** (`react-calendar`) of upcoming sessions, shared by students and admins.
  - Host/participant management, capacity limits, and a unique Jitsi room per session.

- **🔔 Notifications**
  - System notifications per user, optionally linking back to a resource path.

- **💬 Comments**
  - Chat-style inline comment threads on individual resources.

- **📊 Dashboards**
  - Student and admin dashboards with charts via **Chart.js** (`react-chartjs-2`).

---

## Tech Stack

| Layer        | Technologies |
|--------------|--------------|
| **Backend**  | Express.js, TypeScript, SQL Server (`mssql` / `msnodesqlv8`), JWT (`jsonwebtoken`), `bcryptjs`, `multer`, `nodemailer`, `cors`, `dotenv` |
| **Frontend** | React 19, TypeScript, Vite, React Router (`react-router-dom`), Tailwind CSS v4, Axios, Chart.js, `@jitsi/react-sdk`, `react-calendar`, `lucide-react`, `mammoth`, `papaparse`, `jwt-decode` |
| **Database** | Microsoft SQL Server (MSSQL) |
| **Tooling**  | `ts-node`, `nodemon`, `tsc`, Vite |

---

## Architecture

```
┌─────────────────────────┐         HTTP / JSON          ┌─────────────────────────┐
│   Frontend (React 19)   │  ───────────────────────────▶│   Backend API (Express)  │
│   Vite · :5173          │   Authorization: Bearer JWT  │   TypeScript · :5000     │
│                         │◀───────────────────────────  │                          │
│  ProtectedRoute (RBAC)  │                              │  Auth middleware (RBAC)  │
└─────────────────────────┘                              └────────────┬─────────────┘
                                                                       │ mssql pool
                                                          ┌────────────▼─────────────┐
                                                          │   SQL Server (MSSQL)     │
                                                          │   unispace_db            │
                                                          └──────────────────────────┘
            Live video sessions are handled client-side via Jitsi (@jitsi/react-sdk).
```

- **CORS** allows the Vite dev server on ports `5173`, `5174`, `5175`.
- **Auth flow**: JWT issued on login, sent in the `Authorization: Bearer <token>` header on protected requests, validated by backend middleware.
- **Error contract**: API returns `{ success: false, message: "..." }` on errors; the frontend checks `success` before using data.
- **Connection pooling**: configured in `config/database.ts` (max 10 connections) with retry/reconnect logic.

---

## Project Structure

```
UNISpace/
├── backend/
│   ├── src/
│   │   ├── server.ts              # Entry point — starts HTTP server, connects DB
│   │   ├── app.ts                 # Express app, middleware, route registration
│   │   ├── config/database.ts     # MSSQL pooling & retry logic
│   │   ├── routes/                # auth, resources, notifications, quizzes, comments, sessions
│   │   ├── controllers/           # Business logic per feature
│   │   ├── middleware/            # Auth guards, validators
│   │   └── types/                 # TypeScript interfaces
│   ├── database/schema.sql        # SQL Server schema + seed data
│   ├── create-*.ts                # Manual migration scripts (resources, notifications, quizzes, sessions)
│   ├── uploads/                   # Uploaded files (served at /uploads)
│   └── .env.example
│
└── frontend/
    └── src/
        ├── App.tsx                # React Router setup + protected routes
        ├── context/AuthContext.tsx# Auth state & JWT management
        ├── pages/                 # Student, admin, shared, and session pages
        ├── components/            # Navbar, Sidebar, Layout, ProtectedRoute, JitsiRoom, modals, ui/
        ├── services/              # Axios API clients
        └── types/                 # TypeScript interfaces
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Microsoft SQL Server** (local or remote) — e.g. SQL Server Express / Developer
- Optionally **SSMS** or `sqlcmd` to run the schema script

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd UNISpace
```

### 2. Database setup

1. Make sure a SQL Server instance is running and reachable.
2. Run the schema script — it creates the `unispace_db` database, all tables, default roles, and a seed admin account:

   ```bash
   # From the backend/ directory, using sqlcmd:
   sqlcmd -S localhost -U sa -P your_password -i database/schema.sql
   ```

   …or open `backend/database/schema.sql` in **SSMS** and execute it.

3. The `create-*.ts` scripts (`create-resources-table.ts`, `create-notifications-table.ts`, `create-quiz-tables.ts`, `create-sessions-table.ts`) are available if you prefer running feature migrations individually instead of the full schema.

### 3. Backend setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# then edit .env with your DB credentials and a JWT secret

# Start the dev server (hot reload via nodemon)
npm run dev          # → http://localhost:5000
```

Verify it's up:

```bash
curl http://localhost:5000/api/health
# { "success": true, "message": "UNISpace API is running." }
```

### 4. Frontend setup

```bash
cd frontend

# Install dependencies
npm install

# (Optional) point the app at a non-default API URL
echo "VITE_API_URL=http://localhost:5000" > .env

# Start the Vite dev server
npm run dev          # → http://localhost:5173
```

Open **http://localhost:5173** and log in with the [default admin account](#default-admin-account).

---

## Environment Variables

### Backend (`backend/.env`)

| Variable                       | Description                                            | Example                          |
|--------------------------------|--------------------------------------------------------|----------------------------------|
| `PORT`                         | API server port                                        | `5000`                           |
| `DB_SERVER`                    | SQL Server host                                        | `localhost`                      |
| `DB_PORT`                      | SQL Server port                                        | `1433`                           |
| `DB_USER`                      | SQL login user                                         | `sa`                             |
| `DB_PASSWORD`                  | SQL login password                                     | `your_mssql_password`            |
| `DB_NAME`                      | Database name                                          | `unispace_db`                    |
| `DB_TRUSTED_CONNECTION`        | Use Windows Authentication instead of a SQL login      | `false`                          |
| `DB_TRUST_SERVER_CERTIFICATE`  | Trust self-signed certs (common locally)               | `true`                           |
| `JWT_SECRET`                   | Secret for signing JWTs — **change in production**     | `super_secret_change_me`         |
| `JWT_EXPIRES_IN`               | Token expiration                                       | `7d`                             |

> **Email/OTP note:** password-reset emails are sent via nodemailer. Configure your SMTP credentials in the backend as required by `auth.controller.ts` before relying on the forgot-password flow.

### Frontend (`frontend/.env`)

| Variable        | Description                | Default                  |
|-----------------|----------------------------|--------------------------|
| `VITE_API_URL`  | Backend API base URL       | `http://localhost:5000`  |

---

## Default Admin Account

The schema seeds an admin you can log in with immediately:

| Field    | Value                  |
|----------|------------------------|
| Email    | `admin@unispace.com`   |
| Password | `password`             |

> ⚠️ **Change this password right after your first login.**

New student accounts can be created through the **Register** page.

---

## Available Scripts

### Backend (`cd backend`)

| Command         | Description                                       |
|-----------------|---------------------------------------------------|
| `npm run dev`   | Start dev server with hot reload (nodemon)        |
| `npm run build` | Compile TypeScript to `dist/`                     |
| `npm start`     | Run the compiled server from `dist/`              |

### Frontend (`cd frontend`)

| Command           | Description                          |
|-------------------|--------------------------------------|
| `npm run dev`     | Start the Vite dev server            |
| `npm run build`   | Type-check and build for production  |
| `npm run preview` | Preview the production build         |

---

## API Overview

All endpoints are prefixed with `/api`. Protected routes require an `Authorization: Bearer <token>` header.

| Resource          | Base Path                                  | Notes |
|-------------------|--------------------------------------------|-------|
| Health            | `GET /api/health`                          | Liveness check |
| Auth              | `/api/auth`                                | `register`, `login`, `me`, `profile`, `forgot-password`, `verify-otp`, `reset-password` |
| Resources         | `/api/resources`                           | CRUD for educational materials + file uploads |
| Comments          | `/api/resources/:resourceId/comments`      | Inline comments nested under resources |
| Notifications     | `/api/notifications`                       | Send/retrieve user notifications |
| Quizzes           | `/api/quizzes`                             | Create, submit, grade quizzes (MCQ / document) |
| Sessions          | `/api/sessions`                            | Create, list, get, join, delete live sessions |
| Static uploads    | `/uploads`                                 | Serves files from `backend/uploads/` |

**Auth endpoints in detail:**

| Method | Endpoint                      | Auth | Purpose                          |
|--------|-------------------------------|------|----------------------------------|
| POST   | `/api/auth/register`          | —    | Create a new student account     |
| POST   | `/api/auth/login`             | —    | Login (student or admin)         |
| GET    | `/api/auth/me`                | ✅   | Get the current user             |
| PUT    | `/api/auth/profile`           | ✅   | Update the current user profile  |
| POST   | `/api/auth/forgot-password`   | —    | Request a reset OTP via email    |
| POST   | `/api/auth/verify-otp`        | —    | Verify the OTP                   |
| POST   | `/api/auth/reset-password`    | —    | Reset password after OTP verify  |

---

## Application Routes

Frontend routes are role-guarded by `ProtectedRoute`. Visiting `/` redirects to `/login`.

**Public**
- `/login`, `/register`, `/forgot-password`

**Student** (`student` role)
- `/student/dashboard`, `/student/notifications`, `/student/profile`
- `/student/resources` → `/:level` → `/:level/:semester` → `/:level/:semester/:subject` → `/:level/:semester/:subject/:category`
- `/student/quizzes`, `/student/quizzes/:id`
- `/student/sessions`, `/student/sessions/:id`

**Admin** (`admin` role)
- `/admin/dashboard`, `/admin/profile`, `/admin/resources`
- `/admin/upload-resources` (+ the same hierarchical level/semester/subject/category sub-routes)
- `/admin/quizzes`, `/admin/quizzes/create`, `/admin/quizzes/:id/submissions`
- `/admin/sessions`, `/admin/sessions/:id`

---

## Database Schema

Core tables (see `backend/database/schema.sql` for the full definition):

- **`users`** — students and admins (`role` ∈ `student` | `admin`), with OTP fields for password reset.
- **`roles`** — reference table seeded with `student` and `admin`.
- **`notifications`** — per-user messages, optional `resource_path`.
- **`resources`** — academic materials tagged by `level`, `semester`, `subject`, `category`.
- **`quizzes`** — quiz metadata (`type` ∈ `mcq` | `document`, time limit, stream).
- **`quiz_questions`** — MCQ questions with options A–D and the correct option.
- **`quiz_submissions`** — student submissions/scores (unique per quiz+student).
- **`resource_comments`** — chat-style comments per resource.
- **`sessions`** — live study sessions (`status` ∈ `scheduled` | `active` | `ended`) with a Jitsi room name.
- **`session_participants`** — join records (unique per session+user).

Foreign keys cascade on delete where appropriate (e.g. notifications, questions, submissions, comments, participants).

---

## Troubleshooting

- **Backend won't connect to the DB** — verify SQL Server is running and the `DB_*` values in `backend/.env` are correct. For local self-signed certs set `DB_TRUST_SERVER_CERTIFICATE=true`. Watch the `npm run dev` console for connection logs.
- **CORS errors in the browser** — the API only allows Vite ports `5173`–`5175` by default. If your frontend runs elsewhere, add the origin in `backend/src/app.ts`.
- **401 / auth failures** — confirm a valid JWT is present and the `JWT_SECRET` matches the one used to sign it.
- **Password-reset email not arriving** — make sure SMTP/nodemailer credentials are configured on the backend.
- **Uploaded files 404** — they're served from `/uploads`; confirm `backend/uploads/` exists and the file path is correct.

---

_UNISpace — bringing course resources, quizzes, and live study sessions into one place._
