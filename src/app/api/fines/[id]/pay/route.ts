import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
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
    const { id: fineId } = await params;
    const role = (session.user as any).role;

    const body = await req.json();
    const { action } = body; // action is either 'pay' or 'waive'

    if (action !== 'pay' && action !== 'waive') {
      return NextResponse.json({ success: false, error: "Invalid action. Must be 'pay' or 'waive'" }, { status: 400 });
    }

    // Role check: Only admin can waive fines
    if (action === 'waive' && role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized: Only administrators can waive fines' }, { status: 403 });
    }

    const fine = await Fine.findById(fineId);
    if (!fine) {
      return NextResponse.json({ success: false, error: 'Fine record not found' }, { status: 404 });
    }

    if (fine.status !== 'unpaid') {
      return NextResponse.json({ success: false, error: 'Fine has already been resolved' }, { status: 400 });
    }

    fine.status = action === 'pay' ? 'paid' : 'waived';
    fine.resolvedAt = new Date();
    await fine.save();

    return NextResponse.json({ success: true, fine });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
