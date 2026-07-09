'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setError(data.error || 'Registration failed. Check details.');
      }
    } catch (err: any) {
      setError('An unexpected system error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-text flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-surface border border-border p-8 rounded-[2px] space-y-6">
        <div className="border-b-2 border-primary pb-3">
          <h2 className="text-2xl font-bold text-primary">Member Registration</h2>
          <p className="text-xs text-text/80 mt-1">
            Create a secure academic library member account.
          </p>
        </div>

        {error && (
          <div className="bg-surface border-l-4 border-primary p-3 text-sm text-text font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-surface border-l-4 border-emerald-600 p-3 text-sm text-emerald-800 font-medium">
            Account created successfully. Redirecting to login portal...
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wider text-text mb-1">
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-border bg-surface text-text rounded-[2px] focus:outline-none focus:border-primary text-sm"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-text mb-1">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-border bg-surface text-text rounded-[2px] focus:outline-none focus:border-primary text-sm"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-text mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-border bg-surface text-text rounded-[2px] focus:outline-none focus:border-primary text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full py-2.5 bg-primary hover:bg-primary/95 text-white font-bold rounded-[2px] transition-colors focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-sm"
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <div className="text-center text-sm pt-2 border-t border-border/85">
          <span className="text-text/80">Already have an account? </span>
          <Link href="/login" className="font-bold text-primary hover:underline hover:text-secondary focus-visible:outline-none">
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
}
