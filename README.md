# Strata Loan Management System (Pilot MVP)

A mobile-first, secure, invite-only loan management platform designed for micro-lending pilots.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TailwindCSS, Shadcn UI.
- **Backend**: Supabase (Postgres, Auth, Storage, RLS).
- **Core Logic**: Server Actions, Ledger-based accounting.

## Features

- **Customer Portal**: KYC, Loan Application, Manual Payment Submission.
- **Admin Portal**: Approval Queues, Risk Scoring, Payment Reconciliation.
- **Security**: Row Level Security (RLS) enabled on all tables.
- **Pilot Ready**: Invite-only logic, Manual payment workflows.

## Documentation

- [Architecture](/docs/ARCHITECTURE.md)
- [Security](/docs/SECURITY.md)
- [Database Schema](/docs/DATABASE.md)
- [Pilot Guide](/docs/PILOT_GUIDE.md)
- [Deployment](/docs/DEPLOYMENT.md)

## Scalability

Designed as a modular monolith.

- **Database**: Relational schema can scale to millions of rows with indexing.
- **Ledger**: Double-entry ready design ensures financial integrity.
- **Frontend**: Component-driven for easy reusability.
