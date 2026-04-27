import { callWithFallback } from '@/lib/ai-fallback';
import { resolveApiKey, decrementCredits, incrementCredits, getUserEmail } from '@/lib/ai-credits';
import { checkSubscriptionAccess } from '@/lib/subscription-check';

const SYSTEM_PROMPT = `You are a research assistant for a YouTube video creator. Provide specific, factual, interesting findings. Focus on novel angles and surprising information that would make a video stand out. Be concise and specific. No filler. Cite sources where possible. Respond in plain text paragraphs, not JSON.`;

const QUERIES = [
  (topic: string) => `What is commonly misunderstood about ${topic}? Give 3-4 specific misconceptions with the reality.`,
  (topic: string) => `What do experts disagree about regarding ${topic}? Name specific experts or camps of thought and their positions.`,
  (topic: string) => `What surprising connections exist between ${topic} and other fields? Find cross-disciplinary angles from psychology, economics, history, biology, or other unexpected areas.`,
  (topic: string) => `What has recently changed or been discovered about ${topic}? Focus on developments from the last 1-2 years.`,
  (topic: string) => `What questions do people asking about ${topic} not think to ask? What are the second-order questions that reveal deeper understanding?`,
];

const ANGLE_LABELS = [
  'Common Misconceptions',
  'Expert Disagreements',
  'Cross-Disciplinary Connections',
  'Recent Developments',
  'Questions Nobody Asks',
];

export async function POST(request: Request) {
  let creditsCharged = 0;
  let chargedEmail: string | null = null;
  try {
    const { topic } = await request.json();

    if (!topic || typeof topic !== 'string' || !topic.trim()) {
      return Response.json({ error: 'Missing topic' }, { status: 400 });
    }

    const email = await getUserEmail();
    const { allowed: subAllowed, message: subMessage } = await checkSubscriptionAccess(email);
    if (!subAllowed) {
      return Response.json({ error: subMessage, needsSubscription: true }, { status: 403 });
    }
    const { source, creditsRemaining } = await resolveApiKey(email);

    if (!source && creditsRemaining <= 0) {
      return Response.json({ error: 'No AI credits remaining.', needsUpgrade: true }, { status: 402 });
    }

    if (source === 'credits' && email) {
      const remaining = await decrementCredits(email);
      if (remaining === null) {
        return Response.json({ error: 'Insufficient credits.', needsUpgrade: true }, { status: 402 });
      }
      creditsCharged = 1;
      chargedEmail = email;
    }

    const results = await Promise.allSettled(
      QUERIES.map((queryFn, i) =>
        callWithFallback({
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: queryFn(topic.trim()) },
          ],
          primaryModel: 'perplexity/sonar',
          fallbackModel: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
          maxTokens: 800,
          temperature: 0.5,
          jsonMode: false,
        }).then((res) => ({
          angle: ANGLE_LABELS[i],
          findings: res.content,
          provider: res.provider,
        }))
      )
    );

    const fulfilledCount = results.filter((r) => r.status === 'fulfilled').length;
    if (fulfilledCount === 0) {
      throw new Error('All research queries failed');
    }

    const research = results.map((r, i) => {
      if (r.status === 'fulfilled') return r.value;
      return { angle: ANGLE_LABELS[i], findings: `Research failed for this angle: ${r.reason}`, provider: 'none' };
    });

    const newRemaining = source === 'byok' ? -1 : source === 'credits' ? creditsRemaining - 1 : 999;

    return Response.json({ research, remaining: newRemaining });
  } catch (err) {
    if (creditsCharged > 0 && chargedEmail) {
      await incrementCredits(chargedEmail, creditsCharged).catch((refundErr) => {
        console.error('[topic-research] refund failed', { email: chargedEmail, refundErr });
      });
    }
    const message = err instanceof Error ? err.message : 'Internal server error';
    return Response.json({ error: message }, { status: 500 });
  }
}
