import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import Book from '@/models/Book';
import { z } from 'zod';

const UpdateBookSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  author: z.string().min(1, 'Author is required'),
  isbn: z.string().min(10, 'ISBN must be at least 10 characters'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(1, 'Description is required'),
  totalCopies: z.number().int().nonnegative('Total copies must be non-negative'),
  coverImageUrl: z.string().url().optional().or(z.literal('')),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const book = await Book.findById(id);
    if (!book) {
      return NextResponse.json({ success: false, error: 'Book not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, book });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !['librarian', 'admin'].includes((session.user as any).role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();
    const { id } = await params;
    const body = await req.json();
    const parsed = UpdateBookSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Validation failed', details: parsed.error.format() }, { status: 400 });
    }

    const book = await Book.findById(id);
    if (!book) {
      return NextResponse.json({ success: false, error: 'Book not found' }, { status: 404 });
    }

    if (parsed.data.isbn !== book.isbn) {
      const isbnConflict = await Book.findOne({ isbn: parsed.data.isbn, _id: { $ne: id } });
      if (isbnConflict) {
        return NextResponse.json({ success: false, error: 'Another book already exists with this ISBN' }, { status: 400 });
      }
    }

    const difference = parsed.data.totalCopies - book.totalCopies;
    const newAvailableCopies = book.availableCopies + difference;

    if (newAvailableCopies < 0) {
      return NextResponse.json({
        success: false,
        error: `Cannot decrease total copies to ${parsed.data.totalCopies}. There are currently ${book.totalCopies - book.availableCopies} copies issued, which exceeds the new limit.`,
      }, { status: 400 });
    }

    book.title = parsed.data.title;
    book.author = parsed.data.author;
    book.isbn = parsed.data.isbn;
    book.category = parsed.data.category;
    book.description = parsed.data.description;
    book.totalCopies = parsed.data.totalCopies;
    book.availableCopies = newAvailableCopies;
    book.qrCodeId = `book-qr-${parsed.data.isbn}`;
    if (parsed.data.coverImageUrl !== undefined) {
      book.coverImageUrl = parsed.data.coverImageUrl;
    }

    await book.save();
    return NextResponse.json({ success: true, book });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized (Admins only)' }, { status: 403 });
    }

    await dbConnect();
    const { id } = await params;
    
    const book = await Book.findById(id);
    if (!book) {
      return NextResponse.json({ success: false, error: 'Book not found' }, { status: 404 });
    }

    const Loan = (await import('@/models/Loan')).default;
    const activeLoansCount = await Loan.countDocuments({ book: id, status: 'active' });
    if (activeLoansCount > 0) {
      return NextResponse.json({ success: false, error: 'Cannot delete book. There are active loans currently issued for this book.' }, { status: 400 });
    }

    await Book.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Book deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
