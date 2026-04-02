import { createServerSupabase } from '@/lib/supabase';

/**
 * Check if a user has an active subscription that allows AI features.
 * Uses email to look up the user since that's what AI routes have available.
 * Falls back to allowing access when Supabase isn't configured (local dev)
 * or when no email is available (BYOK users may not be authenticated).
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

  // If no email, allow (backwards compat for unauthenticated BYOK)
  if (!email) {
    return { allowed: true, status: 'unknown' };
  }

  const supabase = createServerSupabase();
  const { data: user } = await supabase
    .from('users')
    .select('subscription_status, has_access')
    .eq('email', email)
    .single();

  if (!user) {
    // No user record — allow if they somehow got past layout auth
    return { allowed: true, status: 'none' };
  }

  const status = user.subscription_status || 'none';

  // Active subscription states
  if (['active', 'past_due', 'canceled'].includes(status)) {
    return { allowed: true, status };
  }

  // Legacy access (pre-subscription one-time purchase users)
  if (user.has_access && status === 'none') {
    return { allowed: true, status: 'legacy' };
  }

  // Lapsed or no subscription
  return {
    allowed: false,
    status,
    message: status === 'lapsed'
      ? 'Your subscription has ended. Resubscribe to continue using AI features.'
      : 'An active subscription is required.',
  };
}
