// youtube-transcript v1.3.0 ships a broken package.json: `type: module` + a `main`
// pointing at a CommonJS file that uses bare `exports.X = ...`. Node refuses to load it.
// The actual ESM build at this subpath is fine — import directly from it.
// @ts-expect-error — no types exported for the subpath, but the runtime API is identical.
import { YoutubeTranscript } from 'youtube-transcript/dist/youtube-transcript.esm.js';

const MAX_TRANSCRIPT_CHARS = 30_000;

export function extractYouTubeVideoId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // youtu.be/VIDEOID
  const shortMatch = trimmed.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];

  // youtube.com/watch?v=VIDEOID
  const watchMatch = trimmed.match(/[?&]v=([A-Za-z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];

  // youtube.com/embed/VIDEOID or youtube.com/shorts/VIDEOID
  const embedMatch = trimmed.match(/youtube\.com\/(?:embed|shorts|v)\/([A-Za-z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];

  // Bare 11-char ID
  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) return trimmed;

  return null;
}

export type FetchResult =
  | { ok: true; transcript: string; videoId: string; truncated: boolean }
  | { ok: false; error: string };

/**
 * Fetch a YouTube video transcript and return the concatenated plain text.
 *
 * Replicates BUB Recon's defensive strategy:
 *   1. Try English first.
 *   2. Fall back to listing all transcripts and picking any English variant.
 *   3. Fall back to the first available language.
 *   4. On any failure, return a user-friendly error — never throw.
 *
 * The youtube-transcript npm package collapses (1)/(2) into a single call when
 * passed `lang: 'en'`, and its no-arg call returns whatever default transcript
 * the video exposes — that covers (3). We try in that order.
 */
export async function fetchVoiceVideo(youtubeUrl: string): Promise<FetchResult> {
  const videoId = extractYouTubeVideoId(youtubeUrl);
  if (!videoId) {
    return { ok: false, error: 'Could not parse a YouTube video ID from that URL.' };
  }

  // Try English explicitly
  let segments: Array<{ text: string }> | null = null;
  try {
    segments = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' });
  } catch {
    // fall through
  }

  // Fallback: default (any available language)
  if (!segments || segments.length === 0) {
    try {
      segments = await YoutubeTranscript.fetchTranscript(videoId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/disabled|unavailable|not available/i.test(msg)) {
        return { ok: false, error: 'This video has no available transcript.' };
      }
      if (/private|unavailable/i.test(msg)) {
        return { ok: false, error: 'This video is private or unavailable.' };
      }
      return { ok: false, error: 'Could not fetch transcript. Try a different video.' };
    }
  }

  if (!segments || segments.length === 0) {
    return { ok: false, error: 'No transcript content found for this video.' };
  }

  // Concatenate plain text, decode HTML entities the lib leaves behind
  const fullText = segments
    .map((s) => s.text)
    .join(' ')
    .replace(/&amp;#39;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;quot;/g, '"')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

  if (!fullText) {
    return { ok: false, error: 'Transcript was empty.' };
  }

  let truncated = false;
  let finalText = fullText;
  if (finalText.length > MAX_TRANSCRIPT_CHARS) {
    finalText = finalText.slice(0, MAX_TRANSCRIPT_CHARS);
    truncated = true;
    console.warn(
      `[voice-video-fetcher] Transcript truncated from ${fullText.length} to ${MAX_TRANSCRIPT_CHARS} chars (videoId=${videoId})`,
    );
  }

  return { ok: true, transcript: finalText, videoId, truncated };
}
