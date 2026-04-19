import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { createAdminSupabase } from '@/lib/supabase';

const MAX_TITLE_CHARS = 100;
const MAX_NOTES_CHARS = 200;

function errorResponse(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

async function assertSampleOwned(userId: string, sampleId: string): Promise<boolean> {
  const admin = createAdminSupabase();
  const { data } = await admin
    .from('voice_samples')
    .select('id')
    .eq('id', sampleId)
    .eq('user_id', userId)
    .single();
  return !!data;
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthUser();
  if (!user) return errorResponse('Unauthorized', 401);

  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from('voice_samples')
    .select('id, title, notes, source_type, content, word_count, included_in_tastemaker, created_at, updated_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !data) return errorResponse('Not found', 404);
  return Response.json({ sample: data });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthUser();
  if (!user) return errorResponse('Unauthorized', 401);
  if (!(await assertSampleOwned(user.id, id))) return errorResponse('Not found', 404);

  let body: { title?: unknown; notes?: unknown; included?: unknown };
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON body.');
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.title === 'string') {
    const title = body.title.trim().slice(0, MAX_TITLE_CHARS);
    if (!title) return errorResponse('Title cannot be empty.');
    updates.title = title;
  }
  if (typeof body.notes === 'string') {
    updates.notes = body.notes.trim().slice(0, MAX_NOTES_CHARS);
  }
  if (typeof body.included === 'boolean') {
    updates.included_in_tastemaker = body.included;
  }

  if (Object.keys(updates).length === 1) {
    return errorResponse('No updatable fields provided.');
  }

  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from('voice_samples')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id, title, notes, source_type, word_count, included_in_tastemaker, created_at, updated_at')
    .single();

  if (error) return errorResponse(error.message, 500);
  return Response.json({ sample: data });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthUser();
  if (!user) return errorResponse('Unauthorized', 401);
  if (!(await assertSampleOwned(user.id, id))) return errorResponse('Not found', 404);

  const admin = createAdminSupabase();
  const { error } = await admin
    .from('voice_samples')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return errorResponse(error.message, 500);
  return Response.json({ success: true });
}
