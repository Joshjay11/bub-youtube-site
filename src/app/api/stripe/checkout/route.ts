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
    const { tier } = await request.json();

    const priceMap: Record<string, string | undefined> = {
      founding: process.env.STRIPE_FOUNDING_PRICE_ID,
      pro: process.env.STRIPE_PRO_PRICE_ID,
      annual: process.env.STRIPE_ANNUAL_PRICE_ID,
    };

    const priceId = priceMap[tier];
    if (!priceId) {
      return Response.json({ error: 'Invalid tier' }, { status: 400 });
    }

    // Check founding member availability
    if (tier === 'founding') {
      const admin = createAdminSupabase();
      const { count } = await admin
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('is_founding_member', true);

      if (count !== null && count >= 50) {
        return Response.json({ error: 'Founding member spots are full. Please choose Pro or Annual.' }, { status: 400 });
      }

      // Block lapsed founding members from re-subscribing at founding rate
      const user = await getAuthUser();
      if (user) {
        const { data: userRow } = await admin
          .from('users')
          .select('is_founding_member, subscription_status')
          .eq('id', user.id)
          .single();

        if (userRow?.is_founding_member && userRow?.subscription_status === 'lapsed') {
          return Response.json({ error: 'Founding member pricing is only available for continuous subscriptions. Please choose Pro or Annual.' }, { status: 400 });
        }
      }
    }

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
      success_url: `${baseUrl}/app?subscription=success`,
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
