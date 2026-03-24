import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token_hash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type');
  const next = url.searchParams.get('next') ?? '/app';

  if (token_hash && type) {
    const supabase = createServerSupabase();

    // Verify the OTP token from the magic link
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as 'magiclink' | 'email',
    });

    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  // If verification fails, redirect to template page with error
  return NextResponse.redirect(new URL('/template?error=auth', request.url));
}
