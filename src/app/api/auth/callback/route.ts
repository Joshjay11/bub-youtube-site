import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createAdminSupabase } from '@/lib/supabase';

type CookieToSet = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

function withSupabaseCookies(response: NextResponse, cookiesToSet: CookieToSet[]) {
  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options as never);
  });
  return response;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/app?onboarding=true';
  const cookiesToSet: CookieToSet[] = [];
  console.log('[auth/callback] hit', {
    path: url.pathname,
    hasCode: Boolean(code),
    next,
    searchKeys: Array.from(url.searchParams.keys()),
  });

  if (!code) {
    console.log('[auth/callback] missing code, redirecting to template');
    return withSupabaseCookies(
      NextResponse.redirect(new URL('/template?error=missing_code', request.url)),
      cookiesToSet,
    );
  }

  // 1. Exchange the code for a session using a cookie-aware client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: 'pkce',
      },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(nextCookiesToSet) {
          nextCookiesToSet.forEach((cookie) => {
            cookiesToSet.push(cookie);
          });
        },
      },
    },
  );

  let session: Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session'] | null = null;
  let user: Awaited<ReturnType<typeof supabase.auth.getUser>>['data']['user'] | null = null;
  let error: { message?: string } | null = null;
  try {
    const result = await supabase.auth.exchangeCodeForSession(code);
    session = result.data.session;
    user = result.data.user;
    error = result.error;
    console.log('[auth/callback] exchangeCodeForSession', {
      hasSession: Boolean(session),
      userId: user?.id ?? null,
      email: user?.email ?? null,
      error: error?.message ?? null,
    });
  } catch (exchangeError) {
    console.error('[auth/callback] exchangeCodeForSession threw', {
      error: exchangeError,
      message: exchangeError instanceof Error ? exchangeError.message : null,
      stack: exchangeError instanceof Error ? exchangeError.stack : null,
    });
    return withSupabaseCookies(
      NextResponse.redirect(new URL('/template?error=auth', request.url)),
      cookiesToSet,
    );
  }

  if (error || !session || !user) {
    console.error('[auth/callback] auth exchange failed, redirecting to template', {
      error,
      hasSession: Boolean(session),
      hasUser: Boolean(user),
    });
    return withSupabaseCookies(
      NextResponse.redirect(new URL('/template?error=auth', request.url)),
      cookiesToSet,
    );
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
      return withSupabaseCookies(
        NextResponse.redirect(new URL('/template?error=no_purchase', request.url)),
        cookiesToSet,
      );
    }
  }

  // 5. Redirect to /app — session cookies were already set by exchangeCodeForSession
  console.log('[auth/callback] success, redirecting', { next });
  return withSupabaseCookies(
    NextResponse.redirect(new URL(next, request.url)),
    cookiesToSet,
  );
}
