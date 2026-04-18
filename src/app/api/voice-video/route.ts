import { getUserEmail } from '@/lib/ai-credits';
import { checkSubscriptionAccess } from '@/lib/subscription-check';
import { createAdminSupabase } from '@/lib/supabase';
import { fetchVoiceVideo } from '@/lib/voice-video-fetcher';

export async function GET() {
  const email = await getUserEmail();
  if (!email) return Response.json({ error: 'Not authenticated' }, { status: 401 });

  const supabase = createAdminSupabase();
  const { data } = await supabase
    .from('user_settings')
    .select('voice_video_url, voice_video_fetched_at, voice_video_transcript, voice_nudge_dismissed')
    .eq('email', email)
    .single();

  const hasTranscript = !!(data?.voice_video_transcript && data.voice_video_transcript.trim());
  return Response.json({
    url: data?.voice_video_url || null,
    fetchedAt: data?.voice_video_fetched_at || null,
    hasTranscript,
    preview: data?.voice_video_transcript ? data.voice_video_transcript.slice(0, 240) : null,
    nudgeDismissed: !!data?.voice_nudge_dismissed,
    showNudge: !hasTranscript && !data?.voice_nudge_dismissed,
  });
}

export async function PATCH(request: Request) {
  const email = await getUserEmail();
  if (!email) return Response.json({ error: 'Not authenticated' }, { status: 401 });

  let body: { dismissNudge?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid body' }, { status: 400 });
  }

  if (body.dismissNudge === true) {
    const supabase = createAdminSupabase();
    await supabase
      .from('user_settings')
      .upsert(
        { email, voice_nudge_dismissed: true, updated_at: new Date().toISOString() },
        { onConflict: 'email' },
      );
    return Response.json({ success: true });
  }
  return Response.json({ success: false }, { status: 400 });
}

export async function POST(request: Request) {
  const email = await getUserEmail();
  if (!email) return Response.json({ error: 'Not authenticated' }, { status: 401 });

  const { allowed, message } = await checkSubscriptionAccess(email);
  if (!allowed) {
    return Response.json({ success: false, error: message || 'Subscription required.', needsSubscription: true }, { status: 403 });
  }

  let body: { url?: unknown; remove?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, error: 'Invalid request body.' }, { status: 400 });
  }

  const supabase = createAdminSupabase();

  // Remove voice sample
  if (body.remove === true) {
    await supabase
      .from('user_settings')
      .upsert(
        {
          email,
          voice_video_url: null,
          voice_video_transcript: null,
          voice_video_fetched_at: null,
          voice_nudge_dismissed: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'email' },
      );
    return Response.json({ success: true, removed: true });
  }

  const url = typeof body.url === 'string' ? body.url.trim() : '';
  if (!url) {
    return Response.json({ success: false, error: 'Missing URL.' }, { status: 400 });
  }
  if (!/youtube\.com|youtu\.be/i.test(url)) {
    return Response.json({ success: false, error: 'That does not look like a YouTube URL.' });
  }

  const result = await fetchVoiceVideo(url);
  if (!result.ok) {
    return Response.json({ success: false, error: result.error });
  }

  const { error: upsertError } = await supabase
    .from('user_settings')
    .upsert(
      {
        email,
        voice_video_url: url,
        voice_video_transcript: result.transcript,
        voice_video_fetched_at: new Date().toISOString(),
        voice_nudge_dismissed: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'email' },
    );

  if (upsertError) {
    return Response.json({ success: false, error: 'Saved transcript but database write failed.' });
  }

  return Response.json({
    success: true,
    truncated: result.truncated,
    chars: result.transcript.length,
    videoId: result.videoId,
  });
}
