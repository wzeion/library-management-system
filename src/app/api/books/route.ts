import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import Book from '@/models/Book';
import { z } from 'zod';

const BookSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  author: z.string().min(1, 'Author is required'),
  isbn: z.string().min(10, 'ISBN must be at least 10 characters'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(1, 'Description is required'),
  totalCopies: z.number().int().nonnegative('Total copies must be non-negative'),
  coverImageUrl: z.string().url().optional().or(z.literal('')),
});

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const available = searchParams.get('available') === 'true';

    const query: any = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { isbn: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) {
      query.category = category;
    }

    if (available) {
      query.availableCopies = { $gt: 0 };
    }

    const books = await Book.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, books });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !['librarian', 'admin'].includes((session.user as any).role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();
    const body = await req.json();
    const parsed = BookSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Validation failed', details: parsed.error.format() }, { status: 400 });
    }

    const existingBook = await Book.findOne({ isbn: parsed.data.isbn });
    if (existingBook) {
      return NextResponse.json({ success: false, error: 'Book with this ISBN already exists' }, { status: 400 });
    }

    const qrCodeId = `book-qr-${parsed.data.isbn}`;

    const book = await Book.create({
      ...parsed.data,
      availableCopies: parsed.data.totalCopies,
      qrCodeId,
    });

    return NextResponse.json({ success: true, book });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
