import { callWithFallback } from '@/lib/ai-fallback';
import { resolveApiKey, decrementCredits, getUserEmail } from '@/lib/ai-credits';

// ─── Script Chunking (TypeScript — the script IS the grid) ──────────────────

interface ScriptChunk {
  beat_number: number;
  word_start: number;
  word_end: number;
  word_count: number;
  script_text: string;
}

function splitScriptIntoBeats(script: string, wpm: number = 140): ScriptChunk[] {
  const targetBeatSeconds = 25;
  const wordsPerBeat = Math.round((wpm * targetBeatSeconds) / 60);

  const words = script.split(/\s+/).filter(Boolean);
  const chunks: ScriptChunk[] = [];
  let currentIndex = 0;
  let beatNumber = 1;

  while (currentIndex < words.length) {
    let endIndex = Math.min(currentIndex + wordsPerBeat, words.length);

    // Don't split mid-sentence — extend to the next sentence-ending punctuation
    if (endIndex < words.length) {
      const searchLimit = Math.min(endIndex + 15, words.length);
      for (let i = endIndex; i < searchLimit; i++) {
        const word = words[i];
        if (word.endsWith('.') || word.endsWith('!') || word.endsWith('?') ||
            word.endsWith('"') || word.endsWith('...')) {
          endIndex = i + 1;
          break;
        }
      }
    }

    // Also break on tone markers like [tense], [excited], [pause]
    for (let i = currentIndex + Math.round(wordsPerBeat * 0.7); i < endIndex; i++) {
      if (words[i] && words[i].match(/^\[.+\]$/)) {
        endIndex = i;
        break;
      }
    }

    const chunkWords = words.slice(currentIndex, endIndex);
    const chunkText = chunkWords.join(' ');

    chunks.push({
      beat_number: beatNumber,
      word_start: currentIndex + 1,
      word_end: endIndex,
      word_count: chunkWords.length,
      script_text: chunkText,
    });

    currentIndex = endIndex;
    beatNumber++;
  }

  return chunks;
}

// ─── AI Prompts (visuals only — chunks are the grid) ────────────────────────

const SYSTEM_PROMPT = `You are a cinematic visual director creating AI image prompts for a YouTube video beat sheet.

You will receive SCRIPT CHUNKS — numbered sections of the actual script. Each chunk is one beat. Your job: read each chunk and generate a matching cinematic visual.

For each chunk, generate:
- visual_description: 1 sentence describing what this beat shows
- visual_type: One of: literal_human, metaphorical, b_roll, pattern_interrupt
- image_prompt: A cinematic image prompt (see structure below)
- slide_note: Brief note about what this section of the script covers

## IMAGE PROMPT STRUCTURE (Follow this exact order)

[Camera Distance + Angle], [Specific Subject + Action from the script chunk], [Environment], [Composition], [Lighting + Direction], [Color Story], shot on 35mm film, cinematic, 16:9

## CAMERA DISTANCE RULES

Cycle through distances — NEVER use the same distance for two consecutive beats:
- Extreme close-up (ECU), Close-up (CU), Medium close-up (MCU), Medium shot (MS)
- Medium wide (MWS), Wide shot (WS), Extreme wide (EWS)
- Also use: POV first-person, Over-the-shoulder (OTS), Bird's eye view

Include at least: 3 extreme close-ups, 2 wide/extreme wide shots, 1 POV or OTS per 10 beats.

## CAMERA ANGLES (vary — never 3 eye-level shots in a row)

Eye level, Low angle, High angle, Dutch angle, Over-the-shoulder, Bird's eye, POV

## SUBJECT SPECIFICITY

NEVER use "a person" or "someone." Read the script chunk — it tells you exactly who and what. Extract the specific role, character, object, or scenario described.

## METAPHORICAL RATIO

Every 3rd or 4th beat MUST use metaphorical/abstract imagery instead of a literal subject.
Use metaphors especially for: transitions, abstract concepts, emotional peaks.

## LIGHTING (NEVER use "soft dramatic lighting" — be specific with direction)

- "single monitor glow casting harsh blue side-light"
- "chiaroscuro lighting, single candle from bottom-left"
- "golden hour backlighting with lens flare"
- "overhead fluorescent casting flat unflattering light"
- "volumetric god rays cutting through dust"

## COLOR STORY (vary per beat — NEVER repeat "muted warm tones")

- "teal and amber split-toning"
- "high contrast B&W with red accent"
- "desaturated blues with amber accent"
- "monochromatic blue palette"

## WHAT NOT TO DO

- NEVER start a prompt with "A person" — start with camera distance
- NEVER use "soft dramatic lighting" or "muted warm tones"
- NEVER use same camera distance for consecutive beats
- NEVER use "with a [adjective] expression" — describe micro-actions
- NEVER produce more than 2 literal beats in a row without a metaphorical beat
- NEVER use generic environments — be specific from the script chunk

Respond ONLY with valid JSON:
{
  "style_anchor": "shot on 35mm film, cinematic, 16:9",
  "beats": [
    {
      "beat_number": 1,
      "script_excerpt": "First 10-15 words of the chunk...",
      "visual_description": "Description here",
      "visual_type": "literal_human",
      "image_prompt": "Camera-distance-first prompt here, shot on 35mm film, cinematic, 16:9",
      "slide_note": "What this section covers"
    }
  ]
}`;

