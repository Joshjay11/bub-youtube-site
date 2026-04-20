import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';

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
    const { email: rawEmail } = await request.json();

    if (!rawEmail || typeof rawEmail !== 'string') {
      return withSupabaseCookies(
        NextResponse.json({ error: 'Email is required' }, { status: 400 }),
        cookiesToSet,
      );
    }

    const email = rawEmail.trim().toLowerCase();
    const ip = request.headers.get('x-real-ip') || 'unknown';

    // Per-email: one link every 30 seconds (prevents email bombing).
    const emailLimit = await rateLimit(`rl:magic-link:email:${email}`, 1, 30);
    if (!emailLimit.allowed) {
      return withSupabaseCookies(
        NextResponse.json(
          { error: `Please wait ${emailLimit.retryAfterSeconds}s before requesting another link.` },
          { status: 429, headers: { 'Retry-After': String(emailLimit.retryAfterSeconds) } },
        ),
        cookiesToSet,
      );
    }

    // Per-IP: 10 requests per hour (prevents enumeration / scraping).
    const ipLimit = await rateLimit(`rl:magic-link:ip:${ip}`, 10, 3600);
    if (!ipLimit.allowed) {
      return withSupabaseCookies(
        NextResponse.json(
          { error: 'Too many requests from this network. Try again later.' },
          { status: 429, headers: { 'Retry-After': String(ipLimit.retryAfterSeconds) } },
        ),
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
