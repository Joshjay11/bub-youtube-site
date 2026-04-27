import { buildSystemPrompt } from '@/lib/thinking-partner-prompts';
import { getUserEmail } from '@/lib/ai-credits';
import { checkSubscriptionAccess } from '@/lib/subscription-check';
import { rateLimit } from '@/lib/rate-limit';

const MAX_MESSAGES_PER_DAY = 50;
const WINDOW_SECONDS = 24 * 60 * 60;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, stage, history } = body;

    if (!message || typeof message !== 'string') {
      return Response.json({ error: 'Missing message' }, { status: 400 });
    }

    const email = await getUserEmail();
    const { allowed: subAllowed, message: subMessage } = await checkSubscriptionAccess(email);
    if (!subAllowed) {
      return Response.json({ error: subMessage, needsSubscription: true }, { status: 403 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'Thinking Partner not configured' }, { status: 503 });
    }

    // Rate limit by authenticated email when available, fall back to IP.
    const identifier = email
      ? `user:${email.toLowerCase()}`
      : `ip:${request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anonymous'}`;
    const rl = await rateLimit(`rl:thinking-partner:${identifier}`, MAX_MESSAGES_PER_DAY, WINDOW_SECONDS);
    if (!rl.allowed) {
      return Response.json(
        { error: `Daily message limit reached (${MAX_MESSAGES_PER_DAY}/day).`, remaining: 0 },
        {
          status: 429,
          headers: { 'Retry-After': String(rl.retryAfterSeconds) },
        },
      );
    }
    const remaining = rl.remaining;

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
        model: 'google/gemini-3-flash-preview',
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
