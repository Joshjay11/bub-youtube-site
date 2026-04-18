import { getStripe } from '@/lib/stripe';
import { createAdminSupabase } from '@/lib/supabase';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

function getBaseUrl(request: Request): string {
  const origin = request.headers.get('origin');
  if (origin) return origin;
  const host = request.headers.get('host') || request.headers.get('x-forwarded-host');
  const proto = request.headers.get('x-forwarded-proto') || 'https';
  if (host) return `${proto}://${host}`;
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'https://youtube.bubwriter.com';
}

async function getAuthUser() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {},
      },
    },
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function POST(request: Request) {
  try {
    let { tier } = await request.json();

    const priceMap: Record<string, string | undefined> = {
      founding: process.env.STRIPE_FOUNDING_PRICE_ID,
      pro: process.env.STRIPE_PRO_PRICE_ID,
      annual: process.env.STRIPE_ANNUAL_PRICE_ID,
    };

    // Validate tier before any checks
    if (!priceMap[tier]) {
      return Response.json({ error: 'Invalid tier' }, { status: 400 });
    }

    // Check founding member availability — may override tier to 'pro'
    if (tier === 'founding') {
      const admin = createAdminSupabase();
      const { count } = await admin
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('is_founding_member', true);

      if (count !== null && count >= 50) {
        tier = 'pro';  // Founding spots full — fall back to pro
      } else {
        // Check if former founding member trying to re-subscribe
        const user = await getAuthUser();
        if (user) {
          const { data: userRow } = await admin
            .from('users')
            .select('is_founding_member, subscription_status')
            .eq('id', user.id)
            .single();

          if (userRow?.is_founding_member && ['canceled', 'lapsed'].includes(userRow?.subscription_status)) {
            tier = 'pro';  // Former founding member resubscribes at standard rate
          }
        }
      }
    }

    // Resolve price ID after any tier overrides
    const priceId = priceMap[tier]!;

    const baseUrl = getBaseUrl(request);
    const stripe = getStripe();

    // Get authenticated user info if available
    const user = await getAuthUser();
    const userId = user?.id || '';
    const userEmail = user?.email || undefined;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/welcome?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing`,
      customer_email: userEmail,
      metadata: {
        tier,
        user_id: userId,
      },
      subscription_data: {
        metadata: {
          tier,
          user_id: userId,
        },
      },
    });

    return Response.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create checkout session';
    return Response.json({ error: message }, { status: 500 });
  }
}
