# Data Schema (MongoDB via Mongoose)

This is the initial schema. Changes here require sign-off per `AGENTS.md`
Critical Rule #1 — other modules (loans, fines, notifications) depend on it.

## User
Covers Member, Librarian, and Admin — differentiated by `role`.

```ts
{
  _id: ObjectId,
  name: string,
  email: string,          // unique, used for login + notifications
  passwordHash: string,   // if using credentials provider
  role: "member" | "librarian" | "admin",
  createdAt: Date,
  updatedAt: Date
}
```

## Book
```ts
{
  _id: ObjectId,
  title: string,
  author: string,
  isbn: string,           // unique
  category: string,
  description: string,
  totalCopies: number,
  availableCopies: number,
  qrCodeId: string,       // encoded value scanned at checkout
  coverImageUrl: string,  // optional
  createdAt: Date,
  updatedAt: Date
}
```

## Loan
Represents a book currently (or previously) issued to a member.

```ts
{
  _id: ObjectId,
  book: ObjectId,         // ref Book
  member: ObjectId,       // ref User
  issuedBy: ObjectId,     // ref User (librarian/admin)
  issueDate: Date,
  dueDate: Date,
  returnDate: Date | null,
  status: "active" | "returned" | "overdue",
  fineId: ObjectId | null // ref Fine, set once a fine is generated
}
```

## Reservation
```ts
{
  _id: ObjectId,
  book: ObjectId,         // ref Book
  member: ObjectId,       // ref User
  reservedAt: Date,
  expiresAt: Date,        // default 7 days from reservedAt
  status: "pending" | "fulfilled" | "cancelled" | "expired"
}
```

## Fine
```ts
{
  _id: ObjectId,
  loan: ObjectId,         // ref Loan
  member: ObjectId,       // ref User
  amount: number,
  reason: string,         // e.g. "overdue return"
  status: "unpaid" | "paid" | "waived",
  createdAt: Date,
  resolvedAt: Date | null
}
```

## Notification (optional log, not strictly required for MVP)
```ts
{
  _id: ObjectId,
  member: ObjectId,       // ref User
  loan: ObjectId,         // ref Loan
  type: "due_soon" | "overdue",
  sentAt: Date
}
```

## Key Relationships & Invariants
- A `Loan.status` of `"active"` means `Book.availableCopies` was decremented by 1 at issue time; returning the book must increment it back.
- **Race Condition Guard:** To prevent race conditions, the available copies decrement must use an atomic MongoDB operation: `{ availableCopies: { $gt: 0 } }` matching and `{ $inc: { availableCopies: -1 } }`.
- **Overdue Computation:** Overdue status for active loans is computed dynamically at the API layer as `dueDate < now && returnDate == null`. The status `"overdue"` is only persisted to the database document when a librarian processes a late return (saving it alongside `"returned"` in the same write operation).
- **Reservation Blocking:** During issue, a librarian cannot issue a book to a walk-in member if `availableCopies == 0` or if `availableCopies == 1` and a pending reservation exists for another member.
- **Waiver & Fine Policy:** Overdue fines accrue at $1.00/day. Fines can be marked as `paid` by Librarians or Admins. Fines can be marked as `waived` by Admins only.
- **Write Ordering for Fines:** Create the `Fine` document first, then update `Loan` with its `fineId` and return status. If the loan update fails, recovery is possible via `Fine.loan == loanId`.
- Indexes worth adding early: `Book.isbn` (unique), `User.email` (unique), `Loan.member` + `Loan.status` (for "my active loans" queries), `Loan.dueDate` (for the overdue-notification job).

