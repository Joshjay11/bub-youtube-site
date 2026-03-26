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
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as 'magiclink' | 'email',
    });

    if (!error && data.user) {
      const email = data.user.email;

      if (email) {
        // Check if this email has a purchase record
        const { data: purchase } = await supabase
          .from('purchases')
          .select('has_access, stripe_customer_id')
          .eq('email', email)
          .single();

        if (purchase?.has_access) {
          // Merge purchase into users table
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

      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  // If verification fails, redirect to template page with error
  return NextResponse.redirect(new URL('/template?error=auth', request.url));
}
