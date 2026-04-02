import { createAdminSupabase } from '@/lib/supabase';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

async function getAuthUser() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {},
      },
    },
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return Response.json({ status: 'none' });
    }

    const admin = createAdminSupabase();
    const { data: userRow } = await admin
      .from('users')
      .select('subscription_status, subscription_tier, is_founding_member, subscription_current_period_end')
      .eq('id', user.id)
      .single();

    if (!userRow) {
      return Response.json({ status: 'none' });
    }

    return Response.json({
      status: userRow.subscription_status || 'none',
      tier: userRow.subscription_tier || null,
      is_founding_member: userRow.is_founding_member || false,
      current_period_end: userRow.subscription_current_period_end || null,
    });
  } catch {
    return Response.json({ status: 'none' });
  }
}
