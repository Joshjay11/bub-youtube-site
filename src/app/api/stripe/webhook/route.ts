import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getStripe } from '@/lib/stripe';
import { createAdminSupabase } from '@/lib/supabase';
import type Stripe from 'stripe';

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
  admin: SupabaseClient,
  customerId: string,
  updates: Record<string, unknown>,
) {
  const userRow = await admin
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (userRow.data) {
    const update = await admin
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('stripe_customer_id', customerId);
    if (update.error) {
      throw new Error(`users update by customer_id failed: ${update.error.message}`);
    }
    return true;
  }

  return false;
}

async function updateUserByEmail(
  admin: SupabaseClient,
  email: string,
  updates: Record<string, unknown>,
) {
  const update = await admin
    .from('users')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('email', email);
  if (update.error) {
    throw new Error(`users update by email failed: ${update.error.message}`);
  }
}

async function handleCheckoutCompleted(
  admin: SupabaseClient,
  session: Stripe.Checkout.Session,
) {
  const email = session.customer_details?.email || session.customer_email;
  const customerId = session.customer as string | null;
  const tier = session.metadata?.tier;
  const userId = session.metadata?.user_id;

  if (!email) {
    throw new Error(`checkout.session.completed missing email: ${session.id}`);
  }

  const purchaseUpsert = await admin.from('purchases').upsert(
    {
      email,
      stripe_customer_id: customerId || null,
      has_access: true,
    },
    { onConflict: 'email' },
  );

  if (purchaseUpsert.error) {
    throw new Error(`purchases upsert failed: ${purchaseUpsert.error.message}`);
  }

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
    const update = await admin
      .from('users')
      .update({ ...userUpdates, updated_at: new Date().toISOString() })
      .eq('id', userId);
    if (update.error) {
      throw new Error(`users update by id failed: ${update.error.message}`);
    }
  } else {
    await updateUserByEmail(admin, email, userUpdates);
  }
}

async function handleSubscriptionUpsert(
  admin: SupabaseClient,
  subscription: Stripe.Subscription,
) {
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

  await updateUserByCustomerId(admin, customerId, updates);
}

async function handleSubscriptionDeleted(
  admin: SupabaseClient,
  subscription: Stripe.Subscription,
) {
  const customerId = subscription.customer as string;
  await updateUserByCustomerId(admin, customerId, {
    subscription_status: 'lapsed',
    has_access: false,
  });
}

async function handleInvoicePaymentSucceeded(
  admin: SupabaseClient,
  invoice: Stripe.Invoice,
) {
  const customerId = invoice.customer as string;
  if (invoice.billing_reason === 'subscription_cycle' || invoice.billing_reason === 'subscription_create') {
    await updateUserByCustomerId(admin, customerId, {
      subscription_status: 'active',
      has_access: true,
    });
  }
}

async function handleInvoicePaymentFailed(
  admin: SupabaseClient,
  invoice: Stripe.Invoice,
) {
  const customerId = invoice.customer as string;
  await updateUserByCustomerId(admin, customerId, {
    subscription_status: 'past_due',
    has_access: true,
  });
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
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
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const admin = createAdminSupabase();

  // 1. Check if this event was already processed.
  const existing = await admin
    .from('stripe_events')
    .select('id, status')
    .eq('id', event.id)
    .maybeSingle();

  if (existing.error) {
    console.error('[stripe-webhook] lookup failed', { eventId: event.id, error: existing.error.message });
    return new NextResponse('lookup failed', { status: 500 });
  }

  if (existing.data?.status === 'processed') {
    return new NextResponse('already processed', { status: 200 });
  }

  // 2. Claim the event with status='processing'. Upsert overwrites prior
  //    'failed' or 'processing' rows so retries get a clean slate.
  const claim = await admin
    .from('stripe_events')
    .upsert(
      {
        id: event.id,
        type: event.type,
        payload: event as unknown as Record<string, unknown>,
        status: 'processing',
        processed_at: null,
        last_error: null,
      },
      { onConflict: 'id' },
    );

  if (claim.error) {
    console.error('[stripe-webhook] failed to claim event', { eventId: event.id, error: claim.error.message });
    return new NextResponse('claim failed', { status: 500 });
  }

  // 3. Run handler. Errors bubble out of the switch.
  let handlerError: unknown = null;
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(admin, event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpsert(admin, event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(admin, event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(admin, event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(admin, event.data.object as Stripe.Invoice);
        break;
      default:
        // Unhandled event type. Mark processed so we don't retry forever.
        break;
    }
  } catch (err) {
    handlerError = err;
  }

  // 4. Finalize event status. Never swallow errors.
  if (handlerError) {
    await admin
      .from('stripe_events')
      .update({
        status: 'failed',
        last_error: String(handlerError instanceof Error ? handlerError.message : handlerError).slice(0, 1000),
      })
      .eq('id', event.id);

    console.error('[stripe-webhook] handler failed', {
      eventId: event.id,
      type: event.type,
      error: handlerError,
    });
    return new NextResponse('handler failed', { status: 500 });
  }

  await admin
    .from('stripe_events')
    .update({
      status: 'processed',
      processed_at: new Date().toISOString(),
      last_error: null,
    })
    .eq('id', event.id);

  return new NextResponse('ok', { status: 200 });
}
