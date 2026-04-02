import { callWithFallback } from '@/lib/ai-fallback';
import { resolveApiKey, decrementCredits, getUserEmail } from '@/lib/ai-credits';

const SYSTEM_PROMPT = `You are a cinematic visual director creating AI image prompts for a YouTube video beat sheet. You will receive a script and must generate 8-15 visual beats, each with a production-ready image prompt optimized for Leonardo AI and Midjourney.

PROMPT STRUCTURE (Follow this exact order for every image prompt):
[Camera Distance + Angle], [Subject + Specific Action], [Environment/Context], [Composition Technique], [Lighting Quality + Direction], [Color Story], [Style Anchor]

Example: "Extreme close-up low angle, trembling fingers hovering over a keyboard delete key, cluttered home office at 3 AM with empty coffee cups in foreground, shallow depth of field with foreground bokeh, single monitor glow casting harsh blue side-light with deep shadows, teal and amber split-toning, shot on 35mm film, cinematic, 16:9"

CAMERA DISTANCE RULES (Critical — enforces visual variety):
NEVER use the same camera distance for two consecutive beats. Use at least 5 different distances:
- Extreme wide shot (EWS): Subject tiny in vast environment
- Wide shot (WS): Full body + environment
- Medium wide (MWS): Knees up, environmental context
- Medium shot (MS): Waist up — use sparingly, AI defaults to this
- Medium close-up (MCU): Chest up
- Close-up (CU): Face fills frame
- Extreme close-up (ECU): Single detail — eye, hand, object
Include at least: 2 extreme close-ups, 1 wide/extreme wide, 1 POV or over-the-shoulder shot.

CAMERA ANGLE (Vary — never 3 eye-level shots in a row):
Eye level, Low angle looking up, High angle looking down, Dutch angle/canted, Over-the-shoulder, Bird's eye/overhead, POV first-person

COMPOSITION (Rotate — never repeat same technique twice in a row):
Rule of thirds, Leading lines, Frame within a frame, Negative space, Symmetrical center-framed, Foreground element out of focus

LIGHTING (Progress through beat sheet — do NOT repeat "soft dramatic lighting"):
Use SPECIFIC lighting with direction: "single hard source from bottom-left," "rim lighting creating silhouette edge glow," "practical lighting from monitor screen," "golden hour backlighting with lens flare," "volumetric god rays through dust," "overhead fluorescent casting flat unflattering light"
Progress: Setup=soft ambient → Tension=harsh directional → Resolution=warm golden

COLOR STORY (Vary per beat — do NOT repeat "muted warm tones"):
Use specific contrasts: "teal and orange," "desaturated blues with amber accent," "monochromatic blue," "high contrast B&W with red accent," "warm amber highlights cool cyan shadows"

STYLE ANCHOR (fixed, at end of every prompt): "shot on 35mm film, cinematic, 16:9"

METAPHORICAL vs LITERAL:
Every 3rd or 4th beat MUST use metaphorical/abstract imagery instead of a literal human subject.
Instead of "a person feeling overwhelmed" → "a crumbling stone monolith sinking into dark water"
Use metaphorical for: transitions, abstract concepts, emotional peaks, B-roll.
Use literal for: exposition, demonstrations, specific human moments.

BEAT TYPE DEFAULTS:
Hook: ECU or EWS, low angle or POV, curiosity/intrigue
Exposition: MS or MCU, eye level, literal setup
Transition: MWS or WS, Dutch or high angle, metaphorical bridge
Climax: CU or ECU, low angle or Dutch, emotional intensity
B-Roll: Varies, bird's eye or OTS, mix of macro/metaphorical
Conclusion: WS or EWS, eye level symmetrical, resolution/calm

PATTERN INTERRUPTS: At beat 5 (8-beat) or beats 5+9 (12+ beats), create visual shock: sudden ECU, Dutch angle, surreal image, or dramatic color shift.

TIMESTAMP RULES (Critical — beats must match the actual script):
You will receive the full script. Derive timestamps from the SCRIPT'S CONTENT, not by dividing time evenly.
1. Calculate total video duration: count the script's words, divide by the speaking pace (default 140 WPM). If a pace is provided, use that.
2. Identify natural section breaks — topic shifts, new arguments, the pivot point, the climax, the conclusion. These become beat boundaries.
3. Beats should be UNEQUAL in length. Dense exposition = 90 seconds. Quick transition = 15 seconds. Hook = 15-30 seconds.
4. Total of all beat timestamps must equal the calculated video duration (±15 seconds).
5. NEVER distribute beats in equal intervals. A beat sheet where every beat is exactly 30 seconds is WRONG.

Example for an 8-minute script at 140 WPM (~1,120 words):
- Hook: 0:00-0:25, Exposition 1: 0:25-1:45, Transition: 1:45-2:10, Exposition 2: 2:10-3:30, Pivot: 3:30-4:15, Deep Dive: 4:15-5:45, Climax: 5:45-6:30, Example: 6:30-7:20, Conclusion: 7:20-8:00
Notice: unequal intervals, total = 8:00, heavy sections get more time, transitions are short.

WHAT NOT TO DO:
- NEVER start a prompt with "A person" — start with camera distance
- NEVER use "soft dramatic lighting" or "muted warm tones"
- NEVER use same camera distance for consecutive beats
- NEVER use "with a [adjective] expression" — describe micro-actions instead
- NEVER produce more than 2 literal human-subject beats without a metaphorical beat
- NEVER use "a person" or "someone" as the subject. Extract the specific role, character, or context from the script. Examples:
  Instead of "a person looking anxious" → "a remote worker staring at a passive-aggressive Slack message"
  Instead of "a person meditating" → "an exhausted founder in a dark apartment, eyes closed, noise-canceling headphones on"
  Instead of "a person working with an AI tool" → "a content creator watching AI highlight toxic phrases in a glowing email thread"
  The script provides all the context needed. Use the specific scenario, job title, object, or situation described in each section.

Respond ONLY with valid JSON:
{
  "style_anchor": "shot on 35mm film, cinematic, 16:9",
  "beats": [
    {
      "beat_number": 1,
      "section_name": "Hook",
      "timestamp_start": "0:00",
      "timestamp_end": "0:30",
      "visual_description": "Description here",
      "visual_type": "b_roll_image",
      "image_prompt": "Camera-distance-first prompt here, shot on 35mm film, cinematic, 16:9",
      "slide_note": "Opening hook visual"
    }
  ]
}`;

