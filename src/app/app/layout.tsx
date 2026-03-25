import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AppShell from '@/components/app/AppShell';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Auth gate: check for Supabase auth cookie
  // Skip when Supabase isn't configured (local dev)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    const hasAuth = allCookies.some(
      (c) => c.name.startsWith('sb-') && c.name.endsWith('-auth-token')
    );

    if (!hasAuth) {
      redirect('/template');
    }
  }

  return <AppShell>{children}</AppShell>;
}
