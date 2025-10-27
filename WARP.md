WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project Overview

Smart Drizzle is a local pediatric clinic management system built with Next.js 16 App Router.
Key features: patient management, appointments, immunizations, clinical notes, expenses, and budgets.

Stack:

Next.js 16 (App Router)

TypeScript

Drizzle ORM + PostgreSQL

Better Auth for authentication & role management

Headless UI / Radix UI + Tailwind CSS

Bun runtime & package manager

Biome for linting/formatting

TurboRepo for multi-package monorepo structure

Essential Commands
Development
bun dev               # Start dev server (Next.js + Bun)
bun build             # Build production app
bun start             # Run production server

Code Quality
bun run biome lint    # Lint all TS/JS files
bun run biome check   # Type & syntax checks
bun run biome format  # Format files

Database (Drizzle ORM)
bun run db:generate   # Generate migration files
bun run db:push       # Push schema changes directly
bun run db:studio     # Open Drizzle Studio GUI

Architecture
Authentication & Roles

Better Auth (packages/auth/src/index.ts) manages:

Users, sessions, accounts, verifications

Role assignment: admin, doctor, receptionist

Clinic association via usersToClinicsTable

Roles Usage:

admin: full access

doctor: access to assigned patients/appointments

receptionist: manage appointments, register patients, view expenses (no sensitive clinical notes)

Middleware: src/middleware/auth.ts

Protects routes: /dashboard/*, /patients/*, /appointments/*, /expenses/*

Injects ctx.user with role & clinic association

Multi-Tenant Setup

Users can belong to one or more clinics

Most actions scope to ctx.user.clinic.id for database queries

Default clinic assignment handled in auth.ts signup hooks

Server Actions Pattern

Actions live in src/actions/[action-name]/

schema.ts → Zod validation

index.ts → action implementation using protectedWithClinicActionClient

Always use ctx.user.clinic.id to scope queries/mutations

Routing Structure (App Router)
src/app/
├── (protected)/          # Requires authentication
│   ├── dashboard/
│   ├── patients/
│   ├── appointments/
│   ├── immunizations/
│   ├── expenses/
│   └── clinical-notes/
├── auth/                 # Login/SignUp pages
└── api/auth/[...all]/    # Better Auth API routes

Database Schema

Core tables: patients, appointments, immunizations, clinical_notes, expenses, budgets, users

Relations enforced using Drizzle ORM relations() function

Zod schemas auto-generated for insert/select/update

Role-based RLS (Row-Level Security) using enableRLS() + createdBy/clinicId

Frontend Components

Located in src/components/ and src/components/ui/

Uses Headless UI / Radix UI + Tailwind CSS

Theme provider supports dark/light mode

Reusable UI: buttons, cards, inputs, modals, tables

Timezone Handling

Use dayjs + timezone plugin

Store all dates in UTC, display in clinic local time

Appointment scheduling should convert local → UTC

Environment Variables (.env)
DATABASE_URL=postgres://...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
BUN_ENV=development
RATELIMIT_WINDOW=60000
RATELIMIT_MAX=100

Adding Roles & Protected Actions

Define role in packages/auth/src/index.ts or DB table

Add role checks in middleware:

if (!["admin", "doctor"].includes(ctx.user.role)) throw new Error("Unauthorized")


Use protectedWithClinicActionClient for actions scoped to clinic

Add new action:

src/actions/[action-name]/schema.ts → Zod schema

src/actions/[action-name]/index.ts → action implementation

Call revalidatePath() if frontend route needs refresh

TypeScript / Linting

Strict mode enabled

jsx: "react-jsx" (React 19)

Biome handles formatting & linting

Path alias: @/* → src/*

WARP Tips

Run bun dev to start dev server for WARP live preview

Make sure actions are role-aware before committing

RLS-enabled tables ensure user can only access allowed clinic data

Use packages/db/src/schema.ts for table references in all actions