# Architecture / Design

## Overview
The system is a full-stack Next.js application. The App Router serves both
the member-facing catalog/portal and the librarian/admin interfaces. Next.js
API routes act as the backend layer and talk to MongoDB via Mongoose. One
codebase, one language (TypeScript), suited to a solo developer on a 4-week
timeline.

## High-Level Data Flow
```
Members / Librarians / Admin
        │  requests
        ▼
Next.js Frontend (React UI, App Router)
        │  API calls (JSON)
        ▼
Next.js API Routes (Business Logic Layer)
        │                    │                  │
        ▼                    ▼                  ▼
   MongoDB (Atlas)     Email Service        QR Code Module
   Books · Members ·   (Nodemailer)         (Generate / Scan
   Loans · Reservations Overdue Alerts       on Checkout)
   · Fines
        ▲
        │
  Auth & Role Middleware (Member / Librarian / Admin)
```

The API layer applies business logic — availability checks, fine
calculation, role checks — before reading from or writing to MongoDB. Two
supporting modules sit alongside the core API layer: an email service for
overdue notifications, and a QR-code module for quick checkout.

## Actors & Core Use Cases

| Actor     | Use Cases |
|-----------|-----------|
| Member    | Search & filter catalog, reserve book, view borrowing history, scan QR for quick checkout |
| Librarian | Issue/return book, calculate & track fines, manage inventory, send overdue notifications |
| Admin     | Manage roles & access, plus all librarian capabilities |

Role-based access control (via NextAuth.js + JWT) ensures each actor only
sees the tools relevant to their role.

## Module Boundaries
- **Auth & RBAC** — foundation module; every other module depends on it.
- **Catalog module** — search, filter, book detail pages. Read-heavy, public
  or member-facing.
- **Member module** — registration, login, borrowing history.
- **Librarian module** — issue, return, reservation management. Writes to
  Loans/Reservations, checks availability before issuing.
- **Fine engine** — calculates overdue fines based on due dates; runs as
  business logic in the API layer, not a separate service, for this scope.
- **QR module** — generates a QR code per catalog entry; scanning it
  triggers the checkout API route.
- **Notification module** — Nodemailer-based emails as due dates approach or
  pass. Can be triggered by a scheduled job or on-demand from the librarian
  dashboard.

## Build Order (mirrors dependency graph)
1. Auth & role-based access (Member/Librarian/Admin)
2. Catalog module (search, filter, book detail pages)
3. Member module (registration, login, borrowing history)
4. Librarian module (issue, return, reservation management)
5. Fine calculation & tracking
6. QR code generation & checkout integration
7. Overdue email notifications
8. Testing, bug fixing & documentation
9. Deployment & final review

This order exists because later modules read/write data shaped by earlier
ones (e.g. fines depend on loans existing; QR checkout depends on the
catalog and auth being in place).

## Non-Goals for Initial Release
E-book purchase, recommendation engine, multi-branch inventory, and payment
gateway integration are explicitly out of scope for the first deliverable —
see `PRD.md` → Future Work.