const REFINEMENT_PROMPT = `You are a cinematic quality control editor reviewing a video beat sheet. You have the original script AND the draft beat sheet from Pass 1. Your job is to refine every beat for maximum visual quality and rule compliance.

CHECK AND FIX EACH BEAT:

1. CAMERA DISTANCE CYCLING: No two consecutive beats should use the same camera distance. If they do, change one. Use at least 5 different distances across the beat sheet.

2. SUBJECT SPECIFICITY: Replace every instance of "a person," "someone," or generic subjects with specific roles/characters from the script. Read the script — it tells you exactly who is in each scene and what they're doing.

3. NO DUPLICATE PROMPTS: If two or more beats have substantially similar prompts (same subject + same camera + same lighting), rewrite them to be visually distinct. Each beat must produce a unique frame.

4. TIMESTAMP VERIFICATION:
   - Calculate expected duration from script word count / speaking pace
   - Total of all beat timestamps must equal this calculated duration (±15 seconds)
   - Beats should be unequal in length — hooks are short (15-25s), exposition is longer (60-90s)
   - If total is off, redistribute — do NOT add or remove beats

5. METAPHORICAL RATIO: At least every 3rd-4th beat should use metaphorical/abstract imagery. If the beat sheet is too literal, convert exposition or transition beats to metaphorical visuals.

6. LIGHTING VARIETY: No two beats should have identical lighting descriptions. Diversify with specific directional lighting.

7. COLOR STORY PROGRESSION: Colors should progress through the beat sheet. Flag and fix beats where the color story stalls.

OUTPUT: Return the complete corrected beat sheet in the same JSON format as Pass 1. Every beat must be present — do not drop beats. Only modify the fields that need fixing.`;

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

export async function POST(request: Request) {
  try {
    const { script, wpm, total_minutes } = await request.json();
    if (!script) return Response.json({ error: 'Missing script' }, { status: 400 });

    const email = await getUserEmail();
    const { source } = await resolveApiKey(email);

    if (source === 'credits' && email) await decrementCredits(email);

    const userMsg = `Script to create a beat sheet for (${wpm || 140} WPM, ~${total_minutes || 12} minutes):\n\n${script.trim()}`;

    // Pass 1: Generate draft beat sheet
    const pass1 = await callWithFallback({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMsg },
      ],
      primaryModel: FLASH_MODEL,
      maxTokens: 4000,
      temperature: 0.7,
      jsonMode: true,
    });

    let draftBeats;
    try {
      draftBeats = parseJSON(pass1.content);
    } catch {
      return Response.json({ error: 'Failed to parse draft beat sheet' }, { status: 500 });
    }

    // Pass 2: Refine with script context
    const pass2Msg = `Here is the original script:\n\n${script.trim()}\n\nHere is the draft beat sheet from Pass 1:\n\n${JSON.stringify(draftBeats, null, 2)}\n\nSpeaking pace: ${wpm || 140} WPM, target duration: ~${total_minutes || 12} minutes.\n\nReview and fix every beat according to your instructions. Return the corrected beat sheet.`;

    const pass2 = await callWithFallback({
      messages: [
        { role: 'system', content: REFINEMENT_PROMPT },
        { role: 'user', content: pass2Msg },
      ],
      primaryModel: FLASH_MODEL,
      maxTokens: 4000,
      temperature: 0.5,
      jsonMode: true,
    });

    let finalBeats;
    try {
      finalBeats = parseJSON(pass2.content);
    } catch {
      // If Pass 2 fails to parse, fall back to Pass 1 output
      console.warn('[generate-beats] Pass 2 parse failed, using Pass 1 output');
      finalBeats = draftBeats;
    }

    return Response.json(finalBeats);
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 });
  }
}
