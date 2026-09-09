import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Inspect Vercel Edge geographic IP country header
  const country = request.headers.get('x-vercel-ip-country') || 
                  request.headers.get('cf-ipcountry') || 
                  '';

  const pathname = request.nextUrl.pathname;

  // Allow static files, api routes, and compliance page itself
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/tokens') ||
    pathname.startsWith('/favicon.ico') ||
    pathname === '/compliance'
  ) {
    return NextResponse.next();
  }

  // Attach geo header for UI compliance indicator without blocking verification crawlers
  const response = NextResponse.next();
  if (country) {
    response.headers.set('x-user-country', country);
  }
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
