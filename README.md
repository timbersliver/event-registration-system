# Event Registration System

A full-stack event registration system with an admin portal and public-facing event discovery and registration interface.

## Architecture Overview

```
event-registration-system/
├── frontend/          # Vite + React + TypeScript + Tailwind + Ant Design
│   └── src/
│       ├── types/     # TypeScript interface definitions (.d.ts)
│       ├── pages/     # Public-facing pages (Home, Event Detail)
│       │   └── admin/ # Admin pages (Login, Dashboard, Events, Reports)
│       ├── components/ # Shared components (Navbar, Footer, AdminLayout)
│       └── services/  # API client service
├── backend/           # Express + TypeScript + Drizzle + MySQL + Redis + Zod
│   └── src/
│       ├── types/     # TypeScript interface definitions (.d.ts)
│       ├── db/        # Drizzle schema and database connection
│       ├── services/  # Business logic (validation, cache, email, auth)
│       ├── controllers/ # Request handlers
│       ├── routes/    # Express route definitions
│       └── middleware/ # Auth and validation middleware
└── package.json       # Root scripts for running both services
```

## Tech Stack

### Frontend (Public)
- **Vite** - Build tool
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS
- **Ant Design** - UI component library
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **dayjs** - Date formatting

### Backend (API + Email)
- **Express** - Web framework
- **TypeScript** - Type safety
- **Drizzle ORM** - Database ORM
- **MySQL** - Relational database
- **Redis** - Caching layer
- **Zod** - Request validation
- **JWT** - Authentication
- **Nodemailer** - Email service

## Prerequisites

- **Node.js** >= 18
- **MySQL** >= 8.0
- **Redis** >= 6.0 (optional - cache degrades gracefully)

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

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend server port | `3001` |
| `DB_HOST` | MySQL host | `localhost` |
| `DB_PORT` | MySQL port | `3306` |
| `DB_USER` | MySQL user | `root` |
| `DB_PASSWORD` | MySQL password | `` |
| `DB_NAME` | Database name | `event_registration` |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `JWT_SECRET` | JWT signing secret | (change in production) |
| `EMAIL_HOST` | SMTP host | (uses Mailpit in dev) |

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
# From root - runs both frontend and backend concurrently
npm run dev

# Or run them separately:
npm run dev:backend   # Backend on http://localhost:3001
npm run dev:frontend  # Frontend on http://localhost:5173
```

### 5. Access the Application

| Page | URL | Description |
|------|-----|-------------|
| **Public Home** | http://localhost:5173 | Event discovery & listing |
| **Event Detail** | http://localhost:5173/event/:id | Event details & registration |
| **Admin Login** | http://localhost:5173/admin/login | Admin portal login |
| **Admin Dashboard** | http://localhost:5173/admin | Admin dashboard |
| **Admin Events** | http://localhost:5173/admin/event | Event management |
| **Admin Reports** | http://localhost:5173/admin/report | Registration reports |

## Admin Credentials (Mock Data)

| Field | Value |
|-------|-------|
| Email | `admin@erm.com` |
| Password | `12345678` |

## Features

### Public Features
- **Event Discovery** - Browse upcoming events with search functionality
- **Event Details** - View event information, date, location, capacity
- **Email Registration** - Register with email verification (6-digit code)
- **Real-time Status** - See registration counts and availability

### Admin Features
- **Login** - Secure admin authentication with JWT
- **Dashboard** - Overview of events and registrations
- **Event Management** - Create, edit, and delete events
- **Reports** - Registration analytics and capacity utilization

### Technical Features
- **Soft Delete** - Events and registrations use `isDeleted` flag instead of hard delete
- **SQL Count** - Registration counts calculated via SQL COUNT query
- **Redis Caching** - Events cached for 24 hours, invalidated on changes
- **Zod Validation** - All API inputs validated server-side
- **Type Safety** - Full TypeScript with `.d.ts` interface definitions
- **Email Verification** - 6-digit code verification for public registration
- **Graceful Degradation** - Works without Redis or email SMTP

## API Endpoints

### Public API (`/api/events`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events` | List events (supports `?search=&upcoming=true&page=&limit=`) |
| GET | `/api/events/:id` | Get event details |
| POST | `/api/events/:id/register/send-code` | Send verification email |
| POST | `/api/events/:id/register/verify` | Verify code and register |

### Admin API (`/admin/api`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/admin/login/api` | Admin login |
| GET | `/admin/api/events` | List all events (auth) |
| GET | `/admin/api/events/:id/report` | Event registration report (auth) |
| GET | `/admin/api/reports/overview` | All events overview report (auth) |
| POST | `/admin/api/events` | Create event (auth) |
| PUT | `/admin/api/events/:id` | Update event (auth) |
| DELETE | `/admin/api/events/:id` | Soft-delete event (auth) |

## Project Structure

### Backend Structure
```
backend/
├── src/
│   ├── index.ts              # Express app entry point
│   ├── db/
│   │   ├── schema.ts         # Drizzle ORM schema definitions
│   │   └── index.ts          # Database connection pool
│   ├── types/
│   │   ├── event.d.ts        # Event interfaces
│   │   ├── registration.d.ts # Registration interfaces
│   │   ├── auth.d.ts         # Auth interfaces
│   │   └── api.d.ts          # API response interfaces
│   ├── services/
│   │   ├── validation.ts     # Zod validation schemas
│   │   ├── cache.ts          # Redis cache service
│   │   ├── email.ts          # Email service (Nodemailer)
│   │   └── auth.ts           # JWT auth service
│   ├── controllers/
│   │   ├── eventController.ts      # Event CRUD + reports
│   │   └── registrationController.ts # Registration flow
│   ├── middleware/
│   │   ├── auth.ts           # JWT verification middleware
│   │   └── validation.ts     # Zod validation middleware
│   └── routes/
│       ├── eventRoutes.ts    # Public + admin event routes
│       └── adminRoutes.ts    # Admin page routes
└── views/admin/              # EJS admin templates
    ├── login.ejs
    ├── dashboard.ejs
    ├── events.ejs
    ├── event-detail.ejs
    ├── report.ejs
    └── event-report.ejs
```

### Frontend Structure
```
frontend/
└── src/
    ├── main.tsx              # React entry point
    ├── App.tsx               # Router and layout
    ├── index.css             # Tailwind + global styles
    ├── types/
    │   ├── event.d.ts        # Event interfaces
    │   ├── registration.d.ts # Registration interfaces
    │   ├── api.d.ts          # API response interfaces
    │   └── auth.d.ts         # Auth interfaces
    ├── components/
    │   ├── Navbar.tsx        # Navigation bar
    │   └── Footer.tsx        # Page footer
    ├── pages/
    │   ├── HomePage.tsx      # Event listing (Meetup.com inspired)
    │   └── EventDetailPage.tsx # Event detail + registration
    └── services/
        └── api.ts            # Axios API client
```
