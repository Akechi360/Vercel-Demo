import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Skip for static files and API routes
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.includes('.') ||
    request.nextUrl.pathname.startsWith('/api')
  ) {
    return NextResponse.next();
  }

  const start = Date.now();
  const response = NextResponse.next();
  
  // Add Server-Timing header
  const serverTiming = [
    `handle;dur=${Date.now() - start}`,
  ].join(',');

  response.headers.set('Server-Timing', serverTiming);
  
  // Log performance for slow requests
  const duration = Date.now() - start;
  if (duration > 1000) { // Log if request takes more than 1s
    console.log(`[Performance] ${request.method} ${request.nextUrl.pathname} took ${duration}ms`);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/health).*)',
  ],
};
