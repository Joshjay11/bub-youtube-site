import Anthropic from '@anthropic-ai/sdk';
import { createServerSupabase } from '@/lib/supabase';

// Simple XOR deobfuscation matching the settings route
function deobfuscate(encoded: string): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || 'fallback-key';
  const bytes = Buffer.from(encoded, 'base64');
  return bytes.map((b, i) => b ^ key.charCodeAt(i % key.length)).reduce((s, b) => s + String.fromCharCode(b), '');
}

async function resolveApiKey(email: string | null): Promise<{
  apiKey: string | null;
  source: 'byok' | 'credits' | 'platform' | null;
  creditsRemaining: number;
}> {
  // If no Supabase configured (local dev), use platform key
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !email) {
    return { apiKey: process.env.ANTHROPIC_API_KEY || null, source: 'platform', creditsRemaining: 999 };
  }

  const supabase = createServerSupabase();

  // 1. Check BYOK key
  const { data: settings } = await supabase
    .from('user_settings')
    .select('anthropic_api_key_encrypted')
    .eq('email', email)
    .single();

  if (settings?.anthropic_api_key_encrypted) {
    const byokKey = deobfuscate(settings.anthropic_api_key_encrypted);
    if (byokKey.startsWith('sk-ant-')) {
      return { apiKey: byokKey, source: 'byok', creditsRemaining: -1 };
    }
  }

  // 2. Check credits
  const { data: purchase } = await supabase
    .from('purchases')
    .select('ai_credits_remaining')
    .eq('email', email)
    .single();

  const remaining = purchase?.ai_credits_remaining ?? 0;
  if (remaining > 0) {
    return { apiKey: process.env.ANTHROPIC_API_KEY || null, source: 'credits', creditsRemaining: remaining };
  }

  // 3. No key, no credits
  return { apiKey: null, source: null, creditsRemaining: 0 };
}

async function decrementCredits(email: string) {
  const supabase = createServerSupabase();
  // Use raw SQL decrement via RPC, or just read-update
  const { data } = await supabase
    .from('purchases')
    .select('ai_credits_remaining')
    .eq('email', email)
    .single();

  if (data && data.ai_credits_remaining > 0) {
    await supabase
      .from('purchases')
      .update({ ai_credits_remaining: data.ai_credits_remaining - 1 })
      .eq('email', email);
  }
}

async function getUserEmail(): Promise<string | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.email || null;
}

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

    // Decrement credits after starting stream (only for credit-based usage)
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
  const { source, creditsRemaining } = await resolveApiKey(email);

  return Response.json({
    remaining: source === 'byok' ? -1 : creditsRemaining,
    source: source || 'none',
    hasByok: source === 'byok',
  });
}
