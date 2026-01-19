# Pilot Guide

## Pilot Mode Overview

Strata LMS is currently in **INVITE-ONLY Pilot Mode**.

### 1. Registration

- **Admins**: Sign up via `/auth/admin/sign-up` to create a Business.
- **Customers**: Sign up via `/auth/customer/sign-up`.
  - REQUIRES a **Business Invite Code** provided by the Admin.
  - Example Code: `BIZ123456`.

### 2. Manual Workflow

Since Payment APIs are not integrated:

1. **User Apply**: User requests loan.
2. **Admin Approve**: Admin reviews collateral/risk in Dashboard -> Approves.
    - Money is "simulated" as disbursed.
3. **User Pay**: User makes off-platform payment (Mobile Money/Bank).
4. **User Submit**: User logs into Portal -> Payments -> Enters Ref # & Uploads Screenshot.
5. **Admin Reconcile**: Admin checks Bank Account -> Matches Ref # -> Clicks "Approve" in Dashboard.
    - System updates Ledger and Loan Balance.

### 3. Notification Stub

- SMS/Emails are currently **stubbed**.
- They are written to the database `notification_outbox` table.
- No actual messages are sent to phones/emails in this version.
