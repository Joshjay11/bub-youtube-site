import { createAdminSupabase } from '@/lib/supabase';

/**
 * Voice Video Sampling v1 (Tier A) injection helpers.
 *
 * Reads the user's stored video transcript and prepends it to the system prompt
 * of writing routes so generated scripts mimic the user's spoken voice.
 *
 * NOT for analysis routes (score, audit, scan). Only call from routes that
 * generate spoken-word output: generate-script, suggest-hooks, editors-table.
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

const VOICE_BLOCK_HEADER = `The user has provided a sample of their own voice from a past video they wrote. Study this sample carefully. Match its sentence rhythm, vocabulary, energy level, signature phrasing, and conversational patterns in your output. Do not copy specific content from the sample. Match only the voice and style. If the user's voice in the sample conflicts with other instructions in this prompt, the user's voice takes precedence.`;

export function prependVoiceVideoBlock(systemPrompt: string, transcript: string | null): string {
  if (!transcript || !transcript.trim()) return systemPrompt;
  return `${VOICE_BLOCK_HEADER}\n\n<user_voice_sample>\n${transcript}\n</user_voice_sample>\n\n---\n\n${systemPrompt}`;
}
