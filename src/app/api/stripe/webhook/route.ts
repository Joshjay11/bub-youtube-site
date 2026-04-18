import { getStripe } from '@/lib/stripe';
import { createAdminSupabase } from '@/lib/supabase';
import type Stripe from 'stripe';

// Map Stripe subscription status to our internal status
function mapSubscriptionStatus(stripeStatus: string): string {
  switch (stripeStatus) {
    case 'active': return 'active';
    case 'past_due': return 'past_due';
    case 'canceled': return 'lapsed';
    case 'unpaid': return 'lapsed';
    case 'incomplete': return 'none';
    case 'incomplete_expired': return 'lapsed';
    case 'trialing': return 'active';
    default: return 'none';
  }
}

async function updateUserByCustomerId(
  customerId: string,
  updates: Record<string, unknown>,
) {
  const supabase = createAdminSupabase();

  // Try users table first
  const { data: userRow } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (userRow) {
    await supabase
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('stripe_customer_id', customerId);
    return true;
  }

  return false;
}

async function updateUserByEmail(
  email: string,
  updates: Record<string, unknown>,
) {
  const supabase = createAdminSupabase();
  await supabase
    .from('users')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('email', email);
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return Response.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;

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

  const supabase = createAdminSupabase();

  switch (event.type) {
    case 'checkout.session.completed': {
      try {
        const session = event.data.object as Stripe.Checkout.Session;
        const email = session.customer_details?.email || session.customer_email;
        const customerId = session.customer as string;
        const tier = session.metadata?.tier;
        const userId = session.metadata?.user_id;

        if (email) {
          await supabase.from('purchases').upsert(
            {
              email,
              stripe_customer_id: customerId || null,
              has_access: true,
            },
            { onConflict: 'email' },
          );

          const userUpdates: Record<string, unknown> = {
            has_access: true,
            stripe_customer_id: customerId || null,
          };

          if (tier) {
            userUpdates.subscription_tier = tier;
            userUpdates.subscription_status = 'active';
            if (tier === 'founding') {
              userUpdates.is_founding_member = true;
            }
          }

          if (userId) {
            await supabase
              .from('users')
              .update({ ...userUpdates, updated_at: new Date().toISOString() })
              .eq('id', userId);
          } else {
            await updateUserByEmail(email, userUpdates);
          }
        }
      } catch (err) {
        console.error('[webhook] checkout.completed handler failed:', err);
      }
      break;
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      try {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const tier = subscription.metadata?.tier;
        const status = mapSubscriptionStatus(subscription.status);

        const periodEnd = subscription.items.data[0]?.current_period_end;

        const updates: Record<string, unknown> = {
          subscription_status: status,
          stripe_subscription_id: subscription.id,
          has_access: status === 'active' || status === 'past_due',
        };

        if (periodEnd) {
          updates.subscription_current_period_end = new Date(periodEnd * 1000).toISOString();
        }

        if (tier) {
          updates.subscription_tier = tier;
          if (tier === 'founding') {
            updates.is_founding_member = true;
          }
        }

        if (subscription.cancel_at_period_end && subscription.status === 'active') {
          updates.subscription_status = 'canceled';
          updates.has_access = true;
        }

        await updateUserByCustomerId(customerId, updates);
      } catch (err) {
        console.error('[webhook] subscription.created/updated handler failed:', err);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      try {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        await updateUserByCustomerId(customerId, {
          subscription_status: 'lapsed',
          has_access: false,
        });
      } catch (err) {
        console.error('[webhook] subscription.deleted handler failed:', err);
      }
      break;
    }

    case 'invoice.payment_succeeded': {
      try {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        if (invoice.billing_reason === 'subscription_cycle' || invoice.billing_reason === 'subscription_create') {
          await updateUserByCustomerId(customerId, {
            subscription_status: 'active',
            has_access: true,
          });
        }
      } catch (err) {
        console.error('[webhook] payment_succeeded handler failed:', err);
      }
      break;
    }

    case 'invoice.payment_failed': {
      try {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        await updateUserByCustomerId(customerId, {
          subscription_status: 'past_due',
          has_access: true,
        });
      } catch (err) {
        console.error('[webhook] payment_failed handler failed:', err);
      }
      break;
    }
  }

  // Always return 200 — even if a handler failed — to prevent Stripe retry floods
  return Response.json({ received: true });
}
