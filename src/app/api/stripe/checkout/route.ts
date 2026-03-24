import { getStripe } from '@/lib/stripe';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

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
      success_url: `${request.headers.get('origin')}/app?session_id={CHECKOUT_SESSION_ID}&onboarding=true`,
      cancel_url: `${request.headers.get('origin')}/template`,
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
