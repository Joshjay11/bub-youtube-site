import { createAdminSupabase } from '@/lib/supabase';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { checkSubscriptionAccess } from '@/lib/subscription-check';

async function getAuthUser(): Promise<{ id: string; email: string } | null> {
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
  if (!user?.id) return null;
  return { id: user.id, email: user.email || '' };
}

export async function GET() {
  const authUser = await getAuthUser();
  if (!authUser) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from('projects')
    .select('id, title, status, included_in_tastemaker, created_at, updated_at')
    .eq('user_id', authUser.id)
    .order('updated_at', { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ projects: data || [] });
}

export async function POST(request: Request) {
  const authUser = await getAuthUser();
  if (!authUser) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { allowed, message } = await checkSubscriptionAccess(authUser.email);
  if (!allowed) {
    return Response.json({ error: message, needsSubscription: true }, { status: 403 });
  }

  const { title } = await request.json();
  if (!title || typeof title !== 'string') {
    return Response.json({ error: 'Title is required' }, { status: 400 });
  }

  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from('projects')
    .insert({
      user_id: authUser.id,
      title: title.trim(),
      status: 'idea',
    })
    .select('id, title, status, included_in_tastemaker, created_at, updated_at')
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ project: data });
}
