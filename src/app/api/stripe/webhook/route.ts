import { getStripe } from '@/lib/stripe';
import { createServerSupabase } from '@/lib/supabase';
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
  const supabase = createServerSupabase();

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
  const supabase = createServerSupabase();
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

  const supabase = createServerSupabase();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const email = session.customer_details?.email || session.customer_email;
      const customerId = session.customer as string;
      const tier = session.metadata?.tier;
      const userId = session.metadata?.user_id;

      if (email) {
        // Upsert into purchases table (backwards compat)
        await supabase.from('purchases').upsert(
          {
            email,
            stripe_customer_id: customerId || null,
            has_access: true,
          },
          { onConflict: 'email' },
        );

        // Update users table — link Stripe customer and grant access
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
      break;
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      const tier = subscription.metadata?.tier;
      const status = mapSubscriptionStatus(subscription.status);

      // current_period_end lives on subscription items in this Stripe API version
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

      // If user canceled, mark as canceled (still has access until period end)
      if (subscription.cancel_at_period_end && subscription.status === 'active') {
        updates.subscription_status = 'canceled';
        updates.has_access = true;
      }

      await updateUserByCustomerId(customerId, updates);
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      await updateUserByCustomerId(customerId, {
        subscription_status: 'lapsed',
        has_access: false,
      });
      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;

      if (invoice.billing_reason === 'subscription_cycle' || invoice.billing_reason === 'subscription_create') {
        await updateUserByCustomerId(customerId, {
          subscription_status: 'active',
          has_access: true,
        });
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;

      await updateUserByCustomerId(customerId, {
        subscription_status: 'past_due',
        has_access: true,  // Keep access during retry period
      });
      break;
    }
  }

  return Response.json({ received: true });
}
