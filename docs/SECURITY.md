# Security Architecture

## 1. Authentication & Authorization

- **Supabase Auth**: Managed authentication (Email/Password).
- **Middleware**: `middleware.ts` forces session validation on `/portal` and `/admin` routes.
- **Role-Based Access**:
  - `users` table has `role` enum ('customer', 'admin').
  - RLS policies restrict access to 'admin' role for sensitive data.

## 2. Row Level Security (RLS) & Multi-Tenancy

Every table has RLS enabled with strict Tenant Isolation.

- **Data Hierarchy**: All entities (`loans`, `users`) are scoped to a `business_id`.
- **Customers**: Can only `SELECT` their own data (`user_id = auth.uid()`).
- **Admins**: Can only Access data belonging to their **Business Membership**.
  - Policy: `exists (select 1 from business_memberships where user_id = auth.uid() and role = 'admin' and business_id = target.business_id)`
- **Cross-Tenant Prevention**: An Admin of Business A cannot access data of Business B.

## 3. Storage Security

Supabase Storage buckets are private.

- Policies ensure users can only upload files to their own folder paths: `{userId}/*`.
- Admins can read all files.
- Signed URLs or strict RLS-based reads are required to view files.

## 4. Input Validation

- **Zod**: All Server Actions validate inputs against strict Zod schemas before processing.
- **Sanitization**: React escapes output by default.

## 5. Audit Logging

- Critical actions (KYC Approval, Loan Approval, Payment Reconciliation) record `reviewed_by` and timestamp fields in the database.
- Future: Dedicated `audit_logs` table.

## 6. Secrets Management

- `SUPABASE_SERVICE_ROLE_KEY` is NEVER exposed to the client. It is only used in trusted server environments (Cron).
- `CRON_SECRET` protects the cron endpoint.
