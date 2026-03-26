import { getStripe } from '@/lib/stripe';

function getBaseUrl(request: Request): string {
  // Try origin header first, then construct from host
  const origin = request.headers.get('origin');
  if (origin) return origin;

  const host = request.headers.get('host') || request.headers.get('x-forwarded-host');
  const proto = request.headers.get('x-forwarded-proto') || 'https';
  if (host) return `${proto}://${host}`;

  // Fallback to env var for Vercel deployments
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;

  return 'https://youtube.bubwriter.com';
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    const baseUrl = getBaseUrl(request);
    const stripe = getStripe();

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: email || undefined,
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID!,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/welcome?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/template`,
      metadata: {
        product: 'bub_script_system',
      },
    });

    return Response.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create checkout session';
    return Response.json({ error: message }, { status: 500 });
  }
}
