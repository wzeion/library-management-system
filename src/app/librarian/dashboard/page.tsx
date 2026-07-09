'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface Book {
  _id: string;
  title: string;
  author: string;
  isbn: string;
  availableCopies: number;
}

interface Member {
  _id: string;
  name: string;
  email: string;
}

interface Loan {
  _id: string;
  book: Book;
  member: Member;
  issueDate: string;
  dueDate: string;
  returnDate: string | null;
  status: 'active' | 'returned' | 'overdue';
}

interface Reservation {
  _id: string;
  book: Book;
  member: Member;
  reservedAt: string;
  expiresAt: string;
  status: 'pending' | 'fulfilled' | 'cancelled' | 'expired';
}

interface Fine {
  _id: string;
  loan: {
    book: Book;
  };
  member: Member;
  amount: number;
  reason: string;
  status: 'unpaid' | 'paid' | 'waived';
  createdAt: string;
}

export default function LibrarianDashboard() {
  const { data: session } = useSession();
  const role = session?.user ? (session.user as any).role : null;

  const [books, setBooks] = useState<Book[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [fines, setFines] = useState<Fine[]>([]);
  const [loading, setLoading] = useState(true);

  // Issue Book Form
  const [issueBookId, setIssueBookId] = useState('');
  const [issueMemberEmail, setIssueMemberEmail] = useState('');
  const [issueError, setIssueError] = useState('');
  const [issueSuccess, setIssueSuccess] = useState('');
  const [issueLoading, setIssueLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<'loans' | 'reservations' | 'fines'>('loans');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [booksRes, loansRes, resRes, finesRes] = await Promise.all([
        fetch('/api/books'),
        fetch('/api/loans'),
        fetch('/api/reservations'),
        fetch('/api/fines'),
      ]);

      const [booksData, loansData, resData, finesData] = await Promise.all([
        booksRes.json(),
        loansRes.json(),
        resRes.json(),
        finesRes.json(),
      ]);

      if (booksData.success) setBooks(booksData.books);
      if (loansData.success) setLoans(loansData.loans);
      if (resData.success) setReservations(resData.reservations);
      if (finesData.success) setFines(finesData.fines);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleIssueBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setIssueError('');
    setIssueSuccess('');
    setIssueLoading(true);

    try {
      const res = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: issueBookId,
          memberEmail: issueMemberEmail,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIssueSuccess('Book checkout processed successfully.');
        setIssueBookId('');
        setIssueMemberEmail('');
        fetchData();
      } else {
        setIssueError(data.error || 'Failed to issue book');
      }
    } catch (err) {
      setIssueError('Network system error occurred.');
    } finally {
      setIssueLoading(false);
    }
  };

  const handleReturnBook = async (loanId: string) => {
    if (!confirm('Process check-in return for this item?')) return;

    try {
      const res = await fetch(`/api/loans/${loanId}/return`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        let alertMsg = 'Return processed successfully.';
        if (data.fineCreated) {
          alertMsg += ' Overdue fee was generated.';
        }
        alert(alertMsg);
        fetchData();
      } else {
        alert(data.error || 'Failed to process return');
      }
    } catch (err) {
      alert('Network error occurred.');
    }
  };

  const handleFineAction = async (fineId: string, action: 'pay' | 'waive') => {
    if (!confirm(`Mark fine as ${action === 'pay' ? 'paid' : 'waived'}?`)) return;

    try {
      const res = await fetch(`/api/fines/${fineId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        alert(data.error || 'Failed to resolve fine');
      }
    } catch (err) {
      alert('Network error occurred.');
    }
  };

  const activeLoans = loans.filter((l) => !l.returnDate);
  const pendingReservations = reservations.filter((r) => r.status === 'pending');

  return (
    <div className="min-h-screen bg-background text-text px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b-4 border-primary">
          <div>
            <h1 className="text-3xl font-extrabold text-primary tracking-tight">
              Librarian Desk Portal
            </h1>
            <p className="text-sm text-text/80 mt-1">
              Issue and return library media checkouts, track catalog reservations, and collect fees.
            </p>
          </div>
          <Link
            href="/catalog"
            className="px-4 py-2 bg-primary hover:bg-primary/95 text-white text-sm font-bold rounded-[2px] transition-colors focus-visible:outline-none text-center"
          >
            Manage Catalog Books
          </Link>
        </div>

        {/* Issue Forms Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-surface border border-border p-6 rounded-[2px]">
            <h2 className="text-lg font-bold text-primary mb-4 border-b border-border pb-1">Check Out Book</h2>
            
            {issueError && (
              <div className="mb-4 bg-rose-50 border-l-4 border-rose-500 text-rose-800 text-xs p-3 font-semibold">
                {issueError}
              </div>
            )}
            {issueSuccess && (
              <div className="mb-4 bg-emerald-50 border-l-4 border-emerald-600 text-emerald-800 text-xs p-3 font-semibold">
                {issueSuccess}
              </div>
            )}

            <form onSubmit={handleIssueBook} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text mb-1">Select Book Title</label>
                <select
                  required
                  value={issueBookId}
                  onChange={(e) => setIssueBookId(e.target.value)}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-[2px] text-sm focus:outline-none focus:border-primary text-text"
                >
                  <option value="">-- Choose Book --</option>
                  {books.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.title} ({b.availableCopies} left)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text mb-1">Member Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="member@lib.dev"
                  value={issueMemberEmail}
                  onChange={(e) => setIssueMemberEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-[2px] text-sm focus:outline-none focus:border-primary text-text"
                />
              </div>
              <div className="sm:col-span-2 flex justify-end">
                <button
                  type="submit"
                  disabled={issueLoading}
                  className="px-4 py-2 bg-primary hover:bg-primary/95 disabled:opacity-50 text-xs font-bold rounded-[2px] text-white transition-colors focus-visible:outline-none shadow-sm"
                >
                  {issueLoading ? 'Processing...' : 'Process Checkout'}
                </button>
              </div>
            </form>
          </div>

          {/* Quick Stats Panel */}
          <div className="bg-surface border border-border p-6 rounded-[2px] flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold text-primary mb-3 border-b border-border pb-1">System Metrics</h2>
              <div className="space-y-2 text-sm leading-loose">
                <div className="flex justify-between">
                  <span className="text-text/80">Active Checkouts:</span>
                  <span className="font-bold text-text">{activeLoans.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text/80">Pending Holds:</span>
                  <span className="font-bold text-text">{pendingReservations.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text/80">Outstanding Fines:</span>
                  <span className="font-bold text-text">{fines.length}</span>
                </div>
              </div>
            </div>
            <div className="pt-3 border-t border-border text-xs text-text/80">
              Session Profile: <span className="font-bold capitalize">{role}</span>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="border-b border-border flex gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('loans')}
            className={`py-2.5 px-4 text-xs font-bold uppercase tracking-wider border-t-2 border-x transition-colors whitespace-nowrap focus-visible:outline-none ${
              activeTab === 'loans'
                ? 'bg-surface border-t-primary border-x-border text-primary'
                : 'bg-background/40 border-t-transparent border-x-transparent text-text/75 hover:text-text hover:bg-background/80'
            }`}
          >
            Active Checkouts ({activeLoans.length})
          </button>
          <button
            onClick={() => setActiveTab('reservations')}
            className={`py-2.5 px-4 text-xs font-bold uppercase tracking-wider border-t-2 border-x transition-colors whitespace-nowrap focus-visible:outline-none ${
              activeTab === 'reservations'
                ? 'bg-surface border-t-primary border-x-border text-primary'
                : 'bg-background/40 border-t-transparent border-x-transparent text-text/75 hover:text-text hover:bg-background/80'
            }`}
          >
            Reservations ({pendingReservations.length})
          </button>
          <button
            onClick={() => setActiveTab('fines')}
            className={`py-2.5 px-4 text-xs font-bold uppercase tracking-wider border-t-2 border-x transition-colors whitespace-nowrap focus-visible:outline-none ${
              activeTab === 'fines'
                ? 'bg-surface border-t-primary border-x-border text-primary'
                : 'bg-background/40 border-t-transparent border-x-transparent text-text/75 hover:text-text hover:bg-background/80'
            }`}
          >
            System Fines Directory ({fines.length})
          </button>
        </div>

        {/* Tab Content */}
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="bg-surface border border-border p-6 rounded-[2px]">
            {/* LOANS TAB */}
            {activeTab === 'loans' && (
              <div className="space-y-4">
                {activeLoans.length === 0 ? (
                  <p className="text-text/70 text-sm">No active library checkouts in the database.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b-2 border-border text-xs font-bold text-text uppercase tracking-wider">
                          <th className="pb-2 w-1/3">Book Title</th>
                          <th className="pb-2">Member</th>
                          <th className="pb-2">Due Date</th>
                          <th className="pb-2">Status</th>
                          <th className="pb-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border text-sm">
                        {activeLoans.map((loan, idx) => (
                          <tr key={loan._id} className={idx % 2 === 0 ? 'bg-surface' : 'bg-background/10'}>
                            <td className="py-3 font-semibold text-text">{loan.book?.title}</td>
                            <td className="py-3 text-text/95">
                              <span className="block font-semibold">{loan.member?.name}</span>
                              <span className="block text-xs text-text/70">{loan.member?.email}</span>
                            </td>
                            <td className="py-3 text-text/80">{new Date(loan.dueDate).toLocaleDateString()}</td>
                            <td className="py-3">
                              <span
                                className={`px-2 py-0.5 rounded-[1px] text-xs font-bold border ${
                                  loan.status === 'overdue'
                                    ? 'bg-rose-50 text-rose-850 border-rose-300'
                                    : 'bg-primary/10 text-primary border-primary/20'
                                }`}
                              >
                                {loan.status === 'overdue' ? 'OVERDUE' : 'ISSUED'}
                              </span>
                            </td>
                            <td className="py-3 text-right">
                              <button
                                onClick={() => handleReturnBook(loan._id)}
                                className="px-3 py-1.5 bg-secondary hover:bg-secondary/95 font-bold rounded-[2px] text-xs text-white transition-colors focus-visible:outline-none shadow-sm"
                              >
                                Check In
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* RESERVATIONS TAB */}
            {activeTab === 'reservations' && (
              <div className="space-y-4">
                {pendingReservations.length === 0 ? (
                  <p className="text-text/70 text-sm">No pending book holds found.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b-2 border-border text-xs font-bold text-text uppercase tracking-wider">
                          <th className="pb-2 w-1/3">Book Title</th>
                          <th className="pb-2">Member Details</th>
                          <th className="pb-2">Reserved At</th>
                          <th className="pb-2">Expires At</th>
                          <th className="pb-2 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border text-sm">
                        {pendingReservations.map((res, idx) => (
                          <tr key={res._id} className={idx % 2 === 0 ? 'bg-surface' : 'bg-background/10'}>
                            <td className="py-3 font-semibold text-text">{res.book?.title}</td>
                            <td className="py-3 text-text/95">
                              <span className="block font-semibold">{res.member?.name}</span>
                              <span className="block text-xs text-text/75">{res.member?.email}</span>
                            </td>
                            <td className="py-3 text-text/80">{new Date(res.reservedAt).toLocaleDateString()}</td>
                            <td className="py-3 text-text/80">{new Date(res.expiresAt).toLocaleDateString()}</td>
                            <td className="py-3 text-right">
                              <span className="px-2 py-0.5 border border-amber-300 rounded-[1px] text-xs font-bold bg-amber-50 text-amber-900">
                                PENDING
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* FINES TAB */}
            {activeTab === 'fines' && (
              <div className="space-y-4">
                {fines.length === 0 ? (
                  <p className="text-text/70 text-sm">No fine records or active fees found.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b-2 border-border text-xs font-bold text-text uppercase tracking-wider">
                          <th className="pb-2">Member</th>
                          <th className="pb-2 w-1/4">Book Title</th>
                          <th className="pb-2">Reason</th>
                          <th className="pb-2">Amount</th>
                          <th className="pb-2">Status</th>
                          <th className="pb-2 text-right font-bold">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border text-sm">
                        {fines.map((fine, idx) => (
                          <tr key={fine._id} className={idx % 2 === 0 ? 'bg-surface' : 'bg-background/10'}>
                            <td className="py-3">
                              <span className="block font-semibold text-text">{fine.member?.name}</span>
                              <span className="block text-xs text-text/70">{fine.member?.email}</span>
                            </td>
                            <td className="py-3 font-semibold text-text/90">{fine.loan?.book?.title || 'Returned Item'}</td>
                            <td className="py-3 text-text/80">{fine.reason}</td>
                            <td className="py-3 text-text font-bold">${fine.amount.toFixed(2)}</td>
                            <td className="py-3">
                              <span
                                className={`px-2 py-0.5 rounded-[1px] text-xs font-bold border ${
                                  fine.status === 'paid'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                    : fine.status === 'waived'
                                    ? 'bg-gray-100 text-gray-705 border-gray-300'
                                    : 'bg-amber-50 text-amber-900 border-amber-300'
                                }`}
                              >
                                {fine.status === 'paid' ? 'PAID' : fine.status === 'waived' ? 'WAIVED' : 'UNPAID'}
                              </span>
                            </td>
                            <td className="py-3 text-right">
                              {fine.status === 'unpaid' && (
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => handleFineAction(fine._id, 'pay')}
                                    className="px-2 py-1 bg-surface border border-primary hover:bg-primary/5 text-primary text-xs font-bold rounded-[2px] transition-colors focus-visible:outline-none"
                                  >
                                    Accept Pay
                                  </button>
                                  {role === 'admin' && (
                                    <button
                                      onClick={() => handleFineAction(fine._id, 'waive')}
                                      className="px-2 py-1 bg-secondary hover:bg-secondary/95 text-white text-xs font-bold rounded-[2px] transition-colors focus-visible:outline-none"
                                    >
                                      Waive Fine
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
