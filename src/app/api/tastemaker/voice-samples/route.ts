import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { createAdminSupabase } from '@/lib/supabase';
import { countWords, extractDocxText } from '@/lib/docx-parser';
import { validateFileContent } from '@/lib/file-validation';

const MAX_FILE_BYTES = 500 * 1024;
const MAX_WORDS_PER_SAMPLE = 10_000;
const MAX_SAMPLES_PER_USER = 50;
const MAX_TOTAL_BYTES_PER_USER = 10 * 1024 * 1024;
const MAX_TITLE_CHARS = 100;
const MAX_NOTES_CHARS = 200;
const PASTE_MAX_BYTES = 2 * 1024 * 1024;

type SourceType = 'upload_md' | 'upload_txt' | 'upload_docx' | 'paste';

interface CreatePayload {
  title: string;
  notes: string;
  content: string;
  sourceType: SourceType;
}

function errorResponse(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

function deriveTitleFromFilename(filename: string): string {
  return filename.replace(/\.[^.]+$/, '').slice(0, MAX_TITLE_CHARS) || 'Untitled';
}

function sourceTypeFromFile(file: File): SourceType | null {
  const name = file.name.toLowerCase();
  if (name.endsWith('.md')) return 'upload_md';
  if (name.endsWith('.txt')) return 'upload_txt';
  if (name.endsWith('.docx')) return 'upload_docx';
  return null;
}

function rejectedFormatMessage(file: File): string | null {
  const name = file.name.toLowerCase();
  const mime = (file.type || '').toLowerCase();
  if (name.endsWith('.pdf') || mime === 'application/pdf') {
    return "PDFs aren't supported because text extraction is unreliable. Export as .docx or .txt, or paste the text directly.";
  }
  if (name.endsWith('.doc')) {
    return "Older .doc files aren't supported. Please save as .docx.";
  }
  if (mime.startsWith('image/')) {
    return "Images aren't supported. Please paste the text or upload as a document.";
  }
  return null;
}

async function parseMultipart(request: NextRequest): Promise<CreatePayload | Response> {
  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File)) {
    return errorResponse('Missing file.');
  }
  const rejection = rejectedFormatMessage(file);
  if (rejection) return errorResponse(rejection, 415);
  if (file.size > MAX_FILE_BYTES) {
    return errorResponse(`File exceeds the ${Math.round(MAX_FILE_BYTES / 1024)}KB limit.`, 413);
  }
  const sourceType = sourceTypeFromFile(file);
  if (!sourceType) {
    return errorResponse('Unsupported file type. Accepted: .md, .txt, .docx.', 415);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = sourceType === 'upload_docx' ? 'docx' : sourceType === 'upload_md' ? 'md' : 'txt';
  const contentMismatch = validateFileContent(buffer, ext);
  if (contentMismatch) return errorResponse(contentMismatch, 415);

  let content: string;
  try {
    content = sourceType === 'upload_docx' ? await extractDocxText(buffer) : buffer.toString('utf8');
  } catch {
    return errorResponse('Could not read the file. It may be corrupted.', 400);
  }

  const titleInput = (form.get('title') as string | null) || deriveTitleFromFilename(file.name);
  const notesInput = (form.get('notes') as string | null) || '';

  return {
    title: titleInput.trim().slice(0, MAX_TITLE_CHARS) || deriveTitleFromFilename(file.name),
    notes: notesInput.trim().slice(0, MAX_NOTES_CHARS),
    content: content.trim(),
    sourceType,
  };
}

async function parsePaste(request: NextRequest): Promise<CreatePayload | Response> {
  const contentLengthHeader = request.headers.get('content-length');
  if (!contentLengthHeader) {
    return errorResponse('Content-Length header required for paste submissions.', 411);
  }
  const contentLength = Number(contentLengthHeader);
  if (!Number.isFinite(contentLength) || contentLength <= 0) {
    return errorResponse('Invalid Content-Length.', 400);
  }
  if (contentLength > PASTE_MAX_BYTES) {
    return errorResponse(`Paste exceeds the ${Math.round(PASTE_MAX_BYTES / (1024 * 1024))}MB limit.`, 413);
  }

  let body: { title?: unknown; notes?: unknown; content?: unknown };
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON body.');
  }
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const notes = typeof body.notes === 'string' ? body.notes.trim() : '';
  const content = typeof body.content === 'string' ? body.content.trim() : '';
  if (!title) return errorResponse('Title is required.');
  if (!content) return errorResponse('Content is required.');

  return {
    title: title.slice(0, MAX_TITLE_CHARS),
    notes: notes.slice(0, MAX_NOTES_CHARS),
    content,
    sourceType: 'paste',
  };
}

export async function GET() {
  const user = await getAuthUser();
  if (!user) return errorResponse('Unauthorized', 401);

  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from('voice_samples')
    .select('id, title, notes, source_type, word_count, included_in_tastemaker, created_at, updated_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return errorResponse(error.message, 500);
  return Response.json({ samples: data ?? [] });
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return errorResponse('Unauthorized', 401);

  const contentType = request.headers.get('content-type') || '';
  const payload = contentType.includes('multipart/form-data')
    ? await parseMultipart(request)
    : await parsePaste(request);
  if (payload instanceof Response) return payload;

  const wordCount = countWords(payload.content);
  if (wordCount === 0) return errorResponse('Sample is empty after parsing.');
  if (wordCount > MAX_WORDS_PER_SAMPLE) {
    return errorResponse(`Sample is ${wordCount.toLocaleString()} words. Limit is ${MAX_WORDS_PER_SAMPLE.toLocaleString()} words per sample.`, 413);
  }

  const admin = createAdminSupabase();

  const { count } = await admin
    .from('voice_samples')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);
  if ((count ?? 0) >= MAX_SAMPLES_PER_USER) {
    return errorResponse(`You have reached the ${MAX_SAMPLES_PER_USER}-sample limit. Delete an older sample to add a new one.`, 409);
  }

  const { data: existing } = await admin
    .from('voice_samples')
    .select('content')
    .eq('user_id', user.id);
  const existingBytes = (existing ?? []).reduce(
    (sum, row) => sum + (typeof row.content === 'string' ? Buffer.byteLength(row.content, 'utf8') : 0),
    0,
  );
  const incomingBytes = Buffer.byteLength(payload.content, 'utf8');
  if (existingBytes + incomingBytes > MAX_TOTAL_BYTES_PER_USER) {
    return errorResponse('Adding this sample would exceed your 10MB voice-sample storage.', 413);
  }

  const { data, error } = await admin
    .from('voice_samples')
    .insert({
      user_id: user.id,
      title: payload.title,
      notes: payload.notes,
      source_type: payload.sourceType,
      content: payload.content,
      word_count: wordCount,
    })
    .select('id, title, notes, source_type, word_count, included_in_tastemaker, created_at, updated_at')
    .single();

  if (error) return errorResponse(error.message, 500);
  return Response.json({ sample: data });
}
