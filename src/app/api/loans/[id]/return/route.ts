import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import Loan from '@/models/Loan';
import Book from '@/models/Book';
import Fine from '@/models/Fine';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !['librarian', 'admin'].includes((session.user as any).role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();
    const { id: loanId } = await params;

    const loan = await Loan.findById(loanId);
    if (!loan) {
      return NextResponse.json({ success: false, error: 'Loan record not found' }, { status: 404 });
    }

    if (loan.returnDate) {
      return NextResponse.json({ success: false, error: 'Book already returned for this loan' }, { status: 400 });
    }

    const returnDate = new Date();
    const dueDate = new Date(loan.dueDate);
    let fineId = null;
    let finalStatus: 'returned' | 'overdue' = 'returned';

    // 1. Check if returned late
    if (returnDate > dueDate) {
      const diffTime = Math.abs(returnDate.getTime() - dueDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 0) {
        const fineAmount = diffDays * 1.00; // $1.00 per day fine
        
        // Write ordering: Create Fine first (Design item 4)
        const fine = await Fine.create({
          loan: loan._id,
          member: loan.member,
          amount: fineAmount,
          reason: `Overdue return (${diffDays} days late)`,
          status: 'unpaid',
          resolvedAt: null,
        });

        fineId = fine._id;
        finalStatus = 'overdue'; // persist "overdue" on the document when returned late
      }
    }

    // Update the Loan document (and link fine if created)
    // Note: If the Loan update fails, the Fine can still be recovered by querying Fine.loan == loanId
    loan.returnDate = returnDate;
    loan.status = finalStatus;
    if (fineId) {
      loan.fineId = fineId;
    }
    await loan.save();

    // Increment available copies on Book
    await Book.findByIdAndUpdate(loan.book, { $inc: { availableCopies: 1 } });

    return NextResponse.json({
      success: true,
      loan,
      fineCreated: !!fineId,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
