import { createCookieSupabase, createAdminSupabase } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import AppShell from '@/components/app/AppShell';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const hasSupabaseEnv = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  if (!hasSupabaseEnv) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[app/layout] Supabase env vars missing - auth gate bypassed for local dev');
      return <AppShell>{children}</AppShell>;
    }
    console.error('[app/layout] Supabase env vars missing in production - service misconfigured');
    return (
      <div style={{ padding: '3rem', textAlign: 'center', fontFamily: 'system-ui', maxWidth: '32rem', margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Service temporarily unavailable</h1>
        <p style={{ color: '#555' }}>
          We are working on it. Please try again in a few minutes.
        </p>
      </div>
    );
  }

  const supabase = await createCookieSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const admin = createAdminSupabase();
  const { data: userRow } = await admin
    .from('users')
    .select('has_access')
    .eq('id', user.id)
    .single();

  if (userRow?.has_access) {
    return <AppShell>{children}</AppShell>;
  }

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

  const reason = userRow ? 'expired' : 'required';
  redirect(`/pricing?access=${reason}`);
}
