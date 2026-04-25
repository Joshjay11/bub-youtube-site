import fs from 'fs';
import path from 'path';

export type WriterRoute = 'generate-script' | 'suggest-hooks' | 'editors-table';
export type ModelFamily = 'claude' | 'minimax' | 'grok';

export interface ComposeWriterSystemPromptOptions {
  route: WriterRoute;
  modelFamily: ModelFamily;
  roleBlock: string;
  taskBlock: string;
  voiceTranscript?: string | null;
  cadenceCount?: 2 | 3;
}

export interface ComposeWriterSystemPromptResult {
  systemPrompt: string;
  metadata: {
    cadenceTranscriptIds: string[];
    layersIncluded: string[];
    totalChars: number;
    voiceTranscriptLength: number;
  };
}

// Static prompt content is read once at module init via fs.readFileSync.
// These files change at deploy time, not at runtime, so caching forever is safe.
//
// Vercel deploy note: Next.js's automatic file tracing follows static
// import/require statements, NOT dynamic fs reads from process.cwd().
// next.config.ts has an outputFileTracingIncludes entry that explicitly
// includes src/lib/prompts/**/* for the writer routes — keep that in sync
// with this module's read paths.
const PROMPTS_DIR = path.join(process.cwd(), 'src', 'lib', 'prompts');

const SOUL_CORE = fs.readFileSync(path.join(PROMPTS_DIR, 'soul-core.md'), 'utf-8');

const SOUL_YOUTUBE_PATH = path.join(PROMPTS_DIR, 'soul-youtube.md');
const SOUL_YOUTUBE = fs.existsSync(SOUL_YOUTUBE_PATH)
  ? fs.readFileSync(SOUL_YOUTUBE_PATH, 'utf-8')
  : null;

// INJECTION_FRAMING.md is a documentation file. The actual framing template
// lives inside its single fenced code block. Extract it at module init.
const INJECTION_FRAMING = (() => {
  const raw = fs.readFileSync(
    path.join(PROMPTS_DIR, 'cadence-pool', 'INJECTION_FRAMING.md'),
    'utf-8',
  );
  const open = raw.indexOf('\n```\n');
  const close = raw.indexOf('\n```\n', open + 1);
  if (open === -1 || close === -1) {
    throw new Error(
      'composeWriterSystemPrompt: INJECTION_FRAMING.md is missing the expected fenced code block',
    );
  }
  return raw.slice(open + 5, close);
})();

interface PoolManifestEntry {
  id: string;
  file: string;
}
interface PoolManifest {
  transcripts: PoolManifestEntry[];
}

const POOL_MANIFEST = JSON.parse(
  fs.readFileSync(path.join(PROMPTS_DIR, 'cadence-pool', 'pool-manifest.json'), 'utf-8'),
) as PoolManifest;

const TRANSCRIPTS: Record<string, string> = {};
for (const entry of POOL_MANIFEST.transcripts) {
  TRANSCRIPTS[entry.id] = fs.readFileSync(
    path.join(PROMPTS_DIR, 'cadence-pool', entry.file),
    'utf-8',
  );
}

export const VOICE_BLOCK_HEADER = `=== CREATOR REFERENCE MATERIAL ===
The transcript below is the creator's prior video output. Use it to understand their topic interests, vocabulary preferences, and audience-facing perspective. Soul-core anti-convergence rules and the rhythmic interference reference take precedence over voice-matching from this transcript. If the creator's prior transcript uses words or rhythms banned by soul-core, do NOT replicate those patterns — the product's value depends on output that reads as non-AI regardless of input style.
=== END CREATOR REFERENCE ===`;

function selectCadenceTranscripts(count: 2 | 3): { id: string; content: string }[] {
  const ids = Object.keys(TRANSCRIPTS);
  const shuffled = [...ids].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map((id) => ({ id, content: TRANSCRIPTS[id] }));
}

function buildCadenceBlock(count: 2 | 3): { block: string; selectedIds: string[] } {
  const selected = selectCadenceTranscripts(count);
  let block = INJECTION_FRAMING;
  for (let i = 0; i < count; i++) {
    block = block.replace(`{{TRANSCRIPT_${i + 1}}}`, selected[i].content);
  }
  if (count === 2) {
    const excerpt3Pattern =
      /-{50,}\s*\nBEGIN REFERENCE EXCERPT 3[\s\S]*?END REFERENCE EXCERPT 3\s*\n-{50,}\s*\n/;
    block = block.replace(excerpt3Pattern, '');
  }
  return { block, selectedIds: selected.map((s) => s.id) };
}

function buildVoiceBlock(transcript: string): string {
  return `${VOICE_BLOCK_HEADER}\n\n<user_voice_sample>\n${transcript}\n</user_voice_sample>`;
}

export function composeWriterSystemPrompt(
  options: ComposeWriterSystemPromptOptions,
): ComposeWriterSystemPromptResult {
  // route and modelFamily are accepted for caller-side telemetry coherence
  // and future per-family prompt-tuning hooks. Currently not consumed in
  // assembly — soul-core sec 4 already contains per-model fingerprint rules.
  void options.route;
  void options.modelFamily;

  const layers: string[] = [];
  const layersIncluded: string[] = [];

  layers.push(options.roleBlock);
  layersIncluded.push('role');

  layers.push(SOUL_CORE);
  layersIncluded.push('soul-core');

  if (SOUL_YOUTUBE) {
    layers.push(SOUL_YOUTUBE);
    layersIncluded.push('soul-youtube');
  }

  const cadence = buildCadenceBlock(options.cadenceCount ?? 2);
  layers.push(cadence.block);
  layersIncluded.push('cadence-pool');

  const transcript = options.voiceTranscript?.trim() ?? '';
  if (transcript.length > 0) {
    layers.push(buildVoiceBlock(transcript));
    layersIncluded.push('voice');
  }

  layers.push(options.taskBlock);
  layersIncluded.push('task');

  const systemPrompt = layers.join('\n\n---\n\n');

  return {
    systemPrompt,
    metadata: {
      cadenceTranscriptIds: cadence.selectedIds,
      layersIncluded,
      totalChars: systemPrompt.length,
      voiceTranscriptLength: transcript.length,
    },
  };
}
