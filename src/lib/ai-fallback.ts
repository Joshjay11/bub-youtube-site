export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIFallbackOptions {
  messages: AIMessage[];
  primaryModel: string;
  fallbackModel?: string;
  maxTokens?: number;
  temperature?: number;
  jsonMode?: boolean;
}

interface AIResponse {
  content: string;
  provider: 'openrouter' | 'deepinfra';
  model: string;
}

async function callProvider(
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: AIMessage[],
  maxTokens: number,
  temperature: number,
  jsonMode: boolean,
  signal?: AbortSignal,
): Promise<string> {
  const body: Record<string, unknown> = {
    model,
    messages,
    max_tokens: maxTokens,
    temperature,
  };
  if (jsonMode) body.response_format = { type: 'json_object' };

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  if (baseUrl.includes('openrouter')) {
    headers['HTTP-Referer'] = 'https://youtube.bubwriter.com';
    headers['X-Title'] = 'BUB Script System';
  }

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

export async function callWithFallback(options: AIFallbackOptions): Promise<AIResponse> {
  const {
    messages,
    primaryModel,
    fallbackModel = 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    maxTokens = 2000,
    temperature = 0.7,
    jsonMode = false,
  } = options;

  // Primary: OpenRouter
  const orKey = process.env.OPENROUTER_API_KEY;
  if (orKey) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const content = await callProvider(
        'https://openrouter.ai/api/v1',
        orKey,
        primaryModel,
        messages,
        maxTokens,
        temperature,
        jsonMode,
        controller.signal,
      );

      clearTimeout(timeout);
      console.log(`[ai-fallback] OpenRouter success: ${primaryModel}`);
      return { content, provider: 'openrouter', model: primaryModel };
    } catch (err) {
      console.warn(`[ai-fallback] OpenRouter failed (${primaryModel}):`, err instanceof Error ? err.message : err);
    }
  }

  // Fallback: DeepInfra
  const diKey = process.env.DEEPINFRA_API_KEY;
  if (!diKey) {
    throw new Error('Both OpenRouter and DeepInfra unavailable');
  }

  try {
    const content = await callProvider(
      'https://api.deepinfra.com/v1/openai',
      diKey,
      fallbackModel,
      messages,
      maxTokens,
      temperature,
      jsonMode,
    );

    console.log(`[ai-fallback] DeepInfra fallback success: ${fallbackModel}`);
    return { content, provider: 'deepinfra', model: fallbackModel };
  } catch (err) {
    console.error(`[ai-fallback] DeepInfra fallback also failed:`, err instanceof Error ? err.message : err);
    throw new Error('All AI providers failed');
  }
}
