import Anthropic from '@anthropic-ai/sdk';
import { callWithFallback } from '@/lib/ai-fallback';
import { resolveApiKey, decrementCredits, getUserEmail } from '@/lib/ai-credits';
import { createAdminSupabase } from '@/lib/supabase';

const SYSTEM_PROMPT = `You are a YouTube scriptwriter. Write a complete spoken-word script based on the outline and research provided below.

RULES:
- Write in conversational, spoken English. This will be read aloud, not published as text.
- Target 8th-grade reading level. Short sentences averaging 8-12 words.
- Use the Barstool Test: every line should sound natural if explaining to a smart friend at a bar.
- Include tone markers in parentheses: (conversational), (building tension), (excited reveal), (pause for emphasis), (skeptical), (matter-of-fact).
- Include retention annotations at the 25%, 50%, and 75% marks as comments: <!-- 25% RETENTION CHECK --> etc.
- Plant pattern interrupts every 20-30 seconds — rhetorical questions, surprising data, perspective shifts.
- The hook (first 30 seconds) must deliver on the title promise immediately.
- Place the strongest or most controversial content at the 50% mark.
- End with a clear session hook pointing to a related video topic.
- Do NOT use em dashes. Do NOT use "Let's dive in," "Let's unpack," "In today's," "It's worth noting," "Interestingly," or any AI-tell phrases.
- Do NOT pad for length. Every sentence must earn its place.
- Write ONLY the spoken dialogue. No stage directions, no visual cues — just what the person says into the camera.`;

export async function POST(request: Request) {
  try {
    const { projectId, model } = await request.json();

    if (!projectId || !model) {
      return Response.json({ error: 'Missing projectId or model' }, { status: 400 });
    }

    if (!['sonnet', 'mistral-creative'].includes(model)) {
      return Response.json({ error: 'Invalid model. Must be "sonnet" or "mistral-creative".' }, { status: 400 });
    }

    const email = await getUserEmail();
    const { apiKey, source, creditsRemaining } = await resolveApiKey(email);

    // Only deduct 1 credit per model call (2 total deducted by the frontend calling twice)
    if (!apiKey && source !== 'byok') {
      if (creditsRemaining <= 0) {
        return Response.json({ error: 'No AI credits remaining.', needsUpgrade: true }, { status: 402 });
      }
    }

    // Load project bundle for context
    const admin = createAdminSupabase();
    const { data: rows } = await admin
      .from('project_data')
      .select('tool_key, data')
      .eq('project_id', projectId);

    const bundle: Record<string, Record<string, unknown>> = {};
    for (const row of rows || []) bundle[row.tool_key] = row.data as Record<string, unknown>;

    // Build context
    const parts: string[] = [];
    const ie = bundle.idea_entry as { currentIdea?: string } | undefined;
    if (ie?.currentIdea) parts.push(`TOPIC: ${ie.currentIdea}`);

    const fw = bundle.framing_worksheet as Record<string, string> | undefined;
    if (fw?.oneSentence) parts.push(`THESIS: ${fw.oneSentence}`);
    if (fw?.contrarianAngle) parts.push(`ANGLE: ${fw.contrarianAngle}`);
    if (fw?.emotionalHook) parts.push(`EMOTIONAL HOOK: ${fw.emotionalHook}`);

    const aa = bundle.audience_avatar as Record<string, string> | undefined;
    if (aa?.idealViewer) parts.push(`AUDIENCE: ${aa.idealViewer}`);

    const rk = bundle.research_keeper as { notes?: string } | undefined;
    if (rk?.notes?.trim()) parts.push(`RESEARCH FINDINGS:\n${rk.notes.trim().slice(0, 1500)}`);

    // Get outline and hook from AI prompts picks/kept
    const aps = bundle.ai_prompts_state as { picks?: Record<string, string>; kept?: Record<string, string> } | undefined;
    const outline = aps?.picks?.['3d'] || aps?.kept?.['3d'] || '';
    const hook = (bundle.hook_draft as { draft?: string } | undefined)?.draft || aps?.picks?.['3e'] || aps?.kept?.['3e'] || '';
    const counterArgs = aps?.picks?.['3c'] || aps?.kept?.['3c'] || '';
    const crossDisc = aps?.picks?.['3b'] || aps?.kept?.['3b'] || '';

    if (outline) parts.push(`OUTLINE:\n${outline}`);
    if (hook) parts.push(`SELECTED HOOK:\n${hook}`);
    if (counterArgs) parts.push(`COUNTER-ARGUMENTS TO ADDRESS:\n${counterArgs}`);
    if (crossDisc) parts.push(`CROSS-DISCIPLINARY CONNECTION:\n${crossDisc}`);

    parts.push(`\nTARGET LENGTH: approximately 1800 words (12 minutes at 150 WPM)`);
    parts.push(`\nWrite the complete script now.`);

    const userMessage = parts.join('\n\n');

    if (source === 'credits' && email) {
      await decrementCredits(email);
    }

    let scriptText: string;

    if (model === 'sonnet') {
      const anthropicKey = apiKey || process.env.ANTHROPIC_API_KEY;
      if (!anthropicKey) {
        return Response.json({ error: 'Anthropic API not configured' }, { status: 503 });
      }
      const client = new Anthropic({ apiKey: anthropicKey });
      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      });
      scriptText = response.content[0].type === 'text' ? response.content[0].text : '';
    } else {
      // Mistral Small Creative via OpenRouter with fallback
      const result = await callWithFallback({
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
        primaryModel: 'mistralai/mistral-small-3.1-24b-instruct',
        maxTokens: 4000,
        temperature: 0.8,
      });
      scriptText = result.content;
    }

    const wordCount = scriptText.trim().split(/\s+/).length;

    return Response.json({
      script: scriptText,
      model,
      wordCount,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return Response.json({ error: message }, { status: 500 });
  }
}
