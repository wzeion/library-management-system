import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import Loan from '@/models/Loan';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const memberId = (session.user as any).id;

    // Populate book details
    const loans = await Loan.find({ member: memberId })
      .populate('book', 'title author isbn coverImageUrl category')
      .sort({ createdAt: -1 });

    const now = new Date();
    const transformedLoans = loans.map((loanDoc) => {
      const loan = loanDoc.toObject();
      if (loan.status === 'active' && new Date(loan.dueDate) < now && !loan.returnDate) {
        loan.status = 'overdue';
      }
      return loan;
    });

    return NextResponse.json({ success: true, loans: transformedLoans });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
