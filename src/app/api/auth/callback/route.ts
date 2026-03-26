import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createAdminSupabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/app?onboarding=true';
  console.log('[auth/callback] hit', {
    path: url.pathname,
    hasCode: Boolean(code),
    next,
    searchKeys: Array.from(url.searchParams.keys()),
  });

  if (!code) {
    console.log('[auth/callback] missing code, redirecting to template');
    return NextResponse.redirect(new URL('/template?error=missing_code', request.url));
  }

  // 1. Exchange the code for a session using a cookie-aware client
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: 'pkce',
      },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    },
  );

  const { data: { session, user }, error } = await supabase.auth.exchangeCodeForSession(code);
  console.log('[auth/callback] exchangeCodeForSession', {
    hasSession: Boolean(session),
    userId: user?.id ?? null,
    email: user?.email ?? null,
    error: error?.message ?? null,
  });

  if (error || !session || !user) {
    console.log('[auth/callback] auth exchange failed, redirecting to template');
    return NextResponse.redirect(new URL('/template?error=auth', request.url));
  }

  // 2. Use admin client (service role) for DB operations — bypasses RLS
  const admin = createAdminSupabase();
  const email = user.email;

  if (email) {
    // 3. Check purchases table
    const { data: purchase, error: purchaseError } = await admin
      .from('purchases')
      .select('has_access, stripe_customer_id')
      .eq('email', email)
      .single();
    console.log('[auth/callback] purchase lookup', {
      email,
      hasAccess: purchase?.has_access ?? null,
      stripeCustomerId: purchase?.stripe_customer_id ?? null,
      error: purchaseError?.message ?? null,
    });

    if (purchase?.has_access) {
      // 4. Upsert into users table with auth user's UUID
      const { error: upsertError } = await admin.from('users').upsert(
        {
          id: user.id,
          email,
          has_access: true,
          stripe_customer_id: purchase.stripe_customer_id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'email' },
      );
      console.log('[auth/callback] users upsert', {
        userId: user.id,
        email,
        error: upsertError?.message ?? null,
      });
    } else {
      // No purchase found — redirect to template
      console.log('[auth/callback] no purchase access, redirecting to template');
      return NextResponse.redirect(new URL('/template?error=no_purchase', request.url));
    }
  }

  // 5. Redirect to /app — session cookies were already set by exchangeCodeForSession
  console.log('[auth/callback] success, redirecting', { next });
  return NextResponse.redirect(new URL(next, request.url));
}
