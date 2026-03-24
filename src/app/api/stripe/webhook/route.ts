import { getStripe } from '@/lib/stripe';
import { createServerSupabase } from '@/lib/supabase';

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return Response.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  const stripe = getStripe();
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Webhook signature verification failed';
    return Response.json({ error: message }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const email = session.customer_email || session.customer_details?.email;

    if (email) {
      const supabase = createServerSupabase();

      // Upsert user with access granted
      await supabase.from('users').upsert(
        {
          email,
          stripe_customer_id: session.customer as string || null,
          has_access: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'email' },
      );
    }
  }

  return Response.json({ received: true });
}
