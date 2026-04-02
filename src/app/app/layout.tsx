import { createCookieSupabase, createAdminSupabase } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import AppShell from '@/components/app/AppShell';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Skip when Supabase isn't configured (local dev)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return <AppShell>{children}</AppShell>;
  }

  // 1. Get the current session from cookies
  const supabase = await createCookieSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/pricing');
  }

  // 2. Check users table for access
  const admin = createAdminSupabase();
  const { data: userRow } = await admin
    .from('users')
    .select('has_access, subscription_status')
    .eq('id', user.id)
    .single();

  // Active subscribers and lapsed users (read-only) can access the app
  const subStatus = userRow?.subscription_status;
  const hasActiveSubscription = subStatus === 'active' || subStatus === 'past_due' || subStatus === 'canceled';
  const isLapsed = subStatus === 'lapsed';

  if (hasActiveSubscription || isLapsed) {
    return <AppShell>{children}</AppShell>;
  }

  // Legacy access check (pre-subscription users with has_access)
  if (userRow?.has_access) {
    return <AppShell>{children}</AppShell>;
  }

  // Check purchases table as fallback
  if (!userRow?.has_access) {
    const { data: purchaseRow } = await admin
      .from('purchases')
      .select('has_access, stripe_customer_id')
      .eq('email', user.email ?? '')
      .single();

    if (purchaseRow?.has_access) {
      await admin.from('users').upsert(
        {
          id: user.id,
          email: user.email!,
          has_access: true,
          stripe_customer_id: purchaseRow.stripe_customer_id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'email' },
      );
      return <AppShell>{children}</AppShell>;
    }
  }

  redirect('/pricing?access=required');
}
