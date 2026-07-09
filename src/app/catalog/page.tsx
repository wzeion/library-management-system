'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface Book {
  _id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  description: string;
  totalCopies: number;
  availableCopies: number;
  qrCodeId: string;
  coverImageUrl?: string;
}

export default function CatalogPage() {
  const { data: session } = useSession();
  const role = session?.user ? (session.user as any).role : null;

  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);

  // Modal / Form states for Librarian/Admin
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [isbn, setIsbn] = useState('');
  const [bookCategory, setBookCategory] = useState('');
  const [description, setDescription] = useState('');
  const [totalCopies, setTotalCopies] = useState(1);
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [formError, setFormError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Reservation states
  const [reservingId, setReservingId] = useState<string | null>(null);
  const [resMessage, setResMessage] = useState<{ bookId: string; type: 'success' | 'error'; text: string } | null>(null);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (category) queryParams.append('category', category);
      if (availableOnly) queryParams.append('available', 'true');

      const res = await fetch(`/api/books?${queryParams.toString()}`);
      const data = await res.json();
      if (data.success) {
        setBooks(data.books);
        
        const allCategories: string[] = data.books.reduce((acc: string[], book: Book) => {
          if (!acc.includes(book.category)) {
            acc.push(book.category);
          }
          return acc;
        }, []);
        if (!search && !category && !availableOnly) {
          setCategories(allCategories);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [search, category, availableOnly]);

  const handleOpenAddModal = () => {
    setEditingBookId(null);
    setTitle('');
    setAuthor('');
    setIsbn('');
    setBookCategory('');
    setDescription('');
    setTotalCopies(1);
    setCoverImageUrl('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (book: Book) => {
    setEditingBookId(book._id);
    setTitle(book.title);
    setAuthor(book.author);
    setIsbn(book.isbn);
    setBookCategory(book.category);
    setDescription(book.description);
    setTotalCopies(book.totalCopies);
    setCoverImageUrl(book.coverImageUrl || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setActionLoading(true);

    const payload = {
      title,
      author,
      isbn,
      category: bookCategory,
      description,
      totalCopies: Number(totalCopies),
      coverImageUrl: coverImageUrl || undefined,
    };

    try {
      const url = editingBookId ? `/api/books/${editingBookId}` : '/api/books';
      const method = editingBookId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        fetchBooks();
      } else {
        setFormError(data.error || 'Operation failed');
      }
    } catch (err: any) {
      setFormError('Network error. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteBook = async (id: string) => {
    if (!confirm('Are you sure you want to delete this book?')) return;

    try {
      const res = await fetch(`/api/books/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchBooks();
      } else {
        alert(data.error || 'Failed to delete book');
      }
    } catch (err) {
      alert('Network error. Failed to delete.');
    }
  };

  const handleReserveBook = async (bookId: string) => {
    setReservingId(bookId);
    setResMessage(null);
    try {
      const res = await fetch(`/api/books/${bookId}/reserve`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setResMessage({
          bookId,
          type: 'success',
          text: `Reserved! Valid until ${new Date(data.reservation.expiresAt).toLocaleDateString()}`,
        });
        fetchBooks();
      } else {
        setResMessage({
          bookId,
          type: 'error',
          text: data.error || 'Failed to reserve',
        });
      }
    } catch (err) {
      setResMessage({
        bookId,
        type: 'error',
        text: 'Network error. Failed to reserve.',
      });
    } finally {
      setReservingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-text px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Civic Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b-4 border-primary">
          <div>
            <h1 className="text-3xl font-extrabold text-primary tracking-tight">
              Official Book Catalog
            </h1>
            <p className="text-sm text-text/80 mt-1">
              Search and filter active books in the library collections.
            </p>
          </div>
          {['librarian', 'admin'].includes(role || '') && (
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-primary hover:bg-primary/95 text-white text-sm font-bold rounded-[2px] shadow-sm transition-colors focus-visible:outline-none"
            >
              Add New Catalog Entry
            </button>
          )}
        </div>

        {/* Filter Toolbar - Plain civic styling */}
        <div className="bg-surface border border-border p-4 rounded-[2px] grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-text mb-1">Search Keywords</label>
            <input
              type="text"
              placeholder="Title, Author, or ISBN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-border rounded-[2px] text-sm focus:outline-none focus:border-primary text-text"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text mb-1">Filter Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-border rounded-[2px] text-sm focus:outline-none focus:border-primary text-text"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center md:pt-5">
            <label className="flex items-center space-x-2.5 cursor-pointer text-sm font-semibold select-none">
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={(e) => setAvailableOnly(e.target.checked)}
                className="w-4 h-4 rounded-xs border-border bg-surface text-primary focus:ring-accent"
              />
              <span>Show Available Only</span>
            </label>
          </div>
        </div>

        {/* Table Layout for Book Catalog (requested for table-driven look) */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-12 bg-surface border border-border rounded-[2px]">
            <p className="text-text/80 text-sm">No catalog entries match your filter inputs.</p>
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-[2px] overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-primary text-white text-xs font-bold uppercase tracking-wider">
                  <th className="p-3 w-16 hidden sm:table-cell">Cover</th>
                  <th className="p-3">Title & Details</th>
                  <th className="p-3 hidden md:table-cell">Description</th>
                  <th className="p-3 w-40 text-center">Copies</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {books.map((book, idx) => (
                  <tr key={book._id} className={idx % 2 === 0 ? 'bg-surface' : 'bg-background/20'}>
                    <td className="p-3 hidden sm:table-cell align-top">
                      <div className="w-12 h-16 bg-background border border-border flex items-center justify-center overflow-hidden rounded-[1px]">
                        {book.coverImageUrl ? (
                          <img
                            src={book.coverImageUrl}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <span className="text-[10px] text-text/50">Book</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 align-top max-w-xs">
                      <div className="font-bold text-text text-base leading-tight">{book.title}</div>
                      <div className="text-text/90 text-xs mt-0.5">By <span className="font-semibold">{book.author}</span></div>
                      <div className="mt-2 flex flex-wrap gap-1 items-center">
                        <span className="px-1.5 py-0.5 bg-background border border-border rounded-[1px] text-[10px] uppercase font-bold text-text/80">
                          {book.category}
                        </span>
                        <span className="text-[10px] font-mono text-text/70 ml-1">
                          ISBN: {book.isbn}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 align-top text-xs text-text/80 hidden md:table-cell leading-relaxed max-w-md">
                      <p className="line-clamp-3">{book.description}</p>
                    </td>
                    <td className="p-3 align-top text-center">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 border rounded-[1px] inline-block ${
                          book.availableCopies > 0
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-rose-50 text-rose-800 border-rose-300'
                        }`}
                      >
                        {book.availableCopies} of {book.totalCopies} available
                      </span>
                    </td>
                    <td className="p-3 align-top text-right space-y-2 max-w-[150px]">
                      {resMessage && resMessage.bookId === book._id && (
                        <div
                          className={`p-1.5 rounded-[1px] text-xs border text-left ${
                            resMessage.type === 'success'
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                              : 'bg-rose-50 border-rose-300 text-rose-800'
                          }`}
                        >
                          {resMessage.text}
                        </div>
                      )}

                      <div className="flex flex-col gap-1.5 justify-end">
                        {role === 'member' && (
                          <button
                            onClick={() => handleReserveBook(book._id)}
                            disabled={reservingId === book._id}
                            className="px-3 py-1 bg-secondary hover:bg-secondary/95 disabled:opacity-50 text-xs font-bold text-white rounded-[2px] transition-colors focus-visible:outline-none"
                          >
                            {reservingId === book._id ? 'Reserving...' : 'Reserve Book'}
                          </button>
                        )}
                        {['librarian', 'admin'].includes(role || '') && (
                          <>
                            <button
                              onClick={() => handleOpenEditModal(book)}
                              className="px-3 py-1 bg-secondary hover:bg-secondary/95 text-xs font-bold text-white rounded-[2px] border border-secondary transition-colors focus-visible:outline-none"
                            >
                              Edit
                            </button>
                            {role === 'admin' && (
                              <button
                                onClick={() => handleDeleteBook(book._id)}
                                className="px-3 py-1 bg-surface border border-primary hover:bg-primary/5 text-primary text-xs font-bold rounded-[2px] transition-colors focus-visible:outline-none"
                              >
                                Delete
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CIVIC FORM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface border-2 border-primary max-w-lg w-full rounded-[2px] shadow-sm p-6 relative">
            <h2 className="text-xl font-bold text-primary mb-4 border-b border-border pb-2">
              {editingBookId ? 'Modify Catalog Entry' : 'New Catalog Registration'}
            </h2>

            {formError && (
              <div className="mb-4 bg-rose-50 border-l-4 border-rose-500 text-rose-800 text-xs p-3 font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-text mb-1">Book Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-[2px] text-sm text-text focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text mb-1">Author</label>
                  <input
                    type="text"
                    required
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-[2px] text-sm text-text focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text mb-1">ISBN</label>
                  <input
                    type="text"
                    required
                    value={isbn}
                    onChange={(e) => setIsbn(e.target.value)}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-[2px] text-sm text-text focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text mb-1">Category</label>
                  <input
                    type="text"
                    required
                    value={bookCategory}
                    onChange={(e) => setBookCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-[2px] text-sm text-text focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text mb-1">Total Copies</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={totalCopies}
                    onChange={(e) => setTotalCopies(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-[2px] text-sm text-text focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-text mb-1">Cover Image URL</label>
                  <input
                    type="text"
                    value={coverImageUrl}
                    onChange={(e) => setCoverImageUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-[2px] text-sm text-text focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-text mb-1">Description</label>
                  <textarea
                    required
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-[2px] text-sm text-text focus:outline-none focus:border-primary"
                  ></textarea>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-background border border-border text-sm font-semibold rounded-[2px] text-text"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-primary hover:bg-primary/95 text-sm font-bold rounded-[2px] text-white disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Save Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
