'use client';

import React from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/');
    router.refresh();
  };

  const role = session?.user ? (session.user as any).role : null;

  return (
    <nav className="bg-primary text-white border-b-2 border-secondary sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14 items-center">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-lg font-bold tracking-tight text-white hover:underline focus-visible:outline-none">
                Digital Library Portal
              </span>
            </Link>

            {status === 'authenticated' && (
              <div className="hidden md:flex space-x-6">
                <Link href="/catalog" className="text-sm font-semibold text-gray-200 hover:text-white hover:underline transition-colors focus-visible:outline-none">
                  Book Catalog
                </Link>
                {role === 'member' && (
                  <Link href="/member/dashboard" className="text-sm font-semibold text-gray-200 hover:text-white hover:underline transition-colors focus-visible:outline-none">
                    My Account
                  </Link>
                )}
                {['librarian', 'admin'].includes(role || '') && (
                  <Link href="/librarian/dashboard" className="text-sm font-semibold text-gray-200 hover:text-white hover:underline transition-colors focus-visible:outline-none">
                    Librarian Desk
                  </Link>
                )}
                {role === 'admin' && (
                  <Link href="/admin/dashboard" className="text-sm font-semibold text-gray-200 hover:text-white hover:underline transition-colors focus-visible:outline-none">
                    System Administration
                  </Link>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {status === 'loading' ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : status === 'authenticated' && session?.user ? (
              <div className="flex items-center gap-4">
                <div className="hidden sm:block text-right">
                  <span className="block text-xs font-bold text-white">{session.user.name}</span>
                  <span className="block text-[10px] text-gray-300 capitalize">Role: {role}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="px-3 py-1 bg-secondary hover:bg-secondary/90 border border-secondary text-white text-xs font-semibold rounded-[2px] transition-colors focus-visible:outline-none"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link
                  href="/login"
                  className="px-3 py-1.5 bg-secondary hover:bg-secondary/90 text-xs font-semibold text-white rounded-[2px] transition-colors focus-visible:outline-none"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
