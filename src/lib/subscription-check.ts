import { createServerSupabase } from '@/lib/supabase';

/**
 * Check if a user has an active subscription that allows AI features.
 * Uses email to look up the user since that's what AI routes have available.
 * Falls back to allowing access when Supabase isn't configured (local dev).
 *
 * Only these statuses grant access: 'active', 'past_due', 'canceled'.
 * Everything else is blocked.
 */
export async function checkSubscriptionAccess(email: string | null): Promise<{
  allowed: boolean;
  status: string;
  message?: string;
}> {
  // Skip check when Supabase isn't configured (local dev)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return { allowed: true, status: 'platform' };
  }

  // If we can't identify the user, block access
  if (!email) {
    return { allowed: false, status: 'none', message: 'Authentication required.' };
  }

  const supabase = createServerSupabase();
  const { data: user } = await supabase
    .from('users')
    .select('subscription_status')
    .eq('email', email)
    .single();

  // If no user record exists, block access
  if (!user) {
    return { allowed: false, status: 'none', message: 'No account found. Please subscribe.' };
  }

  const status = user.subscription_status || 'none';

  // Only these statuses grant access
  if (['active', 'past_due', 'canceled'].includes(status)) {
    return { allowed: true, status };
  }

  // Everything else is blocked (none, lapsed, undefined, null)
  return {
    allowed: false,
    status,
    message: status === 'lapsed'
      ? 'Your subscription has ended. Resubscribe to continue using AI features.'
      : 'An active subscription is required.',
  };
}
