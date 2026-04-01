import Anthropic from '@anthropic-ai/sdk';
import { resolveApiKey, decrementCredits, getUserEmail } from '@/lib/ai-credits';

const SYSTEM_PROMPT = `You are a YouTube retention engineer auditing a script for structural quality.

You will evaluate the script against 10 MUST PASS criteria. For each criterion, determine if the script passes or fails.

THE 10 MUST PASS CRITERIA:
1. Hook delivers on title/thumbnail promise within 30 seconds
2. Zero throat-clearing sentences in first 15 seconds (no "Hey guys," "So today," "Welcome back," or any generic intro)
3. At least 2 unresolved questions planted in first 90 seconds
4. Clear reframe at roughly the 1/3 mark (the 35% Pivot)
5. Strongest or most controversial content is at the 50% mark, NOT the end
6. Read the entire script aloud without stumbling (no sentences that would cause a reader to trip)
7. Every sentence passes the barstool test (conversational, not academic)
8. No AI filler: "truly," "essentially," "it's worth noting," "dive in," "without further ado"
9. All open loops resolved by the end
10. Session hook to a SPECIFIC next video at the end

For EACH criterion, provide:
1. "pass" or "fail"
2. A specific explanation (2-3 sentences) referencing actual lines, sections, or approximate timestamps from the script. Do NOT give vague assessments. Point to the exact evidence.
3. For failed items: a concrete, actionable suggestion for how to fix it.

Be honest. If something barely passes, say it passes but note the weakness. If something clearly fails, say so directly.

Respond ONLY with valid JSON:
{
  "results": [
    {
      "criterion": "Hook delivers on title/thumbnail promise within 30 seconds",
      "status": "pass",
      "explanation": "The opening line directly addresses...",
      "suggestion": null
    }
  ]
}`;

export async function POST(request: Request) {
  try {
    const { scriptText } = await request.json();

    if (!scriptText || typeof scriptText !== 'string' || !scriptText.trim()) {
      return Response.json({ error: 'Missing script text' }, { status: 400 });
    }

    const email = await getUserEmail();
    const { apiKey, source } = await resolveApiKey(email);

    if (!apiKey) {
      return Response.json({ error: 'No AI credits remaining.', needsUpgrade: true }, { status: 402 });
    }

    if (source === 'credits' && email) {
      await decrementCredits(email);
    }

    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Audit this script:\n\n${scriptText.trim()}` }],
    });

    const raw = response.content[0].type === 'text' ? response.content[0].text : '';
    console.log('[retention-audit] Response length:', raw.length);

    // Defensive JSON parsing
    const stripped = raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    let parsed;
    try {
      parsed = JSON.parse(stripped);
    } catch {
      const first = raw.indexOf('{');
      const last = raw.lastIndexOf('}');
      if (first !== -1 && last > first) {
        parsed = JSON.parse(raw.slice(first, last + 1));
      } else {
        return Response.json({ error: 'Failed to parse audit response', raw: raw.slice(0, 300) }, { status: 500 });
      }
    }

    return Response.json({ audit: parsed });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return Response.json({ error: message }, { status: 500 });
  }
}
