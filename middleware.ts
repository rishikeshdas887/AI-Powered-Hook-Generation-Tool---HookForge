import { createServerClient as createSSRServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createSSRServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const url = request.nextUrl;
  const pathname = url.pathname;

  // Protected routes - redirect to login if not authenticated
  if (pathname.startsWith('/dashboard')) {
    if (!session) {
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Redirect to dashboard if already logged in and trying to access login
  if (pathname === '/login' && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Block access to sensitive file patterns
  const blockedPatterns = [
    '/.env',
    '/.env.local',
    '/.git/',
    '/package.json',
    '/tsconfig.json',
  ];

  for (const pattern of blockedPatterns) {
    if (pathname.startsWith(pattern)) {
      return new NextResponse('Not Found', { status: 404 });
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons/|public/|api/).*)',
  ],
};
