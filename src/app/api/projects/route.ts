import { createAdminSupabase } from '@/lib/supabase';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

async function getAuthUserId(): Promise<string | null> {
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
  return user?.id || null;
}

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from('projects')
    .select('id, title, status, created_at, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ projects: data || [] });
}

export async function POST(request: Request) {
  const userId = await getAuthUserId();
  if (!userId) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { title } = await request.json();
  if (!title || typeof title !== 'string') {
    return Response.json({ error: 'Title is required' }, { status: 400 });
  }

  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from('projects')
    .insert({
      user_id: userId,
      title: title.trim(),
      status: 'idea',
    })
    .select('id, title, status, created_at, updated_at')
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ project: data });
}
