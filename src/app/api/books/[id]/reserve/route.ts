import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import Book from '@/models/Book';
import Reservation from '@/models/Reservation';
import Loan from '@/models/Loan';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== 'member') {
      return NextResponse.json({ success: false, error: 'Unauthorized (Members only)' }, { status: 403 });
    }

    await dbConnect();
    const { id: bookId } = await params;
    const memberId = (session.user as any).id;

    const book = await Book.findById(bookId);
    if (!book) {
      return NextResponse.json({ success: false, error: 'Book not found' }, { status: 404 });
    }

    const existingReservation = await Reservation.findOne({
      book: bookId,
      member: memberId,
      status: 'pending',
    });
    if (existingReservation) {
      return NextResponse.json({ success: false, error: 'You already have a pending reservation for this book' }, { status: 400 });
    }

    const existingLoan = await Loan.findOne({
      book: bookId,
      member: memberId,
      status: 'active',
    });
    if (existingLoan) {
      return NextResponse.json({ success: false, error: 'You currently have this book issued' }, { status: 400 });
    }

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7-day expiration per review

    const reservation = await Reservation.create({
      book: bookId,
      member: memberId,
      reservedAt: new Date(),
      expiresAt,
      status: 'pending',
    });

    return NextResponse.json({ success: true, reservation });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
