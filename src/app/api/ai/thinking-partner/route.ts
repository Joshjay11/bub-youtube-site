import { buildSystemPrompt } from '@/lib/thinking-partner-prompts';

// In-memory rate limiter (per-process)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const MAX_MESSAGES_PER_DAY = 50;

function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  if (!entry || now >= entry.resetAt) {
    const tomorrow = new Date();
    tomorrow.setUTCHours(24, 0, 0, 0);
    rateLimitMap.set(userId, { count: 1, resetAt: tomorrow.getTime() });
    return { allowed: true, remaining: MAX_MESSAGES_PER_DAY - 1 };
  }

  if (entry.count >= MAX_MESSAGES_PER_DAY) {
    return { allowed: false, remaining: 0 };
  }

  entry.count += 1;
  return { allowed: true, remaining: MAX_MESSAGES_PER_DAY - entry.count };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, stage, history } = body;

    if (!message || typeof message !== 'string') {
      return Response.json({ error: 'Missing message' }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'Thinking Partner not configured' }, { status: 503 });
    }

    // Rate limit by IP (in production, use auth user ID)
    const identifier = request.headers.get('x-forwarded-for') || 'anonymous';
    const { allowed, remaining } = checkRateLimit(identifier);
    if (!allowed) {
      return Response.json(
        { error: 'Daily message limit reached (50/day). Resets at midnight UTC.', remaining: 0 },
        { status: 429 },
      );
    }

    const systemPrompt = buildSystemPrompt(stage || 'reference');

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(Array.isArray(history) ? history.slice(-20) : []), // Keep last 20 messages for context
      { role: 'user', content: message },
    ];

    const orResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://youtube.bubwriter.com',
        'X-Title': 'BUB YouTube Writer',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite-preview',
        messages,
        stream: true,
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!orResponse.ok) {
      const errText = await orResponse.text();
      return Response.json({ error: `AI service error: ${orResponse.status}`, detail: errText }, { status: 502 });
    }

    // Stream the OpenRouter SSE response through to the client
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          // Send meta event first
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'meta', remaining })}\n\n`)
          );

          const reader = orResponse.body?.getReader();
          if (!reader) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: 'No response body' })}\n\n`));
            controller.close();
            return;
          }

          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              const payload = line.slice(6).trim();

              if (payload === '[DONE]') {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
                continue;
              }

              try {
                const chunk = JSON.parse(payload);
                const token = chunk.choices?.[0]?.delta?.content;
                if (token) {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ type: 'text', text: token })}\n\n`)
                  );
                }
              } catch {
                // Skip malformed chunks
              }
            }
          }

          // Ensure we send done even if [DONE] wasn't in the stream
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
          controller.close();
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Stream error';
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: msg })}\n\n`));
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
