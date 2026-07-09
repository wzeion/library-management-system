'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'member' | 'librarian' | 'admin';
  createdAt: string;
}

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setActionLoadingId(userId);
    try {
      const res = await fetch(`/api/users/${userId}/role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
      } else {
        alert(data.error || 'Failed to update user role');
      }
    } catch (err) {
      alert('Network error occurred.');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-text px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b-4 border-primary">
          <div>
            <h1 className="text-3xl font-extrabold text-primary tracking-tight">
              System Administration
            </h1>
            <p className="text-sm text-text/80 mt-1">
              Manage system permissions, assign administrative roles, and audit access keys.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/librarian/dashboard"
              className="px-4 py-2 bg-secondary hover:bg-secondary/95 text-white text-sm font-bold rounded-[2px] transition-colors focus-visible:outline-none text-center"
            >
              Open Librarian Panel
            </Link>
            <Link
              href="/catalog"
              className="px-4 py-2 bg-primary hover:bg-primary/95 text-white text-sm font-bold rounded-[2px] transition-colors focus-visible:outline-none text-center"
            >
              Manage Catalog Books
            </Link>
          </div>
        </div>

        {/* User Management Panel */}
        <div className="bg-surface border border-border p-6 rounded-[2px]">
          <h2 className="text-lg font-bold text-primary mb-4 border-b border-border pb-1">System User Directory</h2>
          
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-border text-xs font-bold text-text uppercase tracking-wider">
                    <th className="pb-2">User Name</th>
                    <th className="pb-2">Email Address</th>
                    <th className="pb-2">Registration Date</th>
                    <th className="pb-2">Assigned Role</th>
                    <th className="pb-2 text-right">Modify Access Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {users.map((user, idx) => (
                    <tr key={user._id} className={idx % 2 === 0 ? 'bg-surface' : 'bg-background/10'}>
                      <td className="py-3 pr-3 font-semibold text-text">{user.name}</td>
                      <td className="py-3 pr-3 text-text/90">{user.email}</td>
                      <td className="py-3 pr-3 text-text/80">{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 pr-3">
                        <span
                          className={`px-2 py-0.5 rounded-[1px] text-xs font-bold border ${
                            user.role === 'admin'
                              ? 'bg-rose-50 text-rose-850 border-rose-350'
                              : user.role === 'librarian'
                              ? 'bg-primary/10 text-primary border-primary/20'
                              : 'bg-background border border-border text-text/80'
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <select
                          value={user.role}
                          disabled={actionLoadingId === user._id || user._id === (session?.user as any)?.id}
                          onChange={(e) => handleRoleChange(user._id, e.target.value)}
                          className="bg-surface border border-border rounded-[2px] text-xs py-1 px-2.5 text-text focus:outline-none focus:border-primary disabled:opacity-50"
                        >
                          <option value="member">Member</option>
                          <option value="librarian">Librarian</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
