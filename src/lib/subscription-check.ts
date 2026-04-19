import { createAdminSupabase } from '@/lib/supabase';

/**
 * Check if a user has an active subscription that allows AI features.
 *
 * Allowed statuses:
 *   - 'active'    → always allowed
 *   - 'past_due'  → allowed (grace)
 *   - 'canceled'  → allowed ONLY while subscription_current_period_end is in the future.
 *                   Once the period ends, treated as lapsed.
 *   - anything else → denied
 */
export async function checkSubscriptionAccess(email: string | null): Promise<{
  allowed: boolean;
  status: string;
  message?: string;
}> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return { allowed: false, status: 'none', message: 'Authentication required.' };
  }

  if (!email) {
    return { allowed: false, status: 'none', message: 'Authentication required.' };
  }

  const supabase = createAdminSupabase();
  const { data: user } = await supabase
    .from('users')
    .select('subscription_status, subscription_current_period_end')
    .eq('email', email)
    .single();

  if (!user) {
    return { allowed: false, status: 'none', message: 'No account found. Please subscribe.' };
  }

  const status = user.subscription_status || 'none';
  const currentPeriodEnd = user.subscription_current_period_end
    ? new Date(user.subscription_current_period_end)
    : null;

  if (status === 'active' || status === 'past_due') {
    return { allowed: true, status };
  }

  if (status === 'canceled') {
    if (currentPeriodEnd && currentPeriodEnd.getTime() > Date.now()) {
      return { allowed: true, status };
    }
    return {
      allowed: false,
      status: 'lapsed',
      message: 'Your subscription has ended. Resubscribe to continue using AI features.',
    };
  }

  return {
    allowed: false,
    status,
    message: status === 'lapsed'
      ? 'Your subscription has ended. Resubscribe to continue using AI features.'
      : 'An active subscription is required.',
  };
}
