import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import Book from '../models/Book';
import Loan from '../models/Loan';
import Reservation from '../models/Reservation';
import Fine from '../models/Fine';
import dbConnect from './db';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/library';

async function seed() {
  console.log('Connecting to database...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected.');

  console.log('Clearing existing collections...');
  await Promise.all([
    User.deleteMany({}),
    Book.deleteMany({}),
    Loan.deleteMany({}),
    Reservation.deleteMany({}),
    Fine.deleteMany({}),
  ]);
  console.log('Cleared.');

  console.log('Seeding Users...');
  const adminPassword = await bcrypt.hash('admin123', 10);
  const librarianPassword = await bcrypt.hash('librarian123', 10);
  const memberPassword = await bcrypt.hash('member123', 10);

  const users = await User.create([
    {
      name: 'System Admin',
      email: 'admin@lib.dev',
      passwordHash: adminPassword,
      role: 'admin',
    },
    {
      name: 'Jane Librarian',
      email: 'librarian@lib.dev',
      passwordHash: librarianPassword,
      role: 'librarian',
    },
    {
      name: 'John Member',
      email: 'member@lib.dev',
      passwordHash: memberPassword,
      role: 'member',
    },
  ]);
  console.log(`Seeded ${users.length} users.`);

  console.log('Seeding Books...');
  const books = await Book.create([
    {
      title: 'Introduction to Algorithms',
      author: 'Thomas H. Cormen',
      isbn: '9780262033848',
      category: 'Computer Science',
      description: 'The standard textbook on algorithm design and analysis, covering a broad range of algorithms in depth.',
      totalCopies: 5,
      availableCopies: 5,
      qrCodeId: 'book-algo-9780262033848',
      coverImageUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&q=80',
    },
    {
      title: 'Clean Code',
      author: 'Robert C. Martin',
      isbn: '9780132350884',
      category: 'Software Engineering',
      description: 'A handbook of agile software craftsmanship, explaining how to write clean, reusable, and maintainable code.',
      totalCopies: 2,
      availableCopies: 2,
      qrCodeId: 'book-clean-9780132350884',
      coverImageUrl: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&q=80',
    },
    {
      title: 'Design Patterns',
      author: 'Erich Gamma',
      isbn: '9780201633610',
      category: 'Software Engineering',
      description: 'Elements of Reusable Object-Oriented Software. The classic reference book for software design patterns.',
      totalCopies: 1,
      availableCopies: 1,
      qrCodeId: 'book-patterns-9780201633610',
      coverImageUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&q=80',
    },
    {
      title: 'The Pragmatic Programmer',
      author: 'David Thomas',
      isbn: '9780135957059',
      category: 'Career Development',
      description: 'Your journey to mastery. One of the most significant books for developers to learn how to excel in their career.',
      totalCopies: 1,
      availableCopies: 0, // Set to 0 to test reservation flows
      qrCodeId: 'book-pragmatic-9780135957059',
      coverImageUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80',
    },
    {
      title: 'A Brief History of Time',
      author: 'Stephen Hawking',
      isbn: '9780553380163',
      category: 'Science',
      description: 'A landmark volume in science writing by one of the great minds of our time, exploring the universe.',
      totalCopies: 3,
      availableCopies: 3,
      qrCodeId: 'book-history-9780553380163',
      coverImageUrl: 'https://images.unsplash.com/photo-1447069387593-a5de0862481e?w=400&q=80',
    },
  ]);
  console.log(`Seeded ${books.length} books.`);

  console.log('Seeding completed successfully!');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Error seeding database:', err);
  process.exit(1);
});