const QC_PROMPT = `You are a cinematic quality control editor. Review this complete beat sheet and fix any issues.

CHECKS:
1. CAMERA CYCLING: No two consecutive beats use the same camera distance. Fix violations.
2. SUBJECTS: No "a person" or "someone" — must be specific from the script.
3. DUPLICATES: No two beats have substantially similar prompts. Each frame must be unique.
4. METAPHORICAL RATIO: At least every 3rd-4th beat is metaphorical/abstract.
5. LIGHTING: No two consecutive beats have identical lighting. Diversify.
6. MIDPOINT SEAM: Check the join between first half and second half beats for visual continuity.
7. DO NOT change beat numbers or script excerpts. Only modify visual content.

Return the complete corrected beat sheet in the same JSON format.`;

const FLASH_MODEL = 'google/gemini-3-flash-preview';

function parseJSON(raw: string): Record<string, unknown> {
  const stripped = raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(stripped);
  } catch {
    const first = raw.indexOf('{');
    const last = raw.lastIndexOf('}');
    if (first !== -1 && last > first) return JSON.parse(raw.slice(first, last + 1));
    throw new Error('Failed to parse JSON');
  }
}

interface Beat {
  beat_number: number;
  script_excerpt: string;
  visual_description: string;
  visual_type: string;
  image_prompt: string;
  slide_note: string;
}

interface BeatSheet {
  style_anchor: string;
  beats: Beat[];
}

