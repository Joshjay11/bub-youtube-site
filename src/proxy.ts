import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /app routes — let everything else through immediately
  if (!pathname.startsWith('/app')) {
    return NextResponse.next();
  }

  // Skip auth check if Supabase isn't configured (local dev)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next();
  }

  // Look for Supabase auth cookie (format: sb-<project-ref>-auth-token)
  let hasAuthCookie = false;
  for (const [name] of request.cookies) {
    if (name.startsWith('sb-') && name.endsWith('-auth-token')) {
      hasAuthCookie = true;
      break;
    }
  }

  if (!hasAuthCookie) {
    const redirectUrl = new URL('/template', request.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Cookie exists — allow through. Full user verification happens in the
  // app layout / API routes where we have access to the Supabase client.
  return NextResponse.next();
}

export const config = {
  matcher: ['/app/:path*'],
};
