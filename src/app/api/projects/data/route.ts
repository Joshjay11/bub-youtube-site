import { createAdminSupabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const projectId = url.searchParams.get('projectId');
  const toolKey = url.searchParams.get('toolKey');

  if (!projectId || !toolKey) {
    return Response.json({ error: 'Missing projectId or toolKey' }, { status: 400 });
  }

  const supabase = createAdminSupabase();
  const { data } = await supabase
    .from('project_data')
    .select('data')
    .eq('project_id', projectId)
    .eq('tool_key', toolKey)
    .single();

  return Response.json({ data: data?.data ?? {} });
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { projectId, toolKey, data } = body;

    if (!projectId || !toolKey || data === undefined) {
      return Response.json({ error: 'Missing projectId, toolKey, or data' }, { status: 400 });
    }

    const supabase = createAdminSupabase();

    const { error } = await supabase
      .from('project_data')
      .upsert(
        {
          project_id: projectId,
          tool_key: toolKey,
          data,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'project_id,tool_key' },
      );

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Save failed';
    return Response.json({ error: message }, { status: 500 });
  }
}
