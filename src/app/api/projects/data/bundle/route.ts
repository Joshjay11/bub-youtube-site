import { createAdminSupabase } from '@/lib/supabase';
import { getAuthUser, assertProjectOwned } from '@/lib/auth';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const projectId = url.searchParams.get('projectId');

  if (!projectId) {
    return Response.json({ error: 'Missing projectId' }, { status: 400 });
  }

  const user = await getAuthUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!(await assertProjectOwned(user.id, projectId))) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  const supabase = createAdminSupabase();
  const { data, error } = await supabase
    .from('project_data')
    .select('tool_key, data')
    .eq('project_id', projectId);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const bundle: Record<string, unknown> = {};
  for (const row of data || []) {
    bundle[row.tool_key] = row.data;
  }

  return Response.json(bundle);
}
