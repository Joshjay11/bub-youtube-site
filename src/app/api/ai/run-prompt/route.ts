import Anthropic from '@anthropic-ai/sdk';

// In-memory rate limiter (per-process; swap for Redis/Supabase in production)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const MAX_RUNS_PER_DAY = 20;

function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  if (!entry || now >= entry.resetAt) {
    // New window: midnight UTC rollover
    const tomorrow = new Date();
    tomorrow.setUTCHours(24, 0, 0, 0);
    rateLimitMap.set(userId, { count: 1, resetAt: tomorrow.getTime() });
    return { allowed: true, remaining: MAX_RUNS_PER_DAY - 1 };
  }

  if (entry.count >= MAX_RUNS_PER_DAY) {
    return { allowed: false, remaining: 0 };
  }

  entry.count += 1;
  return { allowed: true, remaining: MAX_RUNS_PER_DAY - entry.count };
}

function getRemainingRuns(userId: string): number {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now >= entry.resetAt) return MAX_RUNS_PER_DAY;
  return Math.max(0, MAX_RUNS_PER_DAY - entry.count);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt, user_id } = body;

    if (!prompt || typeof prompt !== 'string') {
      return Response.json({ error: 'Missing or invalid prompt' }, { status: 400 });
    }

    // Use user_id or fall back to IP-based identification
    // In production, this would verify against Supabase auth
    const identifier = user_id || request.headers.get('x-forwarded-for') || 'anonymous';

    const { allowed, remaining } = checkRateLimit(identifier);
    if (!allowed) {
      return Response.json(
        { error: 'Daily limit reached. You can run 20 AI prompts per day. Resets at midnight UTC.', remaining: 0 },
        { status: 429 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'AI service not configured' }, { status: 503 });
    }

    const client = new Anthropic({ apiKey });

    // Stream the response using SSE
    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    // Create a ReadableStream that emits SSE events
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          // Send remaining count as first event
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'meta', remaining })}\n\n`)
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

// GET endpoint to check remaining runs without consuming one
export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get('user_id') || request.headers.get('x-forwarded-for') || 'anonymous';
  const remaining = getRemainingRuns(userId);
  return Response.json({ remaining, limit: MAX_RUNS_PER_DAY });
}
