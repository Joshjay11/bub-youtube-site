import Anthropic from '@anthropic-ai/sdk';
import { resolveApiKey, decrementCredits, getUserEmail } from '@/lib/ai-credits';
import { checkSubscriptionAccess } from '@/lib/subscription-check';

const SYSTEM_PROMPT = `You are a YouTube content strategist evaluating a video idea. Score this idea on exactly 9 criteria, each rated 1-5. Be honest and critical. Do not inflate scores.

The criteria:
1. Curiosity. Would a stranger click this? (1: Generic topic, no surprise. 5: Specific claim that demands an answer)
2. Audience Relevance. Does the creator's audience need this? (1: Tangentially related. 5: They're asking for this in comments)
3. Novelty. Has this angle been done to death? (1: 10 videos with this exact take exist. 5: Nobody has approached it this way)
4. Proof Available. Can you back it up? (1: Opinion only, no data. 5: Studies, examples, receipts)
5. Emotional Tension. Does it create a feeling? (1: Pure information transfer. 5: Makes them angry, hopeful, or curious)
6. Title Potential. Can you write a title with a knowledge gap? (1: Descriptive but flat. 5: You'd click it yourself)
7. Thumbnail Potential. Can you make a thumb that stops scrolling? (1: Text-heavy, no visual hook. 5: Clear visual concept, high contrast)
8. Satisfaction Potential. Will viewers feel the video delivered? (1: Vague payoff, lots of filler. 5: Crystal clear delivery on promise)
9. Production Feasibility. Can you actually make this? (1: Requires assets you don't have. 5: Fully within your capability)

Respond ONLY with a JSON object, no other text:
{"scores": [{"criterion": "Curiosity", "score": 4, "reason": "one sentence why"}, {"criterion": "Audience Relevance", "score": 3, "reason": "..."}, ...]}`;

export async function POST(request: Request) {
  try {
    const { idea } = await request.json();

    if (!idea || typeof idea !== 'string' || !idea.trim()) {
      return Response.json({ error: 'Missing idea' }, { status: 400 });
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

    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `The video idea to evaluate: ${idea.trim()}` }],
    });

    if (source === 'credits' && email) {
      await decrementCredits(email);
    }

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonStr = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();

    let parsed: { scores: { criterion: string; score: number; reason: string }[] };
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      return Response.json({ error: 'Failed to parse AI response', raw: text }, { status: 500 });
    }

    const newRemaining = source === 'byok' ? -1 : source === 'credits' ? creditsRemaining - 1 : 999;

    return Response.json({ aiScores: parsed.scores, remaining: newRemaining, source });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return Response.json({ error: message }, { status: 500 });
  }
}
