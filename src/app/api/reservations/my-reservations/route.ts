import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import Reservation from '@/models/Reservation';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const memberId = (session.user as any).id;

    const reservations = await Reservation.find({ member: memberId })
      .populate('book', 'title author isbn coverImageUrl category')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, reservations });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
