# Database Schema

## Overview

PostgreSQL hosted on Supabase.

## Tables

### `businesses`

- Accounts/Tenants.
- Columns: `id`, `name`, `code` (invite code).

### `business_memberships`

- Admin/Staff access control.
- Columns: `user_id`, `business_id`, `role`.

### `users`

- Stores profile information linked to `auth.users`.
- Columns: `id` (PK, FK), `email`, `role` (legacy), `full_name`, `business_id`.

### `kyc_records`

- Stores KYC status and documents.
- Columns: `id`, `user_id`, `status` (enum), `risk_score`, `id_document_url`, `proof_of_address_url`.

### `loans`

- Core loan records.
- Columns: `id`, `user_id`, `amount`, `interest_rate`, `status` (pending, active...), `due_date`, `collateral_image_url`.

### `ledger`

- **Source of Truth** for financial calculations.
- Immutable transaction log.
- Columns:
  - `type`: 'principal_disbursed' (+), 'interest_accrued' (+), 'payment_received' (-).
  - `amount`: The transaction value.
  - `balance_after`: Running balance snapshot.

### `payments`

- Submission records for manual reconciliation.
- Columns: `id`, `loan_id`, `amount`, `proof_url`, `status`.

## Enums

- `user_role`: admin, customer
- `kyc_status`: not_submitted, pending_review, approved, rejected
- `loan_status`: pending, active, rejected, closed, defaulted
- `payment_status`: pending, approved, rejected

## Migrations

SQL migrations are stored in `/db/migrations`.
To apply: Run the SQL in Supabase SQL Editor.
