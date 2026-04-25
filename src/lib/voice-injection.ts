import { createAdminSupabase } from '@/lib/supabase';

/**
 * Voice Video Sampling: DB helper.
 *
 * Reads the user's stored video transcript so writer routes can pass it to
 * composeWriterSystemPrompt's voiceTranscript option. The composer owns
 * the layer header and prompt-stack placement; this module only fetches
 * the raw transcript string.
 *
 * Only relevant for routes that generate spoken-word output (generate-script,
 * suggest-hooks, editors-table). Never call from analysis routes.
 */

export async function getVoiceVideoTranscript(email: string | null): Promise<string | null> {
  if (!email) return null;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;

  try {
    const supabase = createAdminSupabase();
    const { data } = await supabase
      .from('user_settings')
      .select('voice_video_transcript')
      .eq('email', email)
      .single();

    const transcript = data?.voice_video_transcript;
    if (typeof transcript === 'string' && transcript.trim().length > 0) {
      return transcript;
    }
    return null;
  } catch {
    // Graceful degradation: never block generation if the read fails.
    return null;
  }
}
