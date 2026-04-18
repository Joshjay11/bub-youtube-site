import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

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

function getBaseUrl(): string {
  // Never trust request headers for the magic link redirect — an attacker
  // can set Origin to point the email link anywhere.
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'https://youtube.bubwriter.com';
}

export async function POST(request: NextRequest) {
  const cookiesToSet: CookieToSet[] = [];
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return withSupabaseCookies(
        NextResponse.json({ error: 'Email is required' }, { status: 400 }),
        cookiesToSet,
      );
    }

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
    const baseUrl = getBaseUrl();

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${baseUrl}/api/auth/callback`,
      },
    });

    if (error) {
      return withSupabaseCookies(
        NextResponse.json({ error: error.message }, { status: 400 }),
        cookiesToSet,
      );
    }

    return withSupabaseCookies(
      NextResponse.json({ success: true }),
      cookiesToSet,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to send magic link';
    return withSupabaseCookies(
      NextResponse.json({ error: message }, { status: 500 }),
      cookiesToSet,
    );
  }
}
