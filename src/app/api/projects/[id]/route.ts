import { NextRequest } from 'next/server';
import { getAuthUser, assertProjectOwned } from '@/lib/auth';
import { createAdminSupabase } from '@/lib/supabase';

const VALID_STATUSES = [
  'idea',
  'researching',
  'scripting',
  'filming',
  'editing',
  'published',
] as const;

function errorResponse(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthUser();
  if (!user) return errorResponse('Unauthorized', 401);
  if (!(await assertProjectOwned(user.id, id))) return errorResponse('Not found', 404);

  let body: { included?: unknown; title?: unknown; status?: unknown };
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON body.');
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.included === 'boolean') {
    updates.included_in_tastemaker = body.included;
  }
  if (typeof body.title === 'string') {
    const title = body.title.trim();
    if (!title) return errorResponse('Title cannot be empty.');
    if (title.length > 200) return errorResponse('Title too long (max 200 chars).');
    updates.title = title;
  }
  if (typeof body.status === 'string') {
    if (!VALID_STATUSES.includes(body.status as typeof VALID_STATUSES[number])) {
      return errorResponse(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
    }
    updates.status = body.status;
  }

  if (Object.keys(updates).length === 1) {
    return errorResponse('No updatable fields provided.');
  }

  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from('projects')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id, title, status, included_in_tastemaker, created_at, updated_at')
    .single();

  if (error) return errorResponse(error.message, 500);
  return Response.json({ project: data });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthUser();
  if (!user) return errorResponse('Unauthorized', 401);
  if (!(await assertProjectOwned(user.id, id))) return errorResponse('Not found', 404);

  const admin = createAdminSupabase();

  // FK cascade is in place on project_data and model_preferences, but
  // delete project_data explicitly first as a defensive belt-and-suspenders.
  const dataDelete = await admin.from('project_data').delete().eq('project_id', id);
  if (dataDelete.error) {
    return errorResponse(`project_data delete failed: ${dataDelete.error.message}`, 500);
  }

  const projectDelete = await admin.from('projects').delete().eq('id', id).eq('user_id', user.id);
  if (projectDelete.error) {
    return errorResponse(`project delete failed: ${projectDelete.error.message}`, 500);
  }

  return Response.json({ ok: true });
}
