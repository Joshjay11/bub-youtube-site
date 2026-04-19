import { createAdminSupabase } from '@/lib/supabase';
import { callWithFallback } from '@/lib/ai-fallback';
import { resolveApiKey, decrementCredits, getUserEmail } from '@/lib/ai-credits';
import { checkSubscriptionAccess } from '@/lib/subscription-check';
import { getAuthUser } from '@/lib/auth';
import {
  TASTEMAKER_THRESHOLDS,
  getTastemakerState,
  type TastemakerState,
} from '@/lib/tastemaker-state';

// ─── Helpers ────────────────────────────────────────────────────────────────

function mode(arr: string[]): { value: string; count: number } | null {
  if (arr.length === 0) return null;
  const counts: Record<string, number> = {};
  arr.forEach(v => { counts[v] = (counts[v] || 0) + 1; });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return { value: sorted[0][0], count: sorted[0][1] };
}

function average(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function getTopN(arr: string[], n: number): { value: string; count: number }[] {
  const counts: Record<string, number> = {};
  arr.forEach(v => { counts[v] = (counts[v] || 0) + 1; });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([value, count]) => ({ value, count }));
}

function parseJSON(raw: string): Record<string, unknown> {
  const stripped = raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(stripped);
  } catch {
    const first = raw.indexOf('{');
    const last = raw.lastIndexOf('}');
    if (first !== -1 && last > first) return JSON.parse(raw.slice(first, last + 1));
    throw new Error('Failed to parse JSON');
  }
}

// ─── Route Handler ──────────────────────────────────────────────────────────

const FLASH_MODEL = 'google/gemini-3-flash-preview';
const VOICE_SAMPLE_EXCERPT_CHARS = 600;

