import Anthropic from '@anthropic-ai/sdk';
import { resolveApiKey, decrementCredits, incrementCredits, getUserEmail } from '@/lib/ai-credits';
import { checkSubscriptionAccess } from '@/lib/subscription-check';
import { createAdminSupabase } from '@/lib/supabase';
import { getAuthUser, assertProjectOwned } from '@/lib/auth';
import { getVoiceVideoTranscript, prependVoiceVideoBlock } from '@/lib/voice-injection';

const SYSTEM_PROMPT = `You are a YouTube hook writer. You write the first 15-30 seconds of a video script. The part that stops the scroll and makes someone stay.

Rules:
- Each hook must be UNDER 90 words
- Never start with "Hey guys", "In this video", "What's up", "So", or "I"
- Open mid-action or mid-thought. Drop the viewer into something already happening
- Create a SPECIFIC curiosity gap, not a vague one ("The CEO of a $2B company just admitted..." not "Something interesting happened...")
- Include a concrete detail: a number, a name, a specific claim
- Make a promise the video actually keeps. No clickbait disconnect
- Must sound like a real person talking, not AI copy. Conversational, with personality
- Must match the title/thumbnail promise
- Create stakes: why should the viewer care RIGHT NOW?

Generate 5 distinct hook options. Each should take a different approach:
1. Contradiction hook. Open with something that challenges what the viewer assumes
2. Story hook. Drop into a specific moment or scenario
3. Question hook. Ask something the viewer can't help but want answered
4. Data hook. Lead with a surprising number or statistic
5. Stakes hook. Immediately establish what's at risk

Respond ONLY with a JSON array of exactly 5 strings, each being the full hook text. No labels, no explanations, no meta-commentary. Just the spoken words in each string.`;

