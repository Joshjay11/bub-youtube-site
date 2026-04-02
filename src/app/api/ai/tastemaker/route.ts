import { createAdminSupabase } from '@/lib/supabase';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { callWithFallback } from '@/lib/ai-fallback';
import { resolveApiKey, decrementCredits, getUserEmail } from '@/lib/ai-credits';

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

// ─── Auth ───────────────────────────────────────────────────────────────────

async function getAuthUserId(): Promise<string | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {},
      },
    },
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
}

// ─── Route Handler ──────────────────────────────────────────────────────────

const FLASH_MODEL = 'google/gemini-3-flash-preview';

export async function POST() {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const admin = createAdminSupabase();

    // Get all user's projects
    const { data: projects } = await admin
      .from('projects')
      .select('id, title, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (!projects || projects.length === 0) {
      return Response.json({ error: 'No projects found' }, { status: 400 });
    }

    const projectIds = projects.map(p => p.id);

    // Get all project_data across all projects
    const { data: allData } = await admin
      .from('project_data')
      .select('project_id, tool_key, data')
      .in('project_id', projectIds);

    if (!allData) {
      return Response.json({ error: 'No project data found' }, { status: 400 });
    }

    // Group data by project
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const projectBundles: Record<string, Record<string, any>> = {};
    for (const row of allData) {
      if (!projectBundles[row.project_id]) {
        projectBundles[row.project_id] = {};
      }
      projectBundles[row.project_id][row.tool_key] = row.data;
    }

    // Count "completed" projects (has a script_draft with 200+ words)
    const completedProjects = Object.entries(projectBundles).filter(([, data]) => {
      const script = data.write?.script_draft || data.write?.draft_a_output || '';
      return script.split(/\s+/).filter(Boolean).length > 200;
    });

    const completedCount = completedProjects.length;
    const totalProjects = projects.length;

    // If fewer than 5 completed projects, return progress only
    if (completedCount < 5) {
      return Response.json({
        status: 'building',
        completed_projects: completedCount,
        total_projects: totalProjects,
        required: 5,
        remaining: 5 - completedCount,
      });
    }

    // ── Step 2: Calculate patterns in TypeScript ──────────────────────────

    const patterns = {
      video_styles: [] as string[],
      pacing_wpms: [] as number[],
      target_minutes: [] as number[],
      hook_types: [] as string[],
      writer_choices: [] as string[],
      script_word_counts: [] as number[],
      target_word_counts: [] as number[],
      editor_modes: [] as string[],
      slop_scores: [] as number[],
      quality_issues: [] as string[],
      retention_passed: [] as string[],
      retention_failed: [] as string[],
      elevenlabs_versions: [] as string[],
      beat_types: [] as string[],
      research_used: 0,
      prompts_used: 0,
    };

    for (const [, data] of completedProjects) {
      if (data.structure?.video_style) patterns.video_styles.push(data.structure.video_style);
      if (data.structure?.pacing_wpm) patterns.pacing_wpms.push(data.structure.pacing_wpm);
      if (data.write?.pacing_wpm) patterns.pacing_wpms.push(data.write.pacing_wpm);
      if (data.structure?.target_minutes) patterns.target_minutes.push(data.structure.target_minutes);
      if (data.write?.target_minutes) patterns.target_minutes.push(data.write.target_minutes);
      if (data.structure?.hook_type) patterns.hook_types.push(data.structure.hook_type);
      if (data.hook_writer?.selected_hook_type) patterns.hook_types.push(data.hook_writer.selected_hook_type);
      if (data.write?.selected_writer) patterns.writer_choices.push(data.write.selected_writer);
      if (data.write?.selected_model) patterns.writer_choices.push(data.write.selected_model);

      const script = data.write?.script_draft || '';
      const wordCount = script.split(/\s+/).filter(Boolean).length;
      if (wordCount > 200) patterns.script_word_counts.push(wordCount);

      if (data.structure?.target_word_count) {
        patterns.target_word_counts.push(data.structure.target_word_count);
      }

      if (data.editors_table?.mode) patterns.editor_modes.push(data.editors_table.mode);
      if (data.slop_scanner?.score !== undefined) patterns.slop_scores.push(data.slop_scanner.score);

      if (data.quality_score?.issues && Array.isArray(data.quality_score.issues)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data.quality_score.issues.forEach((issue: any) => {
          if (issue.problem) patterns.quality_issues.push(issue.problem);
        });
      }

      if (data.retention_audit?.results && Array.isArray(data.retention_audit.results)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data.retention_audit.results.forEach((result: any) => {
          if (result.passed) {
            patterns.retention_passed.push(result.criterion || result.name);
          } else {
            patterns.retention_failed.push(result.criterion || result.name);
          }
        });
      }

      if (data.elevenlabs?.version) patterns.elevenlabs_versions.push(data.elevenlabs.version);
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

    // Calculate summary stats
    const stats = {
      completed_projects: completedCount,
      preferred_style: mode(patterns.video_styles),
      avg_wpm: Math.round(average(patterns.pacing_wpms)) || 140,
      avg_video_length: Math.round(average(patterns.target_minutes)) || 10,
      preferred_writer: mode(patterns.writer_choices),
      preferred_editor: mode(patterns.editor_modes),
      preferred_hook: mode(patterns.hook_types),
      avg_word_count: Math.round(average(patterns.script_word_counts)),
      word_count_overshoot: patterns.target_word_counts.length > 0
        ? Math.round(average(patterns.script_word_counts.map((wc, i) =>
            patterns.target_word_counts[i]
              ? ((wc - patterns.target_word_counts[i]) / patterns.target_word_counts[i]) * 100
              : 0
          )))
        : null,
      avg_slop_score: Math.round(average(patterns.slop_scores)),
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

    // ── Step 3: Send to Flash for prose generation (1 credit) ─────────────

    const email = await getUserEmail();
    const { source } = await resolveApiKey(email);

    if (source === 'credits' && email) {
      await decrementCredits(email);
    }

    const systemPrompt = `You are a creative pattern analyst for YouTube creators. You will receive aggregated statistics from a creator's last several video projects. Your job is to write three sections:

1. VOICE PATTERNS: 5-7 specific observations about their creative tendencies. Be direct and specific. Reference the actual numbers. Don't compliment — analyze.

2. PORTABLE TASTE PROFILE: A single copyable text block (in markdown) they can paste into any AI tool. This is their creative DNA in prompt-ready format. Include: their style, pace, hook preferences, voice characteristics, what they do well, what they tend to miss, and what they never want to sound like. Keep it under 250 words.

3. GROWTH SUGGESTIONS: 3-4 data-driven observations (not motivation). Each should reference specific numbers from their data and suggest a concrete action. Format as bullet points starting with an arrow.

Tone: Direct, specific, no fluff. This person is a serious creator who wants insights, not praise.

Respond ONLY with valid JSON:
{
  "voice_patterns": "markdown string with 5-7 bullet observations",
  "portable_profile": "markdown string — the copyable taste profile",
  "growth_suggestions": "markdown string with 3-4 arrow bullet suggestions"
}`;

    const userMessage = `Here are aggregated creative patterns from a YouTube creator's last ${stats.completed_projects} completed video projects:

CREATIVE PREFERENCES:
- Preferred video style: ${stats.preferred_style?.value || 'No clear preference'} (${stats.preferred_style?.count || 0}/${stats.completed_projects} videos)
- Average speaking pace: ${stats.avg_wpm} WPM
- Average video length: ${stats.avg_video_length} minutes
- Average script word count: ${stats.avg_word_count} words
${stats.word_count_overshoot !== null ? `- Word count tendency: runs ${stats.word_count_overshoot > 0 ? stats.word_count_overshoot + '% over' : Math.abs(stats.word_count_overshoot) + '% under'} target` : ''}

TOOL PREFERENCES:
- Preferred script writer: ${stats.preferred_writer?.value || 'No clear preference'} (${stats.preferred_writer?.count || 0}/${stats.completed_projects})
- Preferred editor mode: ${stats.preferred_editor?.value || 'No clear preference'} (${stats.preferred_editor?.count || 0}/${stats.completed_projects})
- Preferred hook type: ${stats.preferred_hook?.value || 'No clear preference'} (${stats.preferred_hook?.count || 0}/${stats.completed_projects})
- ElevenLabs version preference: ${stats.elevenlabs_version?.value || 'Not used'}

QUALITY PATTERNS:
- Average slop scanner score: ${stats.avg_slop_score} (0-5 clean, 6-15 minor, 16+ needs work)
- Most common quality issues: ${stats.top_quality_issues.map(i => i.value).join(', ') || 'None detected'}
- Retention audit — most passed: ${stats.top_retention_passes.map(i => i.value).join(', ') || 'N/A'}
- Retention audit — most failed: ${stats.top_retention_fails.map(i => i.value).join(', ') || 'N/A'}

WORKFLOW PATTERNS:
- Research page usage: ${stats.research_usage_rate}% of projects
- AI Prompt template usage: ${stats.prompt_usage_rate}% of available prompts used
- Beat sheet visual ratio: ${stats.beat_type_ratio.literal} literal / ${stats.beat_type_ratio.metaphorical} metaphorical

Generate the three sections as described in your instructions.`;

    const response = await callWithFallback({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      primaryModel: FLASH_MODEL,
      maxTokens: 4000,
      temperature: 0.7,
      jsonMode: true,
    });

    let prose;
    try {
      prose = parseJSON(response.content);
    } catch {
      return Response.json({ error: 'Failed to generate profile' }, { status: 500 });
    }

    return Response.json({
      status: 'ready',
      stats,
      prose: {
        voice_patterns: prose.voice_patterns,
        portable_profile: prose.portable_profile,
        growth_suggestions: prose.growth_suggestions,
      },
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 });
  }
}