export async function POST() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const userId = authUser.id;

    const admin = createAdminSupabase();

    // Get INCLUDED projects for the user
    const { data: projects, error: projectsError } = await admin
      .from('projects')
      .select('id, title, created_at, included_in_tastemaker')
      .eq('user_id', userId)
      .eq('included_in_tastemaker', true)
      .order('created_at', { ascending: true });

    if (projectsError) {
      return Response.json({ error: 'Failed to load projects' }, { status: 500 });
    }

    if (!projects || projects.length === 0) {
      return Response.json({
        status: 'building',
        user_id: userId,
        tastemaker_state: 'building' as TastemakerState,
        completed_projects: 0,
        total_projects: 0,
        required: TASTEMAKER_THRESHOLDS.base,
        remaining: TASTEMAKER_THRESHOLDS.base,
      });
    }

    const projectIds = projects.map(p => p.id);

    // Load project_data across the included projects
    const { data: allData, error: dataError } = await admin
      .from('project_data')
      .select('project_id, tool_key, data')
      .in('project_id', projectIds);

    if (dataError) {
      return Response.json({ error: 'Failed to load project data' }, { status: 500 });
    }

    // Load INCLUDED voice samples
    const { data: voiceSamples } = await admin
      .from('voice_samples')
      .select('id, title, content, word_count, source_type')
      .eq('user_id', userId)
      .eq('included_in_tastemaker', true)
      .order('created_at', { ascending: true });

    // Group data by project
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const projectBundles: Record<string, Record<string, any>> = {};
    for (const row of allData || []) {
      if (!projectBundles[row.project_id]) projectBundles[row.project_id] = {};
      projectBundles[row.project_id][row.tool_key] = row.data;
    }

    // A "completed" project has a script of 200+ words on the Write page.
    const completedProjects = Object.entries(projectBundles).filter(([, data]) => {
      const script = data.write?.script_draft || data.write?.draft_a_output || '';
      return script.split(/\s+/).filter(Boolean).length >= 200;
    });

    const completedCount = completedProjects.length;
    const completedProjectIds = completedProjects.map(([id]) => id);
    const tastemakerState = getTastemakerState(completedCount);

    if (tastemakerState === 'building') {
      return Response.json({
        status: 'building',
        user_id: userId,
        tastemaker_state: 'building' as TastemakerState,
        completed_projects: completedCount,
        completed_project_ids: completedProjectIds,
        total_projects: projects.length,
        required: TASTEMAKER_THRESHOLDS.base,
        remaining: TASTEMAKER_THRESHOLDS.base - completedCount,
      });
    }

    // ── Calculate patterns ────────────────────────────────────────────────

    const patterns = {
      video_styles: [] as string[],
      pacing_wpms: [] as number[],
      target_minutes: [] as number[],
      hook_types: [] as string[],
      writer_choices: [] as string[],
      script_word_counts: [] as number[],
      quality_issues: [] as string[],
      retention_passed: [] as string[],
      retention_failed: [] as string[],
      elevenlabs_versions: [] as string[],
      beat_types: [] as string[],
      research_used: 0,
      prompts_used: 0,
    };

    const overshoots: number[] = [];

    for (const [, data] of completedProjects) {
      if (data.write?.video_style) patterns.video_styles.push(data.write.video_style);
      if (data.write?.pacing_wpm) patterns.pacing_wpms.push(data.write.pacing_wpm);
      if (data.write?.target_minutes) patterns.target_minutes.push(data.write.target_minutes);
      if (data.structure?.hook_type) patterns.hook_types.push(data.structure.hook_type);
      if (data.hook_writer?.selected_hook_type) patterns.hook_types.push(data.hook_writer.selected_hook_type);
      if (data.write?.selected_model) patterns.writer_choices.push(data.write.selected_model);

      const script = data.write?.script_draft || '';
      const wordCount = script.split(/\s+/).filter(Boolean).length;
      if (wordCount >= 200) patterns.script_word_counts.push(wordCount);

      const target = data.structure?.target_word_count;
      if (wordCount >= 200 && target && target > 0) {
        overshoots.push(((wordCount - target) / target) * 100);
      }

      const qsIssues = data.quality_score?.result?.issues;
      if (qsIssues && Array.isArray(qsIssues)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        qsIssues.forEach((issue: any) => {
          if (issue.problem) patterns.quality_issues.push(issue.problem);
        });
      }

      const auditResults = data.optimize?.audit_results;
      if (auditResults && Array.isArray(auditResults)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        auditResults.forEach((result: any) => {
          if (result.status === 'pass') patterns.retention_passed.push(result.criterion);
          else if (result.status === 'fail') patterns.retention_failed.push(result.criterion);
        });
      }

      if (data.post_production?.elevenlabs_version) {
        patterns.elevenlabs_versions.push(data.post_production.elevenlabs_version);
      }

      if (data.beat_sheet?.beats && Array.isArray(data.beat_sheet.beats)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data.beat_sheet.beats.forEach((beat: any) => {
          if (beat.visual_type) patterns.beat_types.push(beat.visual_type);
        });
      }

      if (data.research && Object.keys(data.research).length > 0) patterns.research_used++;

      const promptKeys = ['prompt_3a', 'prompt_3b', 'prompt_3c', 'prompt_3d', 'prompt_3e', 'prompt_3f'];
      promptKeys.forEach(key => {
        if (data[key] && Object.keys(data[key]).length > 0) patterns.prompts_used++;
      });
    }

    const stats = {
      completed_projects: completedCount,
      preferred_style: mode(patterns.video_styles),
      avg_wpm: Math.round(average(patterns.pacing_wpms)) || 140,
      avg_video_length: Math.round(average(patterns.target_minutes)) || 10,
      preferred_writer: mode(patterns.writer_choices),
      preferred_hook: mode(patterns.hook_types),
      avg_word_count: Math.round(average(patterns.script_word_counts)),
      word_count_overshoot: overshoots.length > 0 ? Math.round(average(overshoots)) : null,
      top_quality_issues: getTopN(patterns.quality_issues, 3),
      top_retention_passes: getTopN(patterns.retention_passed, 3),
      top_retention_fails: getTopN(patterns.retention_failed, 3),
      research_usage_rate: Math.round((patterns.research_used / completedCount) * 100),
      prompt_usage_rate: Math.round((patterns.prompts_used / (completedCount * 6)) * 100),
      elevenlabs_version: mode(patterns.elevenlabs_versions),
      beat_type_ratio: {
        literal: patterns.beat_types.filter(t => t.includes('literal')).length,
        metaphorical: patterns.beat_types.filter(t => t.includes('metaphor')).length,
      },
    };

    // ── Credits / API key ─────────────────────────────────────────────────

    const email = await getUserEmail();
    const { allowed: subAllowed, message: subMessage } = await checkSubscriptionAccess(email);
    if (!subAllowed) {
      return Response.json({ error: subMessage, needsSubscription: true }, { status: 403 });
    }
    const { apiKey, source } = await resolveApiKey(email);

    if (!apiKey) {
      return Response.json(
        { error: 'No API key or credits available', needsUpgrade: true },
        { status: 402 },
      );
    }

    if (source === 'credits' && email) {
      await decrementCredits(email);
    }

    // ── Build shared input payload ────────────────────────────────────────

    const voiceSampleExcerpts = (voiceSamples ?? [])
      .filter(s => typeof s.content === 'string' && s.content.trim().length > 0)
      .map((s, idx) => {
        const excerpt = s.content.slice(0, VOICE_SAMPLE_EXCERPT_CHARS).trim();
        return `[${idx + 1}] "${s.title}" (${s.word_count} words, source: ${s.source_type}):\n${excerpt}${s.content.length > VOICE_SAMPLE_EXCERPT_CHARS ? '...' : ''}`;
      });

    const voiceSamplesBlock = voiceSampleExcerpts.length > 0
      ? `\n\nEXTERNAL VOICE SAMPLES (user-supplied writing outside the Script Studio):\n${voiceSampleExcerpts.join('\n\n')}`
      : '';

    const baseUserMessage = `Here are aggregated creative patterns from a YouTube creator's last ${stats.completed_projects} completed video projects:

CREATIVE PREFERENCES:
- Preferred video style: ${stats.preferred_style?.value || 'No clear preference'} (${stats.preferred_style?.count || 0}/${stats.completed_projects} videos)
- Average speaking pace: ${stats.avg_wpm} WPM
- Average video length: ${stats.avg_video_length} minutes
- Average script word count: ${stats.avg_word_count} words
${stats.word_count_overshoot !== null ? `- Word count tendency: runs ${stats.word_count_overshoot > 0 ? stats.word_count_overshoot + '% over' : Math.abs(stats.word_count_overshoot) + '% under'} target` : ''}

TOOL PREFERENCES:
- Preferred script writer: ${stats.preferred_writer?.value || 'No clear preference'} (${stats.preferred_writer?.count || 0}/${stats.completed_projects})
- Preferred hook type: ${stats.preferred_hook?.value || 'No clear preference'} (${stats.preferred_hook?.count || 0}/${stats.completed_projects})
- ElevenLabs version preference: ${stats.elevenlabs_version?.value || 'Not used'}

QUALITY PATTERNS:
- Most common quality issues: ${stats.top_quality_issues.map(i => i.value).join(', ') || 'None detected'}
- Retention audit, most passed: ${stats.top_retention_passes.map(i => i.value).join(', ') || 'N/A'}
- Retention audit, most failed: ${stats.top_retention_fails.map(i => i.value).join(', ') || 'N/A'}

WORKFLOW PATTERNS:
- Research page usage: ${stats.research_usage_rate}% of projects
- AI Prompt template usage: ${stats.prompt_usage_rate}% of available prompts used
- Beat sheet visual ratio: ${stats.beat_type_ratio.literal} literal / ${stats.beat_type_ratio.metaphorical} metaphorical${voiceSamplesBlock}`;

    // ── Generate base profile ─────────────────────────────────────────────

    const baseSystemPrompt = `You are a creative pattern analyst for YouTube creators. You will receive aggregated statistics from a creator's last several video projects, and possibly external voice samples they've uploaded. Your job is to write three sections:

1. VOICE PATTERNS: 5-7 specific observations about their creative tendencies. Be direct and specific. Reference the actual numbers. Don't compliment, analyze.

2. PORTABLE TASTE PROFILE: A single copyable text block (in markdown) they can paste into any AI tool. This is their creative DNA in prompt-ready format. Include: their style, pace, hook preferences, voice characteristics, what they do well, what they tend to miss, and what they never want to sound like. Keep it under 250 words.

3. GROWTH SUGGESTIONS: 3-4 data-driven observations (not motivation). Each should reference specific numbers from their data and suggest a concrete action. Format as bullet points starting with an arrow.

Tone: Direct, specific, no fluff. This person is a serious creator who wants insights, not praise.

Respond ONLY with valid JSON:
{
  "voice_patterns": "markdown string with 5-7 bullet observations",
  "portable_profile": "markdown string, the copyable taste profile",
  "growth_suggestions": "markdown string with 3-4 arrow bullet suggestions"
}`;

    const baseResponse = await callWithFallback({
      messages: [
        { role: 'system', content: baseSystemPrompt },
        { role: 'user', content: `${baseUserMessage}\n\nGenerate the three sections as described.` },
      ],
      primaryModel: FLASH_MODEL,
      maxTokens: 4000,
      temperature: 0.7,
      jsonMode: true,
    });

    let baseProse: { voice_patterns: string; portable_profile: string; growth_suggestions: string };
    try {
      const parsed = parseJSON(baseResponse.content);
      baseProse = {
        voice_patterns: String(parsed.voice_patterns ?? ''),
        portable_profile: String(parsed.portable_profile ?? ''),
        growth_suggestions: String(parsed.growth_suggestions ?? ''),
      };
    } catch {
      return Response.json({ error: 'Failed to generate profile' }, { status: 500 });
    }

    // ── Generate variations if unlocked ───────────────────────────────────

    let variations: { teach: string; argue: string; connect: string } | null = null;

    if (completedCount >= TASTEMAKER_THRESHOLDS.variations) {
      const variationSpec: Record<'teach' | 'argue' | 'connect', { frame: string; emphasize: string }> = {
        teach: {
          frame: "This is the SAME creator standing in a lecture hall, not a different creator.",
          emphasize: `Draw especially from projects where:
- The audit scored high on clarity, structure, or information density
- The creator selected explainer or tutorial styles
- Hook types were curiosity gaps, problem statements, or definitions
- WPM targets were in the 120-140 range
Emphasize: slower pacing, structured hierarchy, authoritative tone, defined terms, clarity over charm.`,
        },
        argue: {
          frame: "This is the SAME creator standing in a stadium, not a different creator.",
          emphasize: `Draw especially from projects where:
- Hook scores were high on stakes or provocation
- The creator picked commentary or listicle styles
- WPM targets were higher than their baseline
- Opinion-dense content with strong directional language
Emphasize: faster pacing, shorter sentences, stronger directional language, opinion-forward, rhetorical questions, higher emotional charge.`,
        },
        connect: {
          frame: "This is the SAME creator standing in a living room, not a different creator.",
          emphasize: `Draw especially from projects where:
- Personal story hooks or anecdotal scaffolding appeared
- The creator chose story-driven styles
- Retention passes referenced emotional arcs
- First-person framing dominated
Emphasize: more first-person language, anecdotal scaffolding, sensory specificity, reflective pacing, vulnerability, "I" and "you" direct address.`,
        },
      };

      const variationPrompt = (key: 'teach' | 'argue' | 'connect') => {
        const spec = variationSpec[key];
        return `You are generating a "${key.charAt(0).toUpperCase() + key.slice(1)} Mode" variation of this creator's Portable Taste Profile. This variation emphasizes their voice as it appears in ${
          key === 'teach' ? 'EXPLAINER and EDUCATIONAL' : key === 'argue' ? 'COMMENTARY and OPINION' : 'VLOG, PERSONAL STORY, and CONNECTION'
        } content.

${spec.emphasize}

Preserve all core voice signatures from the base profile below (vocabulary tics, humor style, sentence rhythms, em-dash habits, structural signatures). ${spec.frame}

BASE PORTABLE TASTE PROFILE (preserve this voice DNA):
${baseProse.portable_profile}

Respond ONLY with valid JSON:
{
  "portable_profile": "markdown string, the variation's copyable taste profile, under 250 words"
}`;
      };

      const variationKeys: Array<'teach' | 'argue' | 'connect'> = ['teach', 'argue', 'connect'];

      const variationResults = await Promise.all(variationKeys.map(async (key) => {
        try {
          const resp = await callWithFallback({
            messages: [
              { role: 'system', content: variationPrompt(key) },
              { role: 'user', content: baseUserMessage },
            ],
            primaryModel: FLASH_MODEL,
            maxTokens: 2000,
            temperature: 0.7,
            jsonMode: true,
          });
          const parsed = parseJSON(resp.content);
          return [key, String(parsed.portable_profile ?? '')] as const;
        } catch {
          return [key, ''] as const;
        }
      }));

      variations = variationResults.reduce(
        (acc, [key, value]) => ({ ...acc, [key]: value }),
        { teach: '', argue: '', connect: '' },
      );
    }

    return Response.json({
      status: 'ready',
      user_id: userId,
      tastemaker_state: tastemakerState,
      completed_project_ids: completedProjectIds,
      stats,
      prose: baseProse,
      variations,
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 });
  }
}
