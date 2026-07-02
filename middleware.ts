import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  const url = request.nextUrl;

  // Block access to sensitive file patterns (not paths)
  const blockedPatterns = [
    '/.env',
    '/.env.local',
    '/.env.development',
    '/.env.production',
    '/.git/',
    '/.gitignore',
    '/package.json',
    '/tsconfig.json',
    '/next.config.js',
  ];

  const pathname = url.pathname.toLowerCase();

  for (const pattern of blockedPatterns) {
    if (pathname === pattern.toLowerCase() || pathname.startsWith(pattern.toLowerCase())) {
      return new NextResponse('Not Found', { status: 404 });
    }
  }

  // Validate request method for API routes
  if (url.pathname.startsWith('/api/')) {
    const method = request.method;
    const allowedMethods = ['GET', 'POST', 'DELETE', 'PUT', 'OPTIONS', 'HEAD'];

    if (!allowedMethods.includes(method)) {
      return new NextResponse(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Handle CORS preflight requests
    if (method === 'OPTIONS') {
      const headers = new Headers();
      headers.set('Access-Control-Allow-Origin', url.origin);
      headers.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, PUT, OPTIONS');
      headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      headers.set('Access-Control-Max-Age', '86400');
      return new NextResponse(null, { status: 204, headers });
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Apply to all routes except static files and Next.js internals
    '/((?!_next/static|_next/image|favicon.ico|icons/|public/).*)',
  ],
};
