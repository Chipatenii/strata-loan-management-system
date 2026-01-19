# Deployment Guide

## Prerequisites

- **GitHub** Account
- **Vercel** Account
- **Supabase** Account

## Step 1: Supabase Setup

1. Create a new Supabase Project.
2. Go to **SQL Editor** -> copy content from `/db/migrations/00_init.sql` -> Run.
3. Go to **Storage**:
    - Create private buckets: `kyc-docs`, `collateral`, `payment-proofs`.
    - (Policies are already in SQL migration, but verify).
4. Go to **Settings -> API**:
    - Copy `Project URL`, `Anon Key`, `Service Role Secret`.

## Step 2: Vercel Deployment

1. Import repo from GitHub.
2. Set Environment Variables:
    - `NEXT_PUBLIC_SUPABASE_URL`: [Your Project URL]
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: [Your Anon Key]
    - `SUPABASE_SERVICE_ROLE_KEY`: [Your Service Role Key]
    - `CRON_SECRET`: [Random String]
    - `PILOT_INVITE_CODES`: `STRATA2025,PILOT2025`
3. Deploy.

## Step 3: Cron Job

1. In Vercel Project Settings -> **Cron Jobs**.
2. It should detect `vercel.json` config (if present) OR you can hit the endpoint manually to test.
    - Endpoint: `/api/cron/reminders`
    - Header: `Authorization: Bearer [CRON_SECRET]`

## Step 4: Admin Access

1. Sign up a user in the live app.
2. Go to Supabase Table editor -> `users` table.
3. Switch `role` from `customer` to `admin` for your user.
