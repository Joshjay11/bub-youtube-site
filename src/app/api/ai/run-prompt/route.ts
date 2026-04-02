import Anthropic from '@anthropic-ai/sdk';
import { resolveApiKey, decrementCredits, getUserEmail } from '@/lib/ai-credits';
import { checkSubscriptionAccess } from '@/lib/subscription-check';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt, user_id } = body;

    if (!prompt || typeof prompt !== 'string') {
      return Response.json({ error: 'Missing or invalid prompt' }, { status: 400 });
    }

    const email = await getUserEmail() || user_id || null;
    const { apiKey, source, creditsRemaining } = await resolveApiKey(email);

    if (!apiKey) {
      return Response.json({
        error: 'No AI credits remaining. Add your own Anthropic API key in Settings, or subscribe for more credits.',
        remaining: 0,
        needsUpgrade: true,
      }, { status: 402 });
    }

    const client = new Anthropic({ apiKey });

    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    if (source === 'credits' && email) {
      await decrementCredits(email);
    }

    const newRemaining = source === 'byok' ? -1 : source === 'credits' ? creditsRemaining - 1 : 999;

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'meta', remaining: newRemaining, source })}\n\n`)
          );

          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'text', text: event.delta.text })}\n\n`)
              );
            }
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
          controller.close();
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Stream error';
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', error: message })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  const email = await getUserEmail();
  const { allowed: subAllowed, message: subMessage } = await checkSubscriptionAccess(email);
  if (!subAllowed) {
    return Response.json({ error: subMessage, needsSubscription: true }, { status: 403 });
  }
  const { source, creditsRemaining } = await resolveApiKey(email);

  return Response.json({
    remaining: source === 'byok' ? -1 : creditsRemaining,
    source: source || 'none',
    hasByok: source === 'byok',
  });
}
