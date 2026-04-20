import Anthropic from '@anthropic-ai/sdk';
import { callWithFallback } from '@/lib/ai-fallback';
import { resolveApiKey, decrementCredits, incrementCredits, getUserEmail } from '@/lib/ai-credits';
import { checkSubscriptionAccess } from '@/lib/subscription-check';
import { createAdminSupabase } from '@/lib/supabase';
import { getAuthUser, assertProjectOwned } from '@/lib/auth';
import { buildSystemPrompt, VALID_STYLES } from '@/lib/script-prompts';
import { getVoiceVideoTranscript, prependVoiceVideoBlock } from '@/lib/voice-injection';

const VALID_MODELS = ['sonnet', 'minimax', 'grok'] as const;

const OPENROUTER_MODELS: Record<string, string> = {
  minimax: 'minimax/minimax-m2.5',
  grok: 'x-ai/grok-4.1-fast',
};

function splitOutline(outline: string): { part1: string; part2: string } {
  // Try splitting by numbered sections, headers, or bullet-style sections
  const sectionPattern = /\n(?=(?:\d+[\.\)]\s|#{1,3}\s|(?:Hook|Section|Act|Micro|Step|Item|Part)\s*\d))/i;
  const sections = outline.split(sectionPattern).filter((s) => s.trim().length > 10);

  if (sections.length >= 3) {
    const mid = Math.ceil(sections.length / 2);
    return {
      part1: sections.slice(0, mid).join('\n\n'),
      part2: sections.slice(mid).join('\n\n'),
    };
  }

  // Fallback: split by paragraphs at midpoint
  const paragraphs = outline.split(/\n{2,}/).filter((p) => p.trim());
  if (paragraphs.length >= 4) {
    const mid = Math.ceil(paragraphs.length / 2);
    return {
      part1: paragraphs.slice(0, mid).join('\n\n'),
      part2: paragraphs.slice(mid).join('\n\n'),
    };
  }

  // Last resort: split by character midpoint at a paragraph boundary
  const midChar = Math.floor(outline.length / 2);
  const breakPoint = outline.indexOf('\n', midChar);
  if (breakPoint > 0) {
    return { part1: outline.slice(0, breakPoint).trim(), part2: outline.slice(breakPoint).trim() };
  }

  return { part1: outline, part2: '' };
}

async function callModel(
  model: string,
  systemPrompt: string,
  userMessage: string,
  apiKey: string | null,
): Promise<string> {
  if (model === 'sonnet') {
    const anthropicKey = apiKey || process.env.ANTHROPIC_API_KEY;
    if (!anthropicKey) throw new Error('Anthropic API not configured');
    const client = new Anthropic({ apiKey: anthropicKey });
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });
    return response.content[0].type === 'text' ? response.content[0].text : '';
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
    return result.content;
  }
}

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

    const authUser = await getAuthUser();
    if (!authUser) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!(await assertProjectOwned(authUser.id, projectId))) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    const style = (VALID_STYLES as readonly string[]).includes(rawStyle) ? rawStyle : 'commentary';
    const targetWords = tw || 1800;
    const targetMinutes = tm || 12;
    const wpm = rawWpm || 140;
    // Per-pass target: each pass aims for roughly half the total
    const halfTarget = Math.round(targetWords / 2);
    const passMin = halfTarget - 50;
    const passMax = halfTarget + 100;

    const email = await getUserEmail();
    const { allowed: subAllowed, message: subMessage } = await checkSubscriptionAccess(email);
    if (!subAllowed) {
      return Response.json({ error: subMessage, needsSubscription: true }, { status: 403 });
    }
    const { apiKey, source, creditsRemaining } = await resolveApiKey(email);

    if (!apiKey && source !== 'byok') {
      if (creditsRemaining <= 0) {
        return Response.json({ error: 'No AI credits remaining.', needsUpgrade: true }, { status: 402 });
      }
    }

    // Credits are now decremented per pass inside the stream, with refunds
    // on per-pass failure. See the per-pass logic below.

    // Build system prompt with per-pass word targets
    const baseSystemPrompt = buildSystemPrompt(style, model, {
      minWords: passMin,
      maxWords: passMax,
      targetWords: halfTarget,
      targetMinutes: Math.round(targetMinutes / 2),
      wpm,
    });

    // Voice Video Sampling: prepend the user's voice transcript if they've set one.
    const voiceTranscript = await getVoiceVideoTranscript(email);
    const systemPrompt = prependVoiceVideoBlock(baseSystemPrompt, voiceTranscript);

    // Load project bundle
    const admin = createAdminSupabase();
    const { data: rows } = await admin
      .from('project_data')
      .select('tool_key, data')
      .eq('project_id', projectId);

    const bundle: Record<string, Record<string, unknown>> = {};
    for (const row of rows || []) bundle[row.tool_key] = row.data as Record<string, unknown>;

    // Build context parts
    const contextParts: string[] = [];
    const ie = bundle.idea_entry as { currentIdea?: string } | undefined;
    if (ie?.currentIdea) contextParts.push(`TOPIC: ${ie.currentIdea}`);
    contextParts.push(`TITLE: ${ie?.currentIdea || 'Untitled'}`);

    const fw = bundle.framing_worksheet as Record<string, string> | undefined;
    if (fw?.oneSentence) contextParts.push(`THESIS: ${fw.oneSentence}`);
    if (fw?.contrarianAngle) contextParts.push(`ANGLE: ${fw.contrarianAngle}`);
    if (fw?.emotionalHook) contextParts.push(`EMOTIONAL HOOK: ${fw.emotionalHook}`);

    const aa = bundle.audience_avatar as Record<string, string> | undefined;
    if (aa?.idealViewer) contextParts.push(`AUDIENCE: ${aa.idealViewer}`);

    const rk = bundle.research_keeper as { notes?: string } | undefined;
    if (rk?.notes?.trim()) contextParts.push(`RESEARCH FINDINGS:\n${rk.notes.trim().slice(0, 1500)}`);

    const aps = bundle.ai_prompts_state as { picks?: Record<string, string>; kept?: Record<string, string> } | undefined;
    const outline = aps?.picks?.['3d'] || aps?.kept?.['3d'] || '';
    const hook = (bundle.hook_draft as { draft?: string } | undefined)?.draft || aps?.picks?.['3e'] || aps?.kept?.['3e'] || '';
    const counterArgs = aps?.picks?.['3c'] || aps?.kept?.['3c'] || '';
    const crossDisc = aps?.picks?.['3b'] || aps?.kept?.['3b'] || '';

    if (hook) contextParts.push(`SELECTED HOOK:\n${hook}`);
    if (counterArgs) contextParts.push(`COUNTER-ARGUMENTS TO ADDRESS:\n${counterArgs}`);
    if (crossDisc) contextParts.push(`CROSS-DISCIPLINARY CONNECTION:\n${crossDisc}`);

    const baseContext = contextParts.join('\n\n');

    // SSE streaming for progress updates
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        function sendEvent(data: Record<string, unknown>) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        }

        const charging = source === 'credits' && !!email;

        try {
          // Split outline
          const { part1: outlinePart1, part2: outlinePart2 } = splitOutline(outline);

          // ── Pass 1 ───────────────────────────────────────────────────
          if (charging) {
            const r1 = await decrementCredits(email!, 1);
            if (r1 === null) {
              sendEvent({ type: 'error', error: 'Insufficient credits.' });
              controller.close();
              return;
            }
          }

          sendEvent({ type: 'progress', step: 'pass1', message: `Writing first half...` });

          const pass1Prompt = `${baseContext}\n\nFULL OUTLINE (for context, you know where the story is going):\n${outline}\n\nYou are writing the FIRST HALF of this script. Write ONLY these sections:\n${outlinePart1}\n\nDo NOT write beyond this point. Write your natural length. Let each section breathe.\n\nVIDEO STYLE: ${style.toUpperCase()}\nTARGET for this half: approximately ${halfTarget} words.`;

          let pass1Output: string;
          try {
            pass1Output = await callModel(model, systemPrompt, pass1Prompt, apiKey);
          } catch (err) {
            if (charging) await incrementCredits(email!, 1);
            const msg = err instanceof Error ? err.message : 'Pass 1 failed';
            sendEvent({ type: 'error', error: msg });
            controller.close();
            return;
          }

          sendEvent({ type: 'progress', step: 'pass1_done', message: `First half complete (${pass1Output.trim().split(/\s+/).length} words)` });

          // ── Pass 2 ───────────────────────────────────────────────────
          if (charging) {
            const r2 = await decrementCredits(email!, 1);
            if (r2 === null) {
              // Ran out between passes. Return pass 1 as partial result.
              const partialScript = pass1Output.trim();
              const wordCount = partialScript.trim().split(/\s+/).length;
              sendEvent({ type: 'complete', script: partialScript, model, wordCount, partial: true });
              controller.close();
              return;
            }
          }

          sendEvent({ type: 'progress', step: 'pass2', message: `Writing second half...` });

          const pass2Prompt = `${baseContext}\n\nHere is what was already written (Part 1). Maintain the same voice, tone, and energy. Do NOT repeat any content from Part 1:\n\n${pass1Output}\n\nNow write the SECOND HALF. Write ONLY these sections:\n${outlinePart2 || 'Continue from where Part 1 left off through to the session hook ending.'}\n\nPick up exactly where Part 1 left off. Write your natural length. Do not compress or truncate.\n\nVIDEO STYLE: ${style.toUpperCase()}\nTARGET for this half: approximately ${halfTarget} words.`;

          let pass2Output: string;
          try {
            pass2Output = await callModel(model, systemPrompt, pass2Prompt, apiKey);
          } catch (err) {
            // Pass 2 failed but pass 1 succeeded. Refund pass 2 credit, return pass 1.
            if (charging) await incrementCredits(email!, 1);
            console.error('[generate-script] pass 2 failed, returning partial', err);
            const partialScript = pass1Output.trim();
            const wordCount = partialScript.trim().split(/\s+/).length;
            sendEvent({ type: 'complete', script: partialScript, model, wordCount, partial: true });
            controller.close();
            return;
          }

          sendEvent({ type: 'progress', step: 'pass2_done', message: `Second half complete (${pass2Output.trim().split(/\s+/).length} words)` });

          // Stitch
          sendEvent({ type: 'progress', step: 'stitch', message: 'Assembling draft...' });

          const fullScript = `${pass1Output.trim()}\n\n${pass2Output.trim()}`;
          const wordCount = fullScript.trim().split(/\s+/).length;

          sendEvent({ type: 'complete', script: fullScript, model, wordCount });
          controller.close();
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Generation failed';
          sendEvent({ type: 'error', error: msg });
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
