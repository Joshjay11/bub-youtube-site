import { NextRequest } from 'next/server';
import { getAuthUser, assertProjectOwned } from '@/lib/auth';
import { createAdminSupabase } from '@/lib/supabase';

function errorResponse(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthUser();
  if (!user) return errorResponse('Unauthorized', 401);
  if (!(await assertProjectOwned(user.id, id))) return errorResponse('Not found', 404);

  let body: { included?: unknown; title?: unknown };
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
    updates.title = title;
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
