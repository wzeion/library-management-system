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
}

interface Loan {
  _id: string;
  book: Book;
  issueDate: string;
  dueDate: string;
  returnDate: string | null;
  status: 'active' | 'returned' | 'overdue';
}

interface Reservation {
  _id: string;
  book: Book;
  reservedAt: string;
  expiresAt: string;
  status: 'pending' | 'fulfilled' | 'cancelled' | 'expired';
}

interface Fine {
  _id: string;
  loan: {
    book: Book;
  };
  amount: number;
  reason: string;
  status: 'unpaid' | 'paid' | 'waived';
  createdAt: string;
}

export default function MemberDashboard() {
  const { data: session } = useSession();
  
  const [loans, setLoans] = useState<Loan[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [fines, setFines] = useState<Fine[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'loans' | 'reservations' | 'fines' | 'history'>('loans');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [loansRes, resRes, finesRes] = await Promise.all([
        fetch('/api/loans/my-loans'),
        fetch('/api/reservations/my-reservations'),
        fetch('/api/fines'),
      ]);

      const [loansData, resData, finesData] = await Promise.all([
        loansRes.json(),
        resRes.json(),
        finesRes.json(),
      ]);

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

  const activeLoans = loans.filter((l) => l.status === 'active' || l.status === 'overdue');
  const overdueLoans = loans.filter((l) => l.status === 'overdue');
  const returnedHistory = loans.filter((l) => l.status === 'returned');
  const pendingReservations = reservations.filter((r) => r.status === 'pending');
  const unpaidFines = fines.filter((f) => f.status === 'unpaid');
  const totalUnpaidFineAmount = unpaidFines.reduce((sum, f) => sum + f.amount, 0);

  const handleCancelReservation = async (resId: string) => {
    if (!confirm('Are you sure you want to cancel this reservation?')) return;
    try {
      const res = await fetch(`/api/reservations/${resId}/cancel`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        alert(data.error || 'Failed to cancel reservation');
      }
    } catch (err) {
      alert('Network error occurred.');
    }
  };

  return (
    <div className="min-h-screen bg-background text-text px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b-4 border-primary">
          <div>
            <h1 className="text-3xl font-extrabold text-primary tracking-tight">
              Member Portal
            </h1>
            <p className="text-sm text-text/80 mt-1">
              Account: <span className="font-bold text-text">{session?.user?.name || 'Member'}</span> ({session?.user?.email})
            </p>
          </div>
          <Link
            href="/catalog"
            className="px-4 py-2 bg-primary hover:bg-primary/95 text-white text-sm font-bold rounded-[2px] transition-colors focus-visible:outline-none text-center"
          >
            Browse Book Catalog
          </Link>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface border border-border p-4 rounded-[2px]">
            <span className="block text-xs font-bold text-text/80 uppercase tracking-wider">Active Loans</span>
            <span className="block text-2xl font-extrabold text-primary mt-1">{activeLoans.length}</span>
          </div>
          <div className="bg-surface border border-border p-4 rounded-[2px]">
            <span className="block text-xs font-bold text-text/80 uppercase tracking-wider">Overdue Books</span>
            <span className={`block text-2xl font-extrabold mt-1 ${overdueLoans.length > 0 ? 'text-rose-700' : 'text-primary'}`}>
              {overdueLoans.length}
            </span>
          </div>
          <div className="bg-surface border border-border p-4 rounded-[2px]">
            <span className="block text-xs font-bold text-text/80 uppercase tracking-wider">Pending Reservations</span>
            <span className="block text-2xl font-extrabold text-primary mt-1">{pendingReservations.length}</span>
          </div>
          <div className="bg-surface border border-border p-4 rounded-[2px]">
            <span className="block text-xs font-bold text-text/80 uppercase tracking-wider">Fees / Fines Due</span>
            <span className={`block text-2xl font-extrabold mt-1 ${totalUnpaidFineAmount > 0 ? 'text-amber-800' : 'text-primary'}`}>
              ${totalUnpaidFineAmount.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Flat Tabs navigation */}
        <div className="border-b border-border flex gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('loans')}
            className={`py-2.5 px-4 text-xs font-bold uppercase tracking-wider border-t-2 border-x transition-colors whitespace-nowrap focus-visible:outline-none ${
              activeTab === 'loans'
                ? 'bg-surface border-t-primary border-x-border text-primary'
                : 'bg-background/40 border-t-transparent border-x-transparent text-text/75 hover:text-text hover:bg-background/80'
            }`}
          >
            Active Loans ({activeLoans.length})
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
            Fines & Penalties ({fines.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2.5 px-4 text-xs font-bold uppercase tracking-wider border-t-2 border-x transition-colors whitespace-nowrap focus-visible:outline-none ${
              activeTab === 'history'
                ? 'bg-surface border-t-primary border-x-border text-primary'
                : 'bg-background/40 border-t-transparent border-x-transparent text-text/75 hover:text-text hover:bg-background/80'
            }`}
          >
            Return History
          </button>
        </div>

        {/* Tab contents */}
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
                  <p className="text-text/70 text-sm">You do not currently have any active library checkouts.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b-2 border-border text-xs font-bold text-text uppercase tracking-wider">
                          <th className="pb-2 w-1/3">Book Title</th>
                          <th className="pb-2">Author</th>
                          <th className="pb-2">Issue Date</th>
                          <th className="pb-2">Due Date</th>
                          <th className="pb-2 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border text-sm">
                        {activeLoans.map((loan, idx) => (
                          <tr key={loan._id} className={idx % 2 === 0 ? 'bg-surface' : 'bg-background/10'}>
                            <td className="py-3 font-semibold text-text">{loan.book?.title || 'System Book Data'}</td>
                            <td className="py-3 text-text/90">{loan.book?.author}</td>
                            <td className="py-3 text-text/80">{new Date(loan.issueDate).toLocaleDateString()}</td>
                            <td className="py-3 text-text/80">{new Date(loan.dueDate).toLocaleDateString()}</td>
                            <td className="py-3 text-right">
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
                  <p className="text-text/70 text-sm">No active reservations recorded on this account.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b-2 border-border text-xs font-bold text-text uppercase tracking-wider">
                          <th className="pb-2 w-1/2">Book Title</th>
                          <th className="pb-2">Reserved At</th>
                          <th className="pb-2">Expires At</th>
                          <th className="pb-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border text-sm">
                        {pendingReservations.map((res, idx) => (
                          <tr key={res._id} className={idx % 2 === 0 ? 'bg-surface' : 'bg-background/10'}>
                            <td className="py-3 font-semibold text-text">{res.book?.title}</td>
                            <td className="py-3 text-text/80">{new Date(res.reservedAt).toLocaleDateString()}</td>
                            <td className="py-3 text-text/80">{new Date(res.expiresAt).toLocaleDateString()}</td>
                            <td className="py-3 text-right">
                              <button
                                onClick={() => handleCancelReservation(res._id)}
                                className="text-xs font-bold text-rose-800 hover:text-rose-950 focus-visible:outline-none hover:underline"
                              >
                                Cancel Hold
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

            {/* FINES TAB */}
            {activeTab === 'fines' && (
              <div className="space-y-4">
                {fines.length === 0 ? (
                  <p className="text-text/70 text-sm">No fine records or outstanding fees associated with this account.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b-2 border-border text-xs font-bold text-text uppercase tracking-wider">
                          <th className="pb-2">Date Recorded</th>
                          <th className="pb-2">Book Title</th>
                          <th className="pb-2">Reason</th>
                          <th className="pb-2">Amount</th>
                          <th className="pb-2 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border text-sm">
                        {fines.map((fine, idx) => (
                          <tr key={fine._id} className={idx % 2 === 0 ? 'bg-surface' : 'bg-background/10'}>
                            <td className="py-3 text-text/85">{new Date(fine.createdAt).toLocaleDateString()}</td>
                            <td className="py-3 font-semibold text-text">{fine.loan?.book?.title || 'Returned Item'}</td>
                            <td className="py-3 text-text/90">{fine.reason}</td>
                            <td className="py-3 text-text font-bold">${fine.amount.toFixed(2)}</td>
                            <td className="py-3 text-right">
                              <span
                                className={`px-2 py-0.5 rounded-[1px] text-xs font-bold border ${
                                  fine.status === 'paid'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                    : fine.status === 'waived'
                                    ? 'bg-gray-100 text-gray-700 border-gray-300'
                                    : 'bg-amber-50 text-amber-900 border-amber-300'
                                }`}
                              >
                                {fine.status === 'paid' ? 'PAID' : fine.status === 'waived' ? 'WAIVED' : 'UNPAID'}
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

            {/* HISTORY TAB */}
            {activeTab === 'history' && (
              <div className="space-y-4">
                {returnedHistory.length === 0 ? (
                  <p className="text-text/70 text-sm">No historical checkout records found.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b-2 border-border text-xs font-bold text-text uppercase tracking-wider">
                          <th className="pb-2 w-1/3">Book Title</th>
                          <th className="pb-2">Author</th>
                          <th className="pb-2">Check Out Date</th>
                          <th className="pb-2 text-right">Return Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border text-sm">
                        {returnedHistory.map((loan, idx) => (
                          <tr key={loan._id} className={idx % 2 === 0 ? 'bg-surface' : 'bg-background/10'}>
                            <td className="py-3 font-semibold text-text">{loan.book?.title}</td>
                            <td className="py-3 text-text/90">{loan.book?.author}</td>
                            <td className="py-3 text-text/80">{new Date(loan.issueDate).toLocaleDateString()}</td>
                            <td className="py-3 text-right text-text/80">
                              {loan.returnDate ? new Date(loan.returnDate).toLocaleDateString() : '—'}
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
