import { callWithFallback } from '@/lib/ai-fallback';
import { resolveApiKey, decrementCredits, getUserEmail } from '@/lib/ai-credits';

const SYSTEM_PROMPT = `You are a YouTube video production planner. Given a finished voiceover script, generate a visual beat sheet.

RULES:
1. Create one beat per major script section or topic shift. 8-15 beats for a standard script.
2. Each beat must include: beat_number, section_name, timestamp_start, timestamp_end, visual_description (2-3 sentences), visual_type (one of: "b_roll_image", "title_card", "screen_recording", "data_viz", "talking_head", "split_screen"), image_prompt (complete AI image generation prompt), slide_note (1 sentence).
3. Image prompts: include subject, composition, style, color palette, lighting, mood, "16:9 aspect ratio". Use a CONSISTENT style anchor. No text in prompts. No copyrighted references. Under 100 words each.
4. Mix visual types — don't make every beat a B-roll image.
5. For demo sections, use "screen_recording" type.

Respond ONLY with valid JSON:
{
  "style_anchor": "cinematic photorealistic, muted warm tones, soft dramatic lighting",
  "beats": [
    {
      "beat_number": 1,
      "section_name": "Hook",
      "timestamp_start": "0:00",
      "timestamp_end": "0:30",
      "visual_description": "Description here",
      "visual_type": "b_roll_image",
      "image_prompt": "Full prompt here, style anchor, 16:9 aspect ratio",
      "slide_note": "Opening hook visual"
    }
  ]
}`;

export async function POST(request: Request) {
  try {
    const { script, wpm, total_minutes } = await request.json();
    if (!script) return Response.json({ error: 'Missing script' }, { status: 400 });

    const email = await getUserEmail();
    const { source } = await resolveApiKey(email);

    // This uses server OpenRouter key, but still costs 1 credit
    if (source === 'credits' && email) await decrementCredits(email);

    const userMsg = `Script to create a beat sheet for (${wpm || 140} WPM, ~${total_minutes || 12} minutes):\n\n${script.trim()}`;

    const result = await callWithFallback({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMsg },
      ],
      primaryModel: 'google/gemini-2.5-flash-lite-preview',
      maxTokens: 4000,
      temperature: 0.7,
      jsonMode: true,
    });

    const raw = result.content;
    const stripped = raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    let parsed;
    try {
      parsed = JSON.parse(stripped);
    } catch {
      const first = raw.indexOf('{');
      const last = raw.lastIndexOf('}');
      if (first !== -1 && last > first) parsed = JSON.parse(raw.slice(first, last + 1));
      else return Response.json({ error: 'Failed to parse beat sheet' }, { status: 500 });
    }

    return Response.json(parsed);
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 });
  }
}
