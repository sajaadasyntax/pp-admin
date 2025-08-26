import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the token from localStorage
  const token = request.cookies.get('token')?.value;
  const isAuthPage = request.nextUrl.pathname === '/login';

  // For API routes, let them handle their own authentication
  if (request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  if (!token && !isAuthPage) {
    // Redirect to login if trying to access protected route without token
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (token && isAuthPage) {
    // Redirect to dashboard if trying to access login page with valid token
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 