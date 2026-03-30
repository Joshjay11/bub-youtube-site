import Anthropic from '@anthropic-ai/sdk';
import { resolveApiKey, decrementCredits, getUserEmail } from '@/lib/ai-credits';

const SYSTEM_PROMPT = `You are three legendary editors sharing one body. Each brings a distinct editorial blade:

HEMINGWAY (The Butcher): Cuts every unnecessary word. Hates adverbs, passive voice, and throat-clearing. If a sentence can be shorter, it must be. "The first draft of anything is shit." Every word must earn its place.

ASIMOV (The Architect): Obsessed with structural clarity. Every paragraph should follow logically from the last. Complex ideas must be explained so simply that a smart teenager gets it. Transitions should be invisible.

BUKOWSKI (The Authenticity Detector): Sniffs out fake voice, performative writing, and AI-generated slop. If it sounds like it was written to impress rather than communicate, flag it. Real writing sounds like a real person talking.

CRITICAL: Detect and flag these AI-tell phrases: "Let's dive in", "It's worth noting", "Interestingly", "In today's world", "Let's unpack", "Without further ado", "At the end of the day", "Game-changer", "Revolutionize", "Leverage", "Utilize", "Facilitate", "Essentially", "Basically", "Truly", "In this video", "Hey guys", "What's up".

For EACH issue found, provide:
- type: "hemingway" | "asimov" | "bukowski" | "ai-tell"
- original: the exact text with the problem
- suggestion: the fixed version
- reason: one sentence why this change matters

Respond ONLY with JSON:
{
  "summary": "2-3 sentence overall assessment",
  "issues": [
    {"type": "hemingway", "original": "...", "suggestion": "...", "reason": "..."},
    ...
  ],
  "edited_text": "The full text with ALL suggested edits applied",
  "stats": {
    "words_original": 0,
    "words_edited": 0,
    "words_cut": 0,
    "cut_percentage": 0,
    "ai_tells_found": 0,
    "readability_grade": "8th grade"
  }
}`;

export async function POST(request: Request) {
  try {
    const { text, editor } = await request.json();

    if (!text || typeof text !== 'string' || !text.trim()) {
      return Response.json({ error: 'Missing text' }, { status: 400 });
    }

    const email = await getUserEmail();
    const { apiKey, source } = await resolveApiKey(email);

    if (!apiKey) {
      return Response.json({ error: 'No AI credits remaining.', needsUpgrade: true }, { status: 402 });
    }

    if (source === 'credits' && email) {
      await decrementCredits(email);
    }

    let contextNote = 'Use all three editorial blades. Tag each issue with which editor caught it.';
    if (editor === 'hemingway') contextNote = "Focus primarily on Hemingway's editorial approach, but note issues the others would catch too.";
    if (editor === 'asimov') contextNote = "Focus primarily on Asimov's editorial approach, but note issues the others would catch too.";
    if (editor === 'bukowski') contextNote = "Focus primarily on Bukowski's editorial approach, but note issues the others would catch too.";

    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `${contextNote}\n\nAnalyze and edit this text:\n\n${text.trim()}` }],
    });

    const raw = response.content[0].type === 'text' ? response.content[0].text : '';
    console.log('[editors-table] Raw response length:', raw.length);

    // Defensive JSON parsing
    const stripped = raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    let parsed;
    try {
      parsed = JSON.parse(stripped);
    } catch {
      const first = raw.indexOf('{');
      const last = raw.lastIndexOf('}');
      if (first !== -1 && last > first) {
        try {
          parsed = JSON.parse(raw.slice(first, last + 1));
        } catch {
          return Response.json({ error: 'Failed to parse editor response', raw: raw.slice(0, 300) }, { status: 500 });
        }
      } else {
        return Response.json({ error: 'Failed to parse editor response', raw: raw.slice(0, 300) }, { status: 500 });
      }
    }

    return Response.json({ result: parsed });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return Response.json({ error: message }, { status: 500 });
  }
}
