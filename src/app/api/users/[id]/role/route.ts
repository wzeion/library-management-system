import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized (Admins only)' }, { status: 403 });
    }

    await dbConnect();
    const { id: userId } = await params;
    const body = await req.json();
    const { role } = body;

    if (!['member', 'librarian', 'admin'].includes(role)) {
      return NextResponse.json({ success: false, error: 'Invalid role' }, { status: 400 });
    }

    // Prevent self-role-demotion for sanity
    if ((session.user as any).id === userId && role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Cannot demote your own admin account status' }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    user.role = role;
    await user.save();

    return NextResponse.json({ success: true, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
