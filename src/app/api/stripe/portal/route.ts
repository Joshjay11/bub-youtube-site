import { getStripe } from '@/lib/stripe';
import { createAdminSupabase } from '@/lib/supabase';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

function getBaseUrl(): string {
  // Never trust request headers for the billing portal return URL.
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
    const user = await getAuthUser();
    if (!user) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const admin = createAdminSupabase();
    const { data: userRow } = await admin
      .from('users')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (!userRow?.stripe_customer_id) {
      return Response.json({ error: 'No subscription found' }, { status: 400 });
    }

    const stripe = getStripe();
    const baseUrl = getBaseUrl();

    const session = await stripe.billingPortal.sessions.create({
      customer: userRow.stripe_customer_id,
      return_url: `${baseUrl}/app/settings`,
    });

    return Response.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create portal session';
    return Response.json({ error: message }, { status: 500 });
  }
}
