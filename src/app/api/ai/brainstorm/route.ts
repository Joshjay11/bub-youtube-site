import Anthropic from '@anthropic-ai/sdk';
import { resolveApiKey, decrementCredits, incrementCredits, getUserEmail } from '@/lib/ai-credits';
import { checkSubscriptionAccess } from '@/lib/subscription-check';

const SYSTEM_PROMPT = `You are a YouTube content strategist. The user has a rough idea or topic fragment. Generate exactly 5 specific video concepts based on their input.

For each concept, provide:
- A working title (compelling, with a curiosity gap)
- One sentence describing the angle

Format as JSON array:
[{"title": "...", "angle": "..."}, ...]

Keep titles under 60 characters. Make each angle genuinely different. Not 5 versions of the same idea. At least one should be a contrarian or unexpected take. Return ONLY the JSON array, no other text.`;

export async function POST(request: Request) {
  let creditsCharged = 0;
  let chargedEmail: string | null = null;
  try {
    const { fragment } = await request.json();

    if (!fragment || typeof fragment !== 'string' || !fragment.trim()) {
      return Response.json({ error: 'Missing input' }, { status: 400 });
    }

    const email = await getUserEmail();
    const { allowed: subAllowed, message: subMessage } = await checkSubscriptionAccess(email);
    if (!subAllowed) {
      return Response.json({ error: subMessage, needsSubscription: true }, { status: 403 });
    }
    const { apiKey, source, creditsRemaining } = await resolveApiKey(email);

    if (!apiKey) {
      return Response.json({
        error: 'No AI credits remaining. Add your own Anthropic API key in Settings, or subscribe for more credits.',
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

    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: fragment.trim() }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonStr = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    let ideas: { title: string; angle: string }[];
    try {
      ideas = JSON.parse(jsonStr);
    } catch {
      throw new Error('Failed to parse AI response');
    }

    const newRemaining = source === 'byok' ? -1 : source === 'credits' ? creditsRemaining - 1 : 999;

    return Response.json({ ideas, remaining: newRemaining, source });
  } catch (err) {
    if (creditsCharged > 0 && chargedEmail) {
      await incrementCredits(chargedEmail, creditsCharged).catch((refundErr) => {
        console.error('[brainstorm] refund failed', { email: chargedEmail, refundErr });
      });
    }
    const message = err instanceof Error ? err.message : 'Internal server error';
    return Response.json({ error: message }, { status: 500 });
  }
}
