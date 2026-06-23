# Event Registration System

A full-stack event registration system with an admin portal and public-facing event discovery, registration, and analytics interface.

## Architecture Overview

```
event-registration-system/
├── frontend/            # Vite + React 18 + TypeScript + Tailwind + Ant Design
│   └── src/
│       ├── types/       # TypeScript interface definitions (.d.ts)
│       ├── pages/       # Public-facing pages (Home, Event Detail)
│       │   └── admin/   # Admin SPA pages (Login, Dashboard, Events, Reports, Analytics)
│       ├── components/  # Shared components (Navbar, Footer, AdminLayout)
│       │   └── admin/   # Admin-specific components (RegistrationAnalytics chart)
│       └── services/    # Axios API client (eventApi, registrationApi, adminApi)
├── backend/             # Express + TypeScript + Drizzle + MySQL + Redis + Zod
│   └── src/
│       ├── types/       # TypeScript interface definitions (.d.ts)
│       ├── db/          # Drizzle schema and database connection
│       ├── services/    # Business logic (validation, cache, email, auth)
│       ├── controllers/ # Request handlers (events + registrations)
│       ├── routes/      # Express route definitions (public + admin)
│       └── middleware/  # JWT auth and Zod validation middleware
├── drizzle/             # Auto-generated Drizzle migration files
└── package.json         # Root scripts (concurrently runs both services)
```

## Tech Stack

### Frontend (SPA)
- **Vite 5** - Build tool
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS 3** - Utility-first CSS
- **Ant Design 5** - UI component library
- **React Router 6** - Client-side routing
- **Axios** - HTTP client
- **dayjs** - Date formatting

### Backend (API)
- **Express 4** - Web framework
- **TypeScript** - Type safety
- **Drizzle ORM** - Database ORM (MySQL)
- **MySQL 8** - Relational database
- **Redis** - Caching layer (graceful degradation)
- **Zod** - Request validation
- **JWT** - Authentication
- **Nodemailer** - Email service (Mailpit in dev)
- **EJS** - Server-side admin page rendering

## Prerequisites

