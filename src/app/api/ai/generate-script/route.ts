import Anthropic from '@anthropic-ai/sdk';
import { callWithFallback } from '@/lib/ai-fallback';
import { resolveApiKey, decrementCredits, getUserEmail } from '@/lib/ai-credits';
import { createAdminSupabase } from '@/lib/supabase';
import { buildSystemPrompt, VALID_STYLES } from '@/lib/script-prompts';

const VALID_MODELS = ['sonnet', 'minimax', 'grok'] as const;

const OPENROUTER_MODELS: Record<string, string> = {
  minimax: 'minimax/minimax-m2.5',
  grok: 'x-ai/grok-4.1-fast',
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectId, model, targetWords: tw, style: rawStyle, targetMinutes: tm, wpm: rawWpm } = body;

    if (!projectId || !model) {
      return Response.json({ error: 'Missing projectId or model' }, { status: 400 });
    }

    if (!(VALID_MODELS as readonly string[]).includes(model)) {
      return Response.json({ error: 'Invalid model.' }, { status: 400 });
    }

    const style = (VALID_STYLES as readonly string[]).includes(rawStyle) ? rawStyle : 'commentary';
    const targetWords = tw || 1800;
    const targetMinutes = tm || 12;
    const wpm = rawWpm || 140;
    const minWords = targetWords - 100;
    const maxWords = targetWords + 100;

    const email = await getUserEmail();
    const { apiKey, source, creditsRemaining } = await resolveApiKey(email);

    if (!apiKey && source !== 'byok') {
      if (creditsRemaining <= 0) {
        return Response.json({ error: 'No AI credits remaining.', needsUpgrade: true }, { status: 402 });
      }
    }

    // Build modular system prompt
    const systemPrompt = buildSystemPrompt(style, model, { minWords, maxWords, targetWords, targetMinutes, wpm });

    // Load project bundle for user prompt context
    const admin = createAdminSupabase();
    const { data: rows } = await admin
      .from('project_data')
      .select('tool_key, data')
      .eq('project_id', projectId);

    const bundle: Record<string, Record<string, unknown>> = {};
    for (const row of rows || []) bundle[row.tool_key] = row.data as Record<string, unknown>;

    const parts: string[] = [];
    const ie = bundle.idea_entry as { currentIdea?: string } | undefined;
    if (ie?.currentIdea) parts.push(`TOPIC: ${ie.currentIdea}`);
    parts.push(`TITLE: ${ie?.currentIdea || 'Untitled'}`);

    const fw = bundle.framing_worksheet as Record<string, string> | undefined;
    if (fw?.oneSentence) parts.push(`THESIS: ${fw.oneSentence}`);
    if (fw?.contrarianAngle) parts.push(`ANGLE: ${fw.contrarianAngle}`);
    if (fw?.emotionalHook) parts.push(`EMOTIONAL HOOK: ${fw.emotionalHook}`);

    const aa = bundle.audience_avatar as Record<string, string> | undefined;
    if (aa?.idealViewer) parts.push(`AUDIENCE: ${aa.idealViewer}`);

    const rk = bundle.research_keeper as { notes?: string } | undefined;
    if (rk?.notes?.trim()) parts.push(`RESEARCH FINDINGS:\n${rk.notes.trim().slice(0, 1500)}`);

    const aps = bundle.ai_prompts_state as { picks?: Record<string, string>; kept?: Record<string, string> } | undefined;
    const outline = aps?.picks?.['3d'] || aps?.kept?.['3d'] || '';
    const hook = (bundle.hook_draft as { draft?: string } | undefined)?.draft || aps?.picks?.['3e'] || aps?.kept?.['3e'] || '';
    const counterArgs = aps?.picks?.['3c'] || aps?.kept?.['3c'] || '';
    const crossDisc = aps?.picks?.['3b'] || aps?.kept?.['3b'] || '';

    if (outline) parts.push(`OUTLINE:\n${outline}`);
    if (hook) parts.push(`SELECTED HOOK:\n${hook}`);
    if (counterArgs) parts.push(`COUNTER-ARGUMENTS TO ADDRESS:\n${counterArgs}`);
    if (crossDisc) parts.push(`CROSS-DISCIPLINARY CONNECTION:\n${crossDisc}`);

    parts.push(`\nTARGET LENGTH: approximately ${targetWords} words (${targetMinutes} minutes at ${wpm} WPM).`);
    parts.push(`VIDEO STYLE: ${style.toUpperCase()}`);
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
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      });
      scriptText = response.content[0].type === 'text' ? response.content[0].text : '';
    } else {
      const orModel = OPENROUTER_MODELS[model as string];
      const result = await callWithFallback({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        primaryModel: orModel,
        maxTokens: 4000,
        temperature: 0.8,
      });
      scriptText = result.content;
    }

    const wordCount = scriptText.trim().split(/\s+/).length;

    return Response.json({ script: scriptText, model, wordCount });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return Response.json({ error: message }, { status: 500 });
  }
}
