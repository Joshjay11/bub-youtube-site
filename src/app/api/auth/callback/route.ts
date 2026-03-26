import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token_hash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type');
  const next = url.searchParams.get('next') ?? '/app?onboarding=true';

  if (!token_hash || !type) {
    return NextResponse.redirect(new URL('/template?error=missing_token', request.url));
  }

  const supabase = createServerSupabase();

  // 1. Verify the OTP token
  const { data, error } = await supabase.auth.verifyOtp({
    token_hash,
    type: type as 'magiclink' | 'email',
  });

  if (error || !data.session || !data.user) {
    return NextResponse.redirect(new URL('/template?error=auth', request.url));
  }

  const email = data.user.email;

  // 2. Check purchases table and merge into users
  if (email) {
    const { data: purchase } = await supabase
      .from('purchases')
      .select('has_access, stripe_customer_id')
      .eq('email', email)
      .single();

    if (purchase?.has_access) {
      await supabase.from('users').upsert(
        {
          id: data.user.id,
          email,
          has_access: true,
          stripe_customer_id: purchase.stripe_customer_id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'email' },
      );
    }
  }

  // 3. Set auth session cookies on the redirect response
  const response = NextResponse.redirect(new URL(next, request.url));

  // Derive the cookie name from the Supabase URL (sb-<project-ref>-auth-token)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
  const cookieName = `sb-${projectRef}-auth-token`;

  // Store the full session as a JSON cookie (Supabase SSR convention)
  const sessionPayload = JSON.stringify({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_at: data.session.expires_at,
    expires_in: data.session.expires_in,
    token_type: data.session.token_type,
  });

  response.cookies.set(cookieName, sessionPayload, {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });

  return response;
}
