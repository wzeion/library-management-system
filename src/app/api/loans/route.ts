import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import Loan from '@/models/Loan';
import Book from '@/models/Book';
import User from '@/models/User';
import Reservation from '@/models/Reservation';

// GET: List all loans (Librarians/Admins only)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !['librarian', 'admin'].includes((session.user as any).role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();
    
    // Fetch all active/overdue or returned loans
    const loans = await Loan.find({})
      .populate('book', 'title author isbn category')
      .populate('member', 'name email')
      .populate('issuedBy', 'name')
      .sort({ createdAt: -1 });

    const now = new Date();
    const transformedLoans = loans.map((loanDoc) => {
      const loan = loanDoc.toObject();
      if (loan.status === 'active' && new Date(loan.dueDate) < now && !loan.returnDate) {
        loan.status = 'overdue'; // computed status on-the-fly for active overdue loans
      }
      return loan;
    });

    return NextResponse.json({ success: true, loans: transformedLoans });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Issue a book (Librarian/Admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !['librarian', 'admin'].includes((session.user as any).role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();
    const body = await req.json();
    const { bookId, memberEmail } = body;

    if (!bookId || !memberEmail) {
      return NextResponse.json({ success: false, error: 'Missing bookId or memberEmail' }, { status: 400 });
    }

    // 1. Validate member exists
    const member = await User.findOne({ email: memberEmail.toLowerCase(), role: 'member' });
    if (!member) {
      return NextResponse.json({ success: false, error: 'Member with this email not found' }, { status: 404 });
    }

    // 2. Validate book exists
    const book = await Book.findById(bookId);
    if (!book) {
      return NextResponse.json({ success: false, error: 'Book not found' }, { status: 404 });
    }

    // 3. Check if member already has this book issued (active issue)
    const existingLoan = await Loan.findOne({
      book: bookId,
      member: member._id,
      status: 'active',
      returnDate: null,
    });
    if (existingLoan) {
      return NextResponse.json({ success: false, error: 'Member already has an active loan for this book' }, { status: 400 });
    }

    // 4. Reservation walk-in checks:
    // Block walk-ins if availableCopies == 0 OR (availableCopies == 1 AND pendingReservation exists for another member)
    const pendingResForOther = await Reservation.findOne({
      book: bookId,
      member: { $ne: member._id },
      status: 'pending',
    });

    if (book.availableCopies === 0) {
      return NextResponse.json({ success: false, error: 'No copies available for checkout' }, { status: 400 });
    }

    if (book.availableCopies === 1 && pendingResForOther) {
      return NextResponse.json({
        success: false,
        error: 'Cannot issue: the last copy is reserved for another member.',
      }, { status: 400 });
    }

    // 5. Race-condition safe atomic copies decrement
    const updatedBook = await Book.findOneAndUpdate(
      { _id: bookId, availableCopies: { $gt: 0 } },
      { $inc: { availableCopies: -1 } },
      { new: true }
    );

    if (!updatedBook) {
      return NextResponse.json({ success: false, error: 'No copies available' }, { status: 400 });
    }

    // 6. Create Loan
    const issueDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(issueDate.getDate() + 14); // 14 days borrow period

    const loan = await Loan.create({
      book: bookId,
      member: member._id,
      issuedBy: (session.user as any).id,
      issueDate,
      dueDate,
      returnDate: null,
      status: 'active',
      fineId: null,
    });

    // 7. Resolve reservation if member has a pending reservation for this book
    await Reservation.findOneAndUpdate(
      { book: bookId, member: member._id, status: 'pending' },
      { status: 'fulfilled' }
    );

    return NextResponse.json({ success: true, loan });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
