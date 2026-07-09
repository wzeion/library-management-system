'use client';

import React, { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const role = (session.user as any).role;
      if (role === 'admin') router.push('/admin/dashboard');
      else if (role === 'librarian') router.push('/librarian/dashboard');
      else router.push('/member/dashboard');
    }
  }, [session, status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await signIn('credentials', {
        email: email.toLowerCase(),
        password,
        redirect: false,
      });

      if (res?.error) {
        setError('The email or password you entered is incorrect.');
      } else {
        router.refresh();
      }
    } catch (err: any) {
      setError('An unexpected system error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || status === 'authenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-text">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm font-medium">Authorizing credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-text flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-surface border border-border p-8 rounded-[2px] space-y-6">
        <div className="border-b-2 border-primary pb-3">
          <h2 className="text-2xl font-bold text-primary">Sign In</h2>
          <p className="text-xs text-text/80 mt-1">
            Access secure digital library portal.
          </p>
        </div>

        {error && (
          <div className="bg-surface border-l-4 border-primary p-3 text-sm text-text font-medium">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-text mb-1">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
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
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-border bg-surface text-text rounded-[2px] focus:outline-none focus:border-primary text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-primary hover:bg-primary/95 text-white font-bold rounded-[2px] transition-colors focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-sm"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center text-sm pt-2">
          <span className="text-text/80">Need an account? </span>
          <Link href="/register" className="font-bold text-primary hover:underline hover:text-secondary focus-visible:outline-none">
            Register Member Account
          </Link>
        </div>

        <div className="pt-4 border-t border-border/80">
          <p className="text-xs font-bold text-text/80 mb-2 uppercase tracking-wider">Academic Demo Credentials:</p>
          <div className="space-y-2 text-xs font-mono bg-background p-3 border border-border rounded-[2px]">
            <div><span className="font-bold">Admin:</span> admin@lib.dev / admin123</div>
            <div><span className="font-bold">Librarian:</span> librarian@lib.dev / librarian123</div>
            <div><span className="font-bold">Member:</span> member@lib.dev / member123</div>
          </div>
        </div>
      </div>
    </div>
  );
}