// ─── Route Handler ──────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const { script, wpm: clientWpm } = await request.json();
    if (!script?.trim()) {
      return Response.json({ error: 'No script found. Generate your script on the Write page first.' }, { status: 400 });
    }

    const email = await getUserEmail();
    const { source } = await resolveApiKey(email);

    // 2 credits for three-pass beat generation
    if (source === 'credits' && email) {
      await decrementCredits(email);
      await decrementCredits(email);
    }

    const wpm = clientWpm || 140;
    const words = script.split(/\s+/).filter(Boolean);
    const totalWords = words.length;
    const wordsPerBeat = Math.round((wpm * 25) / 60);

    // Step 1: Split script into word-count chunks — the script IS the grid
    const chunks = splitScriptIntoBeats(script, wpm);
    const midpoint = Math.ceil(chunks.length / 2);
    const firstHalf = chunks.slice(0, midpoint);
    const secondHalf = chunks.slice(midpoint);

    // Step 2: Pass 1 — AI generates visuals for first half of chunks
    const formatChunks = (list: ScriptChunk[]) =>
      list.map(c => `--- BEAT ${c.beat_number} (${c.word_count} words) ---\n${c.script_text}`).join('\n\n');

    const pass1Msg = `Here are the script chunks for the FIRST HALF of the video. Each chunk is one beat.
Read each chunk and generate a matching cinematic visual.

${formatChunks(firstHalf)}

Full script for context:
${script.trim()}`;

    const pass1 = await callWithFallback({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: pass1Msg },
      ],
      primaryModel: FLASH_MODEL,
      maxTokens: 4000,
      temperature: 0.7,
      jsonMode: true,
    });

    let firstHalfBeats: BeatSheet;
    try {
      firstHalfBeats = parseJSON(pass1.content) as unknown as BeatSheet;
    } catch {
      return Response.json({ error: 'Failed to parse first half beats' }, { status: 500 });
    }

    // Step 3: Pass 2 — AI generates visuals for second half, with continuity context
    const lastThreeBeats = (firstHalfBeats.beats || []).slice(-3);
    const lastCamera = lastThreeBeats[lastThreeBeats.length - 1]?.image_prompt?.split(',')[0] || 'unknown';

    const pass2Msg = `Here are the script chunks for the SECOND HALF of the video. Each chunk is one beat.
Read each chunk and generate a matching cinematic visual.

LAST 3 BEATS FROM FIRST HALF (for camera distance continuity — don't repeat their distances):
${JSON.stringify(lastThreeBeats, null, 2)}

The last camera distance used was: ${lastCamera}

${formatChunks(secondHalf)}

Full script for context:
${script.trim()}`;

    const pass2 = await callWithFallback({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: pass2Msg },
      ],
      primaryModel: FLASH_MODEL,
      maxTokens: 4000,
      temperature: 0.7,
      jsonMode: true,
    });

    let secondHalfBeats: BeatSheet;
    try {
      secondHalfBeats = parseJSON(pass2.content) as unknown as BeatSheet;
    } catch {
      return Response.json({ error: 'Failed to parse second half beats' }, { status: 500 });
    }

    // Step 4: Merge both halves
    const mergedBeats: Beat[] = chunks.map((chunk, i) => {
      const aiBeat = i < midpoint
        ? (firstHalfBeats.beats || [])[i]
        : (secondHalfBeats.beats || [])[i - midpoint];

      return {
        beat_number: chunk.beat_number,
        script_excerpt: chunk.script_text.split(/\s+/).slice(0, 12).join(' ') + '...',
        visual_description: aiBeat?.visual_description || '',
        visual_type: aiBeat?.visual_type || 'b_roll',
        image_prompt: aiBeat?.image_prompt || '',
        slide_note: aiBeat?.slide_note || '',
      };
    });

    const merged: BeatSheet = {
      style_anchor: 'shot on 35mm film, cinematic, 16:9',
      beats: mergedBeats,
    };

    // Step 5: Pass 3 — QC on merged result
    const pass3Msg = `Here is the original FULL script:

${script.trim()}

Here is the complete beat sheet (${chunks.length} beats):

${JSON.stringify(merged, null, 2)}

The first half had ${midpoint} beats. The seam is between beat ${midpoint} and beat ${midpoint + 1}.

Review and fix visual content only. DO NOT change beat numbers or script excerpts. Return the corrected beat sheet.`;

    const pass3 = await callWithFallback({
      messages: [
        { role: 'system', content: QC_PROMPT },
        { role: 'user', content: pass3Msg },
      ],
      primaryModel: FLASH_MODEL,
      maxTokens: 6000,
      temperature: 0.5,
      jsonMode: true,
    });

    let qcResult: BeatSheet;
    try {
      qcResult = parseJSON(pass3.content) as unknown as BeatSheet;
    } catch {
      console.warn('[generate-beats] Pass 3 parse failed, using merged output');
      qcResult = merged;
    }

    // Step 6: Final enforcement — re-overlay chunk data onto AI output
    const finalBeats = chunks.map((chunk, i) => {
      const aiBeat = (qcResult.beats || merged.beats).find(b => b.beat_number === chunk.beat_number)
        || (qcResult.beats || merged.beats)[i];

      return {
        beat_number: chunk.beat_number,
        script_excerpt: chunk.script_text.split(/\s+/).slice(0, 12).join(' ') + '...',
        word_range: `words ${chunk.word_start}-${chunk.word_end}`,
        word_count: chunk.word_count,
        visual_description: aiBeat?.visual_description || '',
        visual_type: aiBeat?.visual_type || 'b_roll',
        image_prompt: aiBeat?.image_prompt || '',
        slide_note: aiBeat?.slide_note || '',
      };
    });

    return Response.json({
      style_anchor: 'shot on 35mm film, cinematic, 16:9',
      beats: finalBeats,
      metadata: {
        total_words: totalWords,
        wpm,
        words_per_beat: wordsPerBeat,
        beat_count: chunks.length,
        estimated_duration: `${Math.round(totalWords / wpm)} minutes`,
      },
    });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 });
  }
}
