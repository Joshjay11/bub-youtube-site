import Anthropic from '@anthropic-ai/sdk';
import { resolveApiKey, decrementCredits, getUserEmail } from '@/lib/ai-credits';
import { createAdminSupabase } from '@/lib/supabase';

const SYSTEM_PROMPT = `You are a YouTube hook evaluator. Score this hook against 10 criteria. Be honest and specific.

The 10 criteria (1 point each, max 10):
1. Opens mid-action or mid-thought (NOT "Hey guys", "In this video", or any generic intro)
2. Creates a SPECIFIC curiosity gap (not a vague one — the viewer must need to know what happens next)
3. Contains a number, name, or concrete detail (specificity = credibility)
4. Makes a promise the video actually keeps (based on the video concept provided)
5. Excludes people who wouldn't like this video (qualified viewers, not everyone)
6. Avoids starting with "I" or "So" (these are weak openers)
7. Creates stakes — why should the viewer care RIGHT NOW?
8. Is under 90 words
9. Matches the title/thumbnail promise (based on the video concept provided)
10. Would make YOU stop scrolling if someone else said it (the gut check)

For each criterion, respond with:
- Score: 1 (passes) or 0 (fails)
- Reasoning: One sentence explaining why it passed or failed
- Fix (only if score is 0): One sentence suggesting how to fix it

Respond ONLY with a JSON object:
{"scores":[{"criterion":1,"score":1,"reasoning":"...","fix":null},...],"total":7,"summary":"One sentence overall assessment."}`;

export async function POST(request: Request) {
  try {
    const { hookText, projectId } = await request.json();

    if (!hookText || typeof hookText !== 'string' || !hookText.trim()) {
      return Response.json({ error: 'Missing hook text' }, { status: 400 });
    }

    const email = await getUserEmail();
    const { apiKey, source, creditsRemaining } = await resolveApiKey(email);

    if (!apiKey) {
      return Response.json({ error: 'No AI credits remaining.', needsUpgrade: true }, { status: 402 });
    }

    // Load upstream context for criteria like "matches title/thumbnail promise"
    let context = '';
    if (projectId) {
      const admin = createAdminSupabase();
      const { data: rows } = await admin
        .from('project_data')
        .select('tool_key, data')
        .eq('project_id', projectId);

      if (rows) {
        const parts: string[] = [];
        for (const row of rows) {
          const d = row.data as Record<string, unknown>;
          if (row.tool_key === 'idea_entry' && d.currentIdea) parts.push(`Video idea: ${d.currentIdea}`);
          if (row.tool_key === 'framing_worksheet') {
            if (d.oneSentence) parts.push(`Thesis: ${d.oneSentence}`);
            if (d.contrarianAngle) parts.push(`Angle: ${d.contrarianAngle}`);
          }
          if (row.tool_key === 'audience_avatar' && d.idealViewer) parts.push(`Audience: ${d.idealViewer}`);
        }
        context = parts.join('\n');
      }
    }

    if (source === 'credits' && email) {
      await decrementCredits(email);
    }

    const client = new Anthropic({ apiKey });

    const userMessage = context
      ? `Video context:\n${context}\n\nHook to evaluate:\n"${hookText.trim()}"`
      : `Hook to evaluate:\n"${hookText.trim()}"`;

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    console.log('[score-hook] Raw response:', text.slice(0, 300));

    // Defensive parsing
    let parsed: { scores: Array<{ criterion: number; score: number; reasoning: string; fix: string | null }>; total: number; summary: string };
    const stripped = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();

    try {
      parsed = JSON.parse(stripped);
    } catch {
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        try {
          parsed = JSON.parse(text.slice(firstBrace, lastBrace + 1));
        } catch {
          return Response.json({ error: 'Failed to parse hook score', raw: text.slice(0, 300) }, { status: 500 });
        }
      } else {
        return Response.json({ error: 'Failed to parse hook score', raw: text.slice(0, 300) }, { status: 500 });
      }
    }

    const newRemaining = source === 'byok' ? -1 : source === 'credits' ? creditsRemaining - 1 : 999;

    return Response.json({
      evaluation: parsed,
      remaining: newRemaining,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return Response.json({ error: message }, { status: 500 });
  }
}
