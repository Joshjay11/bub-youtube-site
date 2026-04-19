import { createAdminSupabase } from '@/lib/supabase';
import { getAuthUser, assertProjectOwned } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { projectId, chosenModel, rejectedModel } = await request.json();

    const user = await getAuthUser();
    if (!user) return Response.json({ ok: false }, { status: 401 });

    if (!projectId || typeof projectId !== 'string') {
      return Response.json({ ok: false, error: 'Missing projectId' }, { status: 400 });
    }

    if (!(await assertProjectOwned(user.id, projectId))) {
      return Response.json({ ok: false }, { status: 404 });
    }

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
