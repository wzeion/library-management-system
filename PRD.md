# Product Requirements Document — Digital Library Management System

## Problem Statement
Manual, register-based or spreadsheet-based library systems make it hard
for members to check availability remotely, force librarians to calculate
overdue fines by hand, and give nobody a centralized view of borrowing
history or usage. There's no automated due-date reminder mechanism.

## Objective
Digitize the full lifecycle of library operations — cataloging, search,
issuing, returning, and fine collection — through a responsive, role-aware
web application.

## Goals (v1 scope)
1. Searchable, filterable digital catalog of the book collection.
2. Member registration/login, book reservation, and borrowing history view.
3. Librarian tools to issue/return books, manage reservations, track inventory.
4. Automatic overdue fine calculation and a payment/due record per member.
5. QR-code-based quick checkout for each catalog entry.
6. Automated email notifications as due dates approach or pass.
7. Role-based access so Members, Librarians, and Admins each see only what's
   relevant to them.

## User Roles
- **Member** — browse/search/reserve books, view own borrowing history and
  fines, scan QR at checkout.
- **Librarian** — issue/return books, manage reservations and inventory,
  view/track fines, trigger notifications.
- **Admin** — everything a librarian can do, plus manage roles & access.

## Out of Scope for v1 (Future Work)
- E-book support / e-book purchase
- Recommendation engine based on borrowing history
- Multi-branch inventory management
- Shareable member reading lists
- Analytics dashboard (most-borrowed books, active members, trends)
- Bulk CSV import with ISBN metadata auto-fetch
- Payment gateway integration (Stripe/Razorpay) for fees and fines

These are explicitly deferred so the core loan-management workflow can be
built, tested, and polished within the 4-week timeline. If any of these come
up mid-build, flag it rather than building it inline.

## Success Criteria for v1
- A member can register, search the catalog, reserve a book, and see it
  reflected in their borrowing history.
- A librarian can issue a reserved (or walk-in) book, see it move to
  "active" loan status, and return it — with a fine auto-calculated if
  overdue.
- QR-code checkout correctly identifies the book and updates loan state.
- A member nearing/passing their due date receives an email notification.
- Each role only sees UI/actions appropriate to that role.

## Constraints
- Solo developer, 4-week (28-day) timeline.
- Full JavaScript/TypeScript stack (Next.js + MongoDB) to minimize context
  switching between languages/frameworks.
