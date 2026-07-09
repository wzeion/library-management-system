import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    const role = token.role as string;

    // Admin pages: only admin can access
    if (path.startsWith('/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url));
    }

    // Librarian pages: librarian or admin can access
    if (path.startsWith('/librarian') && role !== 'librarian' && role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url));
    }

    // Member pages: member, librarian, or admin can access
    if (path.startsWith('/member') && !['member', 'librarian', 'admin'].includes(role)) {
      return NextResponse.redirect(new URL('/', req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ['/admin/:path*', '/librarian/:path*', '/member/:path*'],
};