- **Node.js** >= 18
- **MySQL** >= 8.0
- **Redis** >= 6.0 (optional — cache degrades gracefully)
- **Mailpit** (recommended for dev email testing) — see [mailpit.axllent.org](https://mailpit.axllent.org)

## Quick Start

### 1. Install Dependencies

```bash
# Install root dependencies (concurrently)
npm install

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Configure Environment

```bash
# Backend configuration
cp backend/.env backend/.env.local
# Edit backend/.env.local with your database credentials
```

Key environment variables in `backend/.env`:

```env
# Backend server port
PORT=3001

# CORS allowed origin
FRONTEND_URL=http://localhost:5173

# MySQL database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=event_registration

# Redis cache (optional — degrades gracefully)
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT authentication (change in production!)
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# SMTP email (defaults to Mailpit in dev)
EMAIL_HOST=localhost
EMAIL_PORT=1025
EMAIL_USER=
EMAIL_PASS=
```

### 3. Initialize Database

```bash
# Generate Drizzle migrations
npm run db:generate

# Push schema to MySQL
npm run db:push

# (Optional) Open Drizzle Studio to inspect data
npm run db:studio
```

### 4. Start Development

```bash
# From root — runs both frontend and backend concurrently
npm run dev

# Or run them separately:
npm run dev:backend   # Backend on http://localhost:3001
npm run dev:frontend  # Frontend on http://localhost:5173
```

### 5. Access the Application

| Page | URL | Description |
|------|-----|-------------|
| **Public Home** | http://localhost:5173 | Event discovery & listing |
| **Event Detail** | http://localhost:5173/event/:id | Event details, registration & calendar download |
| **Admin Login** | http://localhost:5173/admin/login | Admin portal login |
| **Admin Dashboard** | http://localhost:5173/admin | Dashboard with event/registration stats |
| **Admin Events** | http://localhost:5173/admin/event | Event CRUD management |
| **Admin Event Detail** | http://localhost:5173/admin/event/:id | Single event report & capacity |
| **Admin Reports** | http://localhost:5173/admin/report | Reports overview & navigation |
| **Admin Event Report** | http://localhost:5173/admin/report/event-report | Detailed table with utilization bars |
| **Admin Stat Report** | http://localhost:5173/admin/report/statistic-report | SVG line chart analytics |
| **Mailpit UI** | http://localhost:8025 | Dev email preview (if running) |

## Admin Credentials (Mock Data)

| Field | Value |
|-------|-------|
| Email | `admin@erm.com` |
| Password | `12345678` |

## Features

### Public Features
- **Event Discovery** — Browse upcoming events with hero section and keyword search
- **Event Details** — View date, location, capacity, and handler info
- **Email Registration** — 6-digit verification code flow with email delivery
- **Capacity Tracking** — Real-time registration count vs. capacity display
- **Calendar Download** — Download event as `.ics` file for Outlook/iCal

### Admin Features
- **Login** — Secure admin authentication with JWT (24h expiry)
- **Dashboard** — Overview cards (total events, registrations, upcoming)
- **Event Management** — Full CRUD with modal forms and date pickers
- **Event Reports** — Per-event verified/pending registrations + capacity utilization %
- **Overview Reports** — Tabular report across all events with progress bars
- **Registration Analytics** — Interactive SVG line chart with configurable time ranges (1h/1d/1w/1m) and per-event filtering
- **Soft Delete** — Events and registrations use `isDeleted` flag

### Technical Features
- **Soft Delete** — All destructive actions use `is_deleted` flags
- **SQL Count** — Registration counts computed via aggregated SQL queries
- **Redis Caching** — Events cached for 24 hours, invalidated on create/update/delete
- **Zod Validation** — All API inputs validated server-side with descriptive error messages
- **Type Safety** — Full TypeScript throughout with shared `.d.ts` interface definitions
- **Email Verification** — 6-digit code with 5-minute Redis-backed TTL
- **Graceful Degradation** — Works without Redis or SMTP (logs warnings)
- **Time-series Analytics** — Server-side bucketed SQL aggregation over configurable periods
- **EJS Admin Views** — Server-rendered admin pages as alternative to the SPA

## API Endpoints

### Public API (`/api/events`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/events` | List events (`?search=&upcoming=true&page=&limit=`) | No |
| GET | `/api/events/:eventId` | Get single event with registration count | No |
| POST | `/api/events/:eventId/register/send-code` | Send 6-digit verification email | No |
| POST | `/api/events/:eventId/register/verify` | Verify code and complete registration | No |

### Admin API (`/admin/api`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/admin/login/api` | Authenticate and receive JWT | No |
| GET | `/admin/api/events` | List all events (incl. registration count) | JWT |
| POST | `/admin/api/events` | Create a new event | JWT |
| PUT | `/admin/api/events/:eventId` | Update an event | JWT |
| DELETE | `/admin/api/events/:eventId` | Soft-delete an event | JWT |
| GET | `/admin/api/events/:eventId/report` | Per-event report (verified/pending/utilization) | JWT |
| GET | `/admin/api/reports/overview` | All events overview report | JWT |
| GET | `/admin/api/reports/analytics` | Time-series analytics (`?period=&eventId=`) | JWT |

### Admin EJS Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin` | Dashboard (server-rendered) |
| GET | `/admin/login` | Login page |
| GET | `/admin/event` | Events management page |
| GET | `/admin/event/:eventId` | Event detail page |
| GET | `/admin/report` | Reports page |
| GET | `/admin/report/event-report` | Event report page |

## Database Schema

### `events` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | `int` (PK, auto-increment) | Unique event ID |
| `name` | `varchar(255)` | Event name |
| `description` | `text` | Event description |
| `date_time` | `datetime` | Event start time |
| `address` | `varchar(500)` | Event location |
| `registration_deadline` | `datetime` | Cutoff for registration |
| `handler` | `varchar(255)` | Organizer/handler name |
| `capacity` | `int` | Maximum attendees |
| `is_deleted` | `boolean` | Soft delete flag |
| `created_at` | `timestamp` | Record creation time |
| `updated_at` | `timestamp` | Record last update |

Indexes: `is_deleted_idx`, `date_time_idx`

### `registrations` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | `int` (PK, auto-increment) | Unique registration ID |
| `event_id` | `int` (FK → events.id) | Associated event |
| `email` | `varchar(255)` | Registrant email |
| `is_verified` | `boolean` | Email verified flag |
| `is_deleted` | `boolean` | Soft delete flag |
| `created_at` | `timestamp` | Record creation time |
| `updated_at` | `timestamp` | Record last update |

Indexes: `event_id_idx`, `email_idx`, `reg_is_deleted_idx`

## Project Structure

### Backend Structure
```
backend/
├── src/
│   ├── index.ts                  # Express app entry, CORS, EJS setup, route mounting
│   ├── db/
│   │   ├── schema.ts             # Drizzle ORM table definitions (events, registrations)
│   │   └── index.ts              # MySQL connection pool via drizzle-orm
│   ├── types/
│   │   ├── event.d.ts            # Event interfaces
│   │   ├── registration.d.ts     # Registration interfaces
│   │   ├── auth.d.ts             # Auth interfaces (JWT payload, admin user)
│   │   └── api.d.ts              # API response interfaces
│   ├── services/
│   │   ├── validation.ts         # Zod schemas (createEvent, updateEvent, login, etc.)
│   │   ├── cache.ts              # Redis cache with graceful fallback
│   │   ├── email.ts              # Nodemailer transporter with Mailpit support
│   │   └── auth.ts               # JWT sign/verify + mock admin credentials
│   ├── controllers/
│   │   ├── eventController.ts    # getEvents, getEvent, createEvent, updateEvent,
│   │   │                         # deleteEvent, getEventReport, getAllEventsReport,
│   │   │                         # getRegistrationAnalytics (time-series)
│   │   └── registrationController.ts # sendVerificationCode, verifyAndRegister
│   ├── middleware/
│   │   ├── auth.ts               # Bearer JWT verification middleware
│   │   └── validation.ts         # Generic Zod schema validation middleware
│   └── routes/
│       ├── eventRoutes.ts        # Public routes (/) + admin routes mounted at /api/events
│       └── adminRoutes.ts        # Admin login + protected API routes (/admin/*)
├── views/admin/                  # EJS templates for server-rendered admin
│   ├── login.ejs                 # Login page
│   ├── dashboard.ejs             # Dashboard with stats cards
│   ├── events.ejs                # Events management
│   ├── event-detail.ejs          # Event detail view
│   ├── report.ejs                # Reports overview + Chart.js bar chart
│   └── event-report.ejs          # Event report table
├── drizzle/                      # Auto-generated migrations
│   ├── 0000_remarkable_hardball.sql
│   └── meta/
├── drizzle.config.ts             # Drizzle Kit configuration
└── package.json
```

### Frontend Structure
```
frontend/
├── src/
│   ├── main.tsx                  # React entry point
│   ├── App.tsx                   # Router configuration with public/admin layouts
│   ├── index.css                 # Tailwind directives + global styles
│   ├── types/
│   │   ├── event.d.ts            # IEvent, IEventWithRegistrationCount
│   │   ├── registration.d.ts     # IRegistration, IVerificationResponse
│   │   ├── auth.d.ts             # ILoginRequest/Response, IAuthState
│   │   └── api.d.ts              # IApiResponse, IOverviewReport, IRegistrationAnalytics
│   ├── components/
│   │   ├── Navbar.tsx            # Sticky nav with search, logo, admin link
│   │   ├── Footer.tsx            # Multi-column footer
│   │   └── admin/
│   │       ├── AdminLayout.tsx   # Collapsible sidebar + nav + outlet
│   │       └── RegistrationAnalytics.tsx  # Reusable SVG line chart widget
│   ├── pages/
│   │   ├── HomePage.tsx          # Hero section + event cards grid with search
│   │   ├── EventDetailPage.tsx   # Event info, registration modal, .ics download
│   │   └── admin/
│   │       ├── AdminLoginPage.tsx            # Login form with validation
│   │       ├── AdminDashboardPage.tsx        # Stats cards + quick links
│   │       ├── AdminEventsPage.tsx           # Event table + create/edit modals
│   │       ├── AdminEventDetailPage.tsx      # Single event detail + stats
│   │       ├── AdminReportsPage.tsx          # Report entry + summary cards
│   │       ├── AdminEventReportPage.tsx      # Full table with progress bars
│   │       └── AdminStatisticReportPage.tsx  # SVG chart with period selector
│   └── services/
│       └── api.ts                # Axios client with typed API methods
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
└── package.json
```

## Frontend Routes

| Path | Page Component | Description |
|------|---------------|-------------|
| `/` | `HomePage` | Public event listing with hero & search |
| `/event/:eventId` | `EventDetailPage` | Event detail + registration flow |
| `/admin/login` | `AdminLoginPage` | Admin authentication |
| `/admin` | `AdminDashboardPage` | Dashboard overview |
| `/admin/event` | `AdminEventsPage` | Event CRUD table |
| `/admin/event/:eventId` | `AdminEventDetailPage` | Event detail report |
| `/admin/report` | `AdminReportsPage` | Reports hub |
| `/admin/report/event-report` | `AdminEventReportPage` | Full event report table |
| `/admin/report/statistic-report` | `AdminStatisticReportPage` | Time-series analytics chart |

## Registration Flow

1. User browses events and selects one
2. Clicks **Register** — enters email in a modal
3. Backend sends a 6-digit code via email (or visible in Mailpit)
4. User enters the code → backend verifies against Redis-stored value
5. Registration is marked `is_verified = true`
6. Event page updates registration count in real-time

## Analytics — Registration Time-Series

The `GET /admin/api/reports/analytics` endpoint returns bucketed registration counts over a configurable time range:

| Period | Bucket Size | Range | Format |
|--------|-------------|-------|--------|
| `1h` | 10 minutes | 1 hour | Time (e.g. "2:58 PM") |
| `1d` | 2 hours | 24 hours | Time |
| `1w` | 1 day | 7 days | Date (e.g. "Mon, Jun 23") |
| `1m` | 7 days | ~30 days | Date |

Query parameters:
- `period` — `1h`, `1d`, `1w`, or `1m` (default: `1d`)
- `eventId` — optional filter for a single event

The data is rendered as an **SVG line/area chart** on the Statistic Report page with hover tooltips, grid lines, and responsive sizing.

## Environment Variables Reference

### Backend (`backend/.env`)

```bash
PORT=3001
FRONTEND_URL=http://localhost:5173

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=event_registration

REDIS_HOST=localhost
REDIS_PORT=6379

JWT_SECRET=your-super-secret-jwt-key-change-in-production

EMAIL_HOST=localhost
EMAIL_PORT=1025
EMAIL_USER=
EMAIL_PASS=
```

### Frontend (`frontend/.env`)

```bash
VITE_API_BASE_URL=http://localhost:3001
```
