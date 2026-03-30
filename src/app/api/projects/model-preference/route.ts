import { createAdminSupabase } from '@/lib/supabase';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { projectId, chosenModel, rejectedModel } = await request.json();

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } },
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ ok: false }, { status: 401 });

    const admin = createAdminSupabase();
    await admin.from('model_preferences').insert({
      user_id: user.id,
      project_id: projectId,
      task: 'script_generation',
      chosen_model: chosenModel,
      rejected_model: rejectedModel,
    });

    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false });
  }
}
