import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Skip auth check if Supabase isn't configured (local dev)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    return NextResponse.next();
  }

  // Look for any Supabase auth cookie
  const cookies = request.cookies.getAll();
  const hasAuthCookie = cookies.some(
    (c) => c.name.startsWith('sb-') && c.name.endsWith('-auth-token')
  );

  if (!hasAuthCookie) {
    const redirectUrl = new URL('/template', request.url);
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

// ONLY run on /app routes — marketing pages, API routes, and static
// assets never hit this function
export const config = {
  matcher: ['/app/:path*'],
};
