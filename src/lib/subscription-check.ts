import { createAdminSupabase } from '@/lib/supabase';

/**
 * Check if a user has access to AI features.
 *
 * Source of truth: users.has_access (boolean).
 * Set to true by the Stripe webhook on checkout.session.completed.
 * Set to false by the Stripe webhook on customer.subscription.deleted.
 *
 * Returns { allowed, status, message }.
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
  const { data: user, error } = await supabase
    .from('users')
    .select('has_access')
    .eq('email', email)
    .maybeSingle();

  if (error) {
    console.error('[subscription-check] query failed', { email, error });
    return { allowed: false, status: 'error', message: 'Subscription check failed.' };
  }

  if (!user) {
    return { allowed: false, status: 'none', message: 'No account found. Please subscribe.' };
  }

  if (!user.has_access) {
    return {
      allowed: false,
      status: 'lapsed',
      message: 'Your subscription has ended. Resubscribe to continue using AI features.',
    };
  }

  return { allowed: true, status: 'active' };
}
