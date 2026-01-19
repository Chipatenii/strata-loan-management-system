# Architecture Overview

## System Overview

Strata Loan Management System is a **Next.js 14 (App Router)** application deployed on **Vercel** with **Supabase** (Postgres + Auth + Storage) as the backend.

## Module Boundaries

### 1. Frontend Layer

- **Client Components**: Handle UI interactivity (Forms, Dialogs).
- **Server Components**: Fetch data strictly from Supabase using `@supabase/ssr`.
- **UI Library**: Shadcn UI (Radix Primitives + Tailwind).

### 2. Service Layer (`/lib`)

- **Supabase Client**: Singleton instance creation handling Cookies (Auth).
- **Server Actions** (`/lib/actions`): Secure mutations (Login, KYC Approval, Loan Logic, Payments).
  - These actions run on the server and use the user's session from cookies to enforce RLS or Service Role checks.

### 3. Database Layer (Supabase Postgres)

- **Multi-Tenancy**: Strict isolation via `businesses` and `business_memberships`.
- **RLS**: Row-level security enforces tenant boundaries (Admin A cannot see Admin B's data).
- **Triggers**: (Planned) Update timestamps automatically.

### Data Flow

1. **User Request** -> **Middleware.ts** (Auth Guard) -> **Next.js Page** (Server Component).
2. **Page** fetches data via `supabase.from(...).select()`. RLS ensures only user's data is returned.
3. **Form Submission** -> **Server Action** (`'use server'`).
4. **Action** validates Zod schema -> Calls Supabase DB -> Returns Result/Error.
5. **DB Update** -> Affects Tables (`loans`, `ledger`, `payments`).

### Cron / Outbox Design

- **Endpoint**: `/api/cron/reminders` (Protected by `CRON_SECRET`).
- **Trigger**: Vercel Cron sends a GET request daily.
- **Logic**: Reads `loans` due in ~2 days -> Inserts into `notification_outbox`.
- **Sending**: (Stubbed for Pilot) Can be extended to read `notification_outbox` and call SMS Gateway.
