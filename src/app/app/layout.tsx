import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase';
import AppShell from '@/components/app/AppShell';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Skip when Supabase isn't configured (local dev)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    return <AppShell>{children}</AppShell>;
  }

  // Gate 1: Must be logged in (have auth cookie)
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  const hasAuth = allCookies.some(
    (c) => c.name.startsWith('sb-') && c.name.endsWith('-auth-token')
  );

  if (!hasAuth) {
    redirect('/template');
  }

  // Gate 2: Must have paid — check users table, then purchases table
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (user?.email) {
    // Check users table first
    const { data: userRow } = await supabase
      .from('users')
      .select('has_access')
      .eq('email', user.email)
      .single();

    if (userRow?.has_access) {
      return <AppShell>{children}</AppShell>;
    }

    // Fall back to purchases table
    const { data: purchase } = await supabase
      .from('purchases')
      .select('has_access')
      .eq('email', user.email)
      .single();

    if (purchase?.has_access) {
      return <AppShell>{children}</AppShell>;
    }
  }

  // Logged in but no purchase — send to sales page
  redirect('/template?access=required');
}
