# TODO / Build Schedule (4 Weeks)

Check items off as they're completed. Keep this file current — it's the
single source of truth for "what's done" across sessions.

## Week 1
- [x] Requirement analysis, DB schema finalization, Next.js project setup
- [x] Authentication & role-based access — Member/Librarian/Admin

## Week 2
- [x] Catalog module: search, filter, book detail pages
- [x] Member module: registration, login, borrowing history

## Week 3
- [x] Librarian module: issue, return & reservation management
- [x] Fine calculation & tracking

## Week 4
- [ ] QR code generation & checkout integration (Stretch Goal - Stubbed)
- [ ] Overdue email notifications (Stretch Goal - Stubbed)
- [x] Testing, bug fixing & documentation

## Week 5 (buffer / wrap-up)
- [ ] Deployment & final review

## Definition of Done (per module)
- Feature works end-to-end for the relevant role(s)
- Role/auth checks verified (a member can't hit librarian-only routes)
- Manually tested happy path + at least one edge case (e.g. no copies
  available, book already reserved, fine already exists)
- `SCHEMA.md` updated if any field changed
- Commit message describes what changed and why

## Deferred (see PRD.md → Future Work)
- E-book support / purchase
- Recommendation engine
- Multi-branch support
- Reading lists
- Analytics dashboard
- Bulk CSV import
- Payment gateway integration
