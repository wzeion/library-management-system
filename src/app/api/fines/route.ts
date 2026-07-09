import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import Fine from '@/models/Fine';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const role = (session.user as any).role;
    const userId = (session.user as any).id;

    let query = {};
    if (role === 'member') {
      query = { member: userId };
    }

    const fines = await Fine.find(query)
      .populate('member', 'name email')
      .populate({
        path: 'loan',
        populate: { path: 'book', select: 'title author isbn' }
      })
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, fines });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
