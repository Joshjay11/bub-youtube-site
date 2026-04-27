import { callOpenRouter } from '@/lib/openrouter';
import { decrementCredits, incrementCredits, getUserEmail, resolveApiKey } from '@/lib/ai-credits';
import { checkSubscriptionAccess } from '@/lib/subscription-check';

const PROMPT_TEMPLATE = `You are a YouTube script architect. Given the following video brief, create a section-by-section outline for the script.

The script should follow this structure:
- Hook (0-30 seconds): attention grab + value promise + stakes
- Context Bridge (30s-1min): just enough context for the first point to land
- Micro-Act 1 (1-3:30): establish the core idea, deliver the first reward
- 35% Pivot (3:30-4:30): introduce the surprising angle or contradiction
- Micro-Act 2 (4:30-7:00): deepen with evidence, scatter mini-payoffs
- Escalation (7:00-9:30): highest energy, build to climax
- Grand Payoff (9:30-11:00): resolve all open loops
- Session Hook + CTA (11:00-12:00): bridge to next video

For each section, provide:
- A one-line description of what this section covers
- 2-3 bullet points of specific content to include (pulled from the brief)
- Suggested transition to the next section

Respond ONLY with JSON:
{
  "sections": [
    {
      "key": "hook",
      "name": "Hook",
      "description": "...",
      "bullets": ["...", "..."],
      "transition": "..."
    }
  ]
}

Use these exact keys for sections: hook, contextBridge, microAct1, pivot, microAct2, escalation, grandPayoff, sessionHook

VIDEO BRIEF:
`;

export async function POST(request: Request) {
  let creditsCharged = 0;
  let chargedEmail: string | null = null;
  try {
    const { brief } = await request.json();

    if (!brief || typeof brief !== 'string' || !brief.trim()) {
      return Response.json({ error: 'Missing brief' }, { status: 400 });
    }

    const email = await getUserEmail();
    const { allowed: subAllowed, message: subMessage } = await checkSubscriptionAccess(email);
    if (!subAllowed) {
      return Response.json({ error: subMessage, needsSubscription: true }, { status: 403 });
    }
    const { source, creditsRemaining } = await resolveApiKey(email);

    if (!source && creditsRemaining <= 0) {
      return Response.json({
        error: 'No AI credits remaining.',
        needsUpgrade: true,
      }, { status: 402 });
    }

    if (source === 'credits' && email) {
      const remaining = await decrementCredits(email);
      if (remaining === null) {
        return Response.json({ error: 'Insufficient credits.', needsUpgrade: true }, { status: 402 });
      }
      creditsCharged = 1;
      chargedEmail = email;
    }

    const prompt = PROMPT_TEMPLATE + brief.trim();

    let responseText: string;
    try {
      responseText = await callOpenRouter(prompt);
    } catch (orError) {
      const Anthropic = (await import('@anthropic-ai/sdk')).default;
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) throw orError;

      const client = new Anthropic({ apiKey });
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      });
      responseText = response.content[0].type === 'text' ? response.content[0].text : '';
    }

    const jsonStr = responseText.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    let parsed: { sections: Array<{ key: string; name: string; description: string; bullets: string[]; transition: string }> };
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      throw new Error('Failed to parse outline');
    }

    const newRemaining = source === 'byok' ? -1 : source === 'credits' ? creditsRemaining - 1 : 999;

    return Response.json({ outline: parsed.sections, remaining: newRemaining });
  } catch (err) {
    if (creditsCharged > 0 && chargedEmail) {
      await incrementCredits(chargedEmail, creditsCharged).catch((refundErr) => {
        console.error('[compile-outline] refund failed', { email: chargedEmail, refundErr });
      });
    }
    const message = err instanceof Error ? err.message : 'Internal server error';
    return Response.json({ error: message }, { status: 500 });
  }
}
