import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createAdminSupabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/app?onboarding=true';

  if (!code) {
    return NextResponse.redirect(new URL('/template?error=missing_code', request.url));
  }

  // 1. Exchange the code for a session using a cookie-aware client
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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

  if (error || !session || !user) {
    return NextResponse.redirect(new URL('/template?error=auth', request.url));
  }

  // 2. Use admin client (service role) for DB operations — bypasses RLS
  const admin = createAdminSupabase();
  const email = user.email;

  if (email) {
    // 3. Check purchases table
    const { data: purchase } = await admin
      .from('purchases')
      .select('has_access, stripe_customer_id')
      .eq('email', email)
      .single();

    if (purchase?.has_access) {
      // 4. Upsert into users table with auth user's UUID
      await admin.from('users').upsert(
        {
          id: user.id,
          email,
          has_access: true,
          stripe_customer_id: purchase.stripe_customer_id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'email' },
      );
    } else {
      // No purchase found — redirect to template
      return NextResponse.redirect(new URL('/template?error=no_purchase', request.url));
    }
  }

  // 5. Redirect to /app — session cookies were already set by exchangeCodeForSession
  return NextResponse.redirect(new URL(next, request.url));
}