export async function POST(request: Request) {
  let creditsCharged = 0;
  let chargedEmail: string | null = null;
  try {
    const { projectId } = await request.json();

    const authUser = await getAuthUser();
    if (!authUser) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (projectId && !(await assertProjectOwned(authUser.id, projectId))) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    const email = await getUserEmail();
    const { allowed: subAllowed, message: subMessage } = await checkSubscriptionAccess(email);
    if (!subAllowed) {
      return Response.json({ error: subMessage, needsSubscription: true }, { status: 403 });
    }
    const { apiKey, source, creditsRemaining } = await resolveApiKey(email);

    if (!apiKey) {
      return Response.json({
        error: 'No AI credits remaining. Add your API key in Settings.',
        needsUpgrade: true,
      }, { status: 402 });
    }

    // Load project bundle for upstream context
    let context = '';
    if (projectId) {
      const admin = createAdminSupabase();
      const { data: rows } = await admin
        .from('project_data')
        .select('tool_key, data')
        .eq('project_id', projectId);

      if (rows) {
        const bundle: Record<string, Record<string, unknown>> = {};
        for (const row of rows) bundle[row.tool_key] = row.data as Record<string, unknown>;

        const parts: string[] = [];

        const ie = bundle.idea_entry as { currentIdea?: string } | undefined;
        if (ie?.currentIdea) parts.push(`Video idea: ${ie.currentIdea}`);

        const is = bundle.idea_scorecard as { scores?: Record<string, number> } | undefined;
        if (is?.scores) {
          const total = Object.values(is.scores).reduce((s, v) => s + v, 0);
          parts.push(`Idea score: ${total}/45`);
        }

        const sc = bundle.score_checker as { gapResponses?: Record<string, string> } | undefined;
        if (sc?.gapResponses) {
          const filled = Object.entries(sc.gapResponses).filter(([, v]) => v.trim());
          if (filled.length > 0) {
            parts.push('Gap responses: ' + filled.map(([k, v]) => `${k}: ${v}`).join('; '));
          }
        }

        const vbm = bundle.viewer_belief_map as Record<string, string> | undefined;
        if (vbm) {
          if (vbm.currentBelief) parts.push(`Viewer currently believes: ${vbm.currentBelief}`);
          if (vbm.targetBelief) parts.push(`Viewer should believe after: ${vbm.targetBelief}`);
          if (vbm.targetEmotion) parts.push(`Target emotion: ${vbm.targetEmotion}`);
        }

        const aa = bundle.audience_avatar as Record<string, string> | undefined;
        if (aa?.idealViewer) parts.push(`Audience: ${aa.idealViewer}`);
        if (aa?.problem) parts.push(`Their problem: ${aa.problem}`);

        const rk = bundle.research_keeper as { notes?: string } | undefined;
        if (rk?.notes?.trim()) parts.push(`Research notes: ${rk.notes.trim().slice(0, 500)}`);

        const fw = bundle.framing_worksheet as Record<string, string> | undefined;
        if (fw?.oneSentence) parts.push(`Thesis: ${fw.oneSentence}`);
        if (fw?.contrarianAngle) parts.push(`Contrarian angle: ${fw.contrarianAngle}`);
        if (fw?.emotionalHook) parts.push(`Emotional hook: ${fw.emotionalHook}`);
        if (fw?.thirtySeconds) parts.push(`30-second pitch: ${fw.thirtySeconds}`);

        context = parts.join('\n');
      }
    }

    if (!context.trim()) {
      return Response.json({ error: 'No upstream data found. Fill in your idea and research first.' }, { status: 400 });
    }

    if (source === 'credits' && email) {
      const remaining = await decrementCredits(email, 1);
      if (remaining === null) {
        return Response.json({ error: 'Insufficient credits.', needsUpgrade: true }, { status: 402 });
      }
      creditsCharged = 1;
      chargedEmail = email;
    }

    const client = new Anthropic({ apiKey });

    const voiceTranscript = await getVoiceVideoTranscript(email);
    const systemPrompt = prependVoiceVideoBlock(SYSTEM_PROMPT, voiceTranscript);

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: 'user', content: `Here's everything I have so far for this video:\n\n${context}\n\nWrite 5 hooks for this video.` }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    console.log('[suggest-hooks] Raw response:', text);

    function parseAsPlainText(raw: string): string[] {
      // Try splitting by numbered patterns first: "1.", "1)", "Hook 1:", etc.
      const numbered = raw.split(/\n(?=\d+[\.\)]\s|(?:Hook|Option)\s*\d)/i);
      if (numbered.length >= 3) {
        return numbered
          .map((chunk) => chunk.replace(/^\d+[\.\)]\s*/, '').replace(/^(?:Hook|Option)\s*\d[:\.\)]\s*/i, '').replace(/^["']|["']$/g, '').trim())
          .filter((chunk) => chunk.length > 10);
      }
      // Fall back to double-newline split
      const chunks = raw.split(/\n{2,}/);
      if (chunks.length >= 3) {
        return chunks
          .map((chunk) => chunk.replace(/^\d+[\.\)]\s*/, '').replace(/^["']|["']$/g, '').trim())
          .filter((chunk) => chunk.length > 10);
      }
      // Last resort: treat the entire text as one hook
      const cleaned = raw.replace(/^\d+[\.\)]\s*/gm, '').trim();
      return cleaned.length > 10 ? [cleaned] : [];
    }

    let hooks: string[] = [];

    // Strategy 1: strip markdown fences, parse JSON
    const stripped = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    try {
      const parsed = JSON.parse(stripped);
      if (Array.isArray(parsed)) hooks = parsed.map(String);
    } catch {
      // Strategy 2: find first [ and last ] and parse that substring
      const firstBracket = text.indexOf('[');
      const lastBracket = text.lastIndexOf(']');
      if (firstBracket !== -1 && lastBracket > firstBracket) {
        try {
          const parsed = JSON.parse(text.slice(firstBracket, lastBracket + 1));
          if (Array.isArray(parsed)) hooks = parsed.map(String);
        } catch {
          hooks = parseAsPlainText(text);
        }
      } else {
        hooks = parseAsPlainText(text);
      }
    }

    if (hooks.length === 0) {
      return Response.json({ error: 'Failed to parse hooks from AI response', raw: text.slice(0, 300) }, { status: 500 });
    }

    const newRemaining = source === 'byok' ? -1 : source === 'credits' ? creditsRemaining - 1 : 999;

    return Response.json({ hooks, remaining: newRemaining });
  } catch (err) {
    if (creditsCharged > 0 && chargedEmail) {
      await incrementCredits(chargedEmail, creditsCharged);
    }
    const message = err instanceof Error ? err.message : 'Internal server error';
    return Response.json({ error: message }, { status: 500 });
  }
}
