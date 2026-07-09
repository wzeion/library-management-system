'use client';

import React, { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const role = (session.user as any).role;
      if (role === 'admin') router.push('/admin/dashboard');
      else if (role === 'librarian') router.push('/librarian/dashboard');
      else router.push('/member/dashboard');
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-text">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm font-medium">Checking authorizations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-text flex flex-col justify-between">
      {/* Content wrapper */}
      <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-16 space-y-8">
        {/* Civic Heading */}
        <div className="border-b-4 border-primary pb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-secondary">Official Project Portal</span>
          <h1 className="text-4xl font-extrabold text-primary tracking-tight mt-1">
            Digital Library Management System
          </h1>
        </div>

        <div className="bg-surface border border-border p-6 rounded-[2px] space-y-4">
          <h2 className="text-lg font-bold text-primary">System Information</h2>
          <p className="text-sm leading-relaxed">
            This platform provides centralized access to the university catalog, active member loans, book reservations, and overdue fee collections. 
            Authorized university members, librarians, and administrative staff can sign in to access their respective system dashboards.
          </p>
        </div>

        {/* Buttons / Actions */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Link
            href="/login"
            className="px-6 py-3 bg-primary hover:bg-primary/95 text-white font-bold text-center rounded-[2px] shadow-sm transition-colors focus-visible:outline-none"
          >
            Sign In to Account
          </Link>
          <Link
            href="/register"
            className="px-6 py-3 bg-secondary hover:bg-secondary/95 text-white font-bold text-center rounded-[2px] shadow-sm transition-colors focus-visible:outline-none"
          >
            Register Member Account
          </Link>
          <Link
            href="/catalog"
            className="px-6 py-3 bg-surface hover:bg-surface/90 border border-border text-primary font-bold text-center rounded-[2px] shadow-sm transition-colors focus-visible:outline-none"
          >
            Browse Public Catalog
          </Link>
        </div>

        {/* Informational alert box */}
        <div className="bg-surface border-l-4 border-accent p-4 text-sm text-text">
          <p className="font-bold mb-1">Accessibility notice:</p>
          <p>
            This portal is styled to meet federal and state accessibility standards. If you experience issues navigating with keyboard layout controls, please contact the site administrator.
          </p>
        </div>
      </div>

      {/* Plain Civic Footer */}
      <footer className="bg-surface border-t border-border py-6 text-center text-xs text-text/80">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2 font-mono">
          <p>© 2026 University Digital Library System.</p>
          <p>Next.js Core · Mongoose Data Stack · NextAuth RBAC</p>
        </div>
      </footer>
    </div>
  );
}
