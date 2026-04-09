#!/usr/bin/env node
/**
 * Voice Video Sampling — subjective quality comparison helper.
 *
 * Runs the SAME generation prompt twice against Claude Sonnet:
 *   1. Without any voice sample (baseline)
 *   2. With a YouTube transcript prepended (voice-injected)
 *
 * Prints both outputs side by side so you can eyeball whether the injected
 * version sounds more like the user.
 *
 * USAGE:
 *   node scripts/compare-voice-sample.mjs <youtube-url> [--prompt "..."]
 *
 * REQUIRES:
 *   - ANTHROPIC_API_KEY in env
 *   - youtube-transcript installed (already a dep)
 */
import Anthropic from '@anthropic-ai/sdk';
// youtube-transcript v1.3.0 has a broken package.json — import the ESM build directly.
import { YoutubeTranscript } from 'youtube-transcript/dist/youtube-transcript.esm.js';

const args = process.argv.slice(2);
const url = args[0];
if (!url) {
  console.error('Usage: node scripts/compare-voice-sample.mjs <youtube-url> [--prompt "..."]');
  process.exit(1);
}
const promptIdx = args.indexOf('--prompt');
const userPrompt = promptIdx >= 0 ? args[promptIdx + 1] : 'Write the opening 200 words of a YouTube video about why most productivity advice is broken for creative work.';

function extractId(u) {
  return (u.match(/youtu\.be\/([A-Za-z0-9_-]{11})/) || u.match(/[?&]v=([A-Za-z0-9_-]{11})/) || [])[1];
}

const videoId = extractId(url);
if (!videoId) { console.error('Could not parse video ID'); process.exit(1); }

console.log(`Fetching transcript for ${videoId}...`);
let segments;
try {
  segments = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' });
} catch {
  segments = await YoutubeTranscript.fetchTranscript(videoId);
}
const transcript = segments.map((s) => s.text).join(' ').replace(/\s+/g, ' ').slice(0, 30_000);
console.log(`Transcript: ${transcript.length} chars\n`);

const BASE_SYSTEM = `You are a YouTube script writer. Write punchy, conversational, retention-engineered copy.`;
const VOICE_HEADER = `The user has provided a sample of their own voice from a past video they wrote. Study this sample carefully. Match its sentence rhythm, vocabulary, energy level, signature phrasing, and conversational patterns in your output. Do not copy specific content from the sample — only its voice and style. If the user's voice in the sample conflicts with other instructions in this prompt, the user's voice takes precedence.`;
const injected = `${VOICE_HEADER}\n\n<user_voice_sample>\n${transcript}\n</user_voice_sample>\n\n---\n\n${BASE_SYSTEM}`;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function run(system, label) {
  const r = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 600,
    system,
    messages: [{ role: 'user', content: userPrompt }],
  });
  return r.content[0].type === 'text' ? r.content[0].text : '';
}

console.log('Generating both versions in parallel...\n');
const [baseline, voiced] = await Promise.all([run(BASE_SYSTEM), run(injected)]);

const sep = '═'.repeat(80);
console.log(sep);
console.log('BASELINE (no voice sample)');
console.log(sep);
console.log(baseline);
console.log('\n' + sep);
console.log('VOICE-INJECTED');
console.log(sep);
console.log(voiced);
console.log('\n' + sep);
console.log('Subjective check: does the voice-injected version sound more like the source video?');
