import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Block sensitive file paths
  const blocked = ['/.env', '/.git/', '/package.json', '/tsconfig.json'];
  for (const pattern of blocked) {
    if (pathname.startsWith(pattern)) {
      return new NextResponse('Not Found', { status: 404 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons/).*)'],
};
