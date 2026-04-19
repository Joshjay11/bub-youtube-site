'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { notifyCreditChange } from '@/components/app/CreditHealthBar';
import { useProject, type Project } from '@/lib/project-context';
import { getTastemakerState, TASTEMAKER_THRESHOLDS, type TastemakerState } from '@/lib/tastemaker-state';
import ProgressStaircase from './tastemaker/ProgressStaircase';
import SourcesGrid from './tastemaker/SourcesGrid';
import SourceExpandModal from './tastemaker/SourceExpandModal';
import AddVoiceSampleModal from './tastemaker/AddVoiceSampleModal';
import VariationsSection, { type Variations } from './tastemaker/VariationsSection';
import type { Source, VoiceSampleSourceType } from './tastemaker/types';

// ─── Friendly Label Maps ────────────────────────────────────────────────────

const WRITER_LABELS: Record<string, string> = {
  writer_a: 'Writer A (Claude)',
  writer_b: 'Writer B (Minimax)',
  writer_c: 'Writer C (Grok)',
  sonnet: 'Writer A (Claude)',
  minimax: 'Writer B (Minimax)',
  grok: 'Writer C (Grok)',
  draft_a: 'Writer A (Claude)',
  draft_b: 'Writer B (Minimax)',
  draft_c: 'Writer C (Grok)',
};

const STYLE_LABELS: Record<string, string> = {
  tutorial: 'Tutorial',
  explainer: 'Explainer',
  story: 'Story-Driven',
  commentary: 'Commentary',
  listicle: 'Listicle',
};

function friendlyLabel(value: string, map: Record<string, string>): string {
  return map[value] || value;
}

// ─── Types ──────────────────────────────────────────────────────────────────

interface ModeResult {
  value: string;
  count: number;
}

interface Stats {
  completed_projects: number;
  preferred_style: ModeResult | null;
  avg_wpm: number;
  avg_video_length: number;
  preferred_writer: ModeResult | null;
  preferred_hook: ModeResult | null;
  avg_word_count: number;
  research_usage_rate: number;
}

interface TastemakerData {
  status: 'building' | 'ready';
  user_id?: string;
  tastemaker_state: TastemakerState;
  completed_project_ids?: string[];
  completed_projects?: number;
  total_projects?: number;
  required?: number;
  remaining?: number;
  stats?: Stats;
  prose?: {
    voice_patterns: string;
    portable_profile: string;
    growth_suggestions: string;
  };
  variations?: Variations | null;
  generated_at?: string;
}

interface ProjectListRow {
  id: string;
  title: string;
  status: string;
  included_in_tastemaker: boolean;
  created_at: string;
  updated_at: string;
}

interface VoiceSampleListRow {
  id: string;
  title: string;
  notes: string;
  source_type: VoiceSampleSourceType;
  word_count: number;
  included_in_tastemaker: boolean;
  created_at: string;
  updated_at: string;
}

function getCacheKey(userId: string) {
  return `bub_tastemaker_cache_${userId}`;
}

function loadCache(userId: string): TastemakerData | null {
  try {
    const raw = localStorage.getItem(getCacheKey(userId));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveCache(userId: string, data: TastemakerData) {
  try {
    localStorage.setItem(getCacheKey(userId), JSON.stringify(data));
  } catch { /* non-blocking */ }
}

// ─── Markdown Renderer ──────────────────────────────────────────────────────

function InlineText({ text }: { text: string }) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

function SimpleMarkdown({ content }: { content: string }) {
  if (!content) return null;
  const lines = content.split('\n').filter(l => l.trim());

  return (
    <div className="text-[13px] text-text-dim leading-relaxed space-y-1.5">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (trimmed.match(/^[-*•]\s/)) {
          return <p key={i} className="pl-4"><InlineText text={trimmed.replace(/^[-*•]\s/, '')} /></p>;
        }
        if (trimmed.startsWith('→ ') || trimmed.startsWith('-> ')) {
          return (
            <p key={i} className="pl-4">
              <span className="text-amber mr-1">&rarr;</span>
              <InlineText text={trimmed.replace(/^(→|->)\s/, '')} />
            </p>
          );
        }
        return <p key={i}><InlineText text={trimmed} /></p>;
      })}
    </div>
  );
}

// ─── Copy Button ────────────────────────────────────────────────────────────

function CopyBtn({ text, label }: { text: string; label?: string }) {
  const [c, setC] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setC(true); setTimeout(() => setC(false), 1500); }}
      className="text-[11px] text-text-muted hover:text-amber bg-transparent border border-border rounded px-2 py-1 cursor-pointer hover:border-amber/30 transition-colors"
    >
      {c ? 'Copied!' : label || 'Copy'}
    </button>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function Tastemaker() {
  const router = useRouter();
  const { projects: contextProjects, setCurrentProject } = useProject();

  const [data, setData] = useState<TastemakerData | null>(null);
  const [projects, setProjects] = useState<ProjectListRow[]>([]);
  const [voiceSamples, setVoiceSamples] = useState<VoiceSampleListRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stale, setStale] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [expanded, setExpanded] = useState<Source | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const hasFetched = useRef(false);
  const userIdRef = useRef<string>('default');
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showMutationError = useCallback((message: string) => {
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    setMutationError(message);
    errorTimerRef.current = setTimeout(() => setMutationError(null), 4000);
  }, []);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/ai/tastemaker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const result = await res.json();
      if (result.error) {
        setError(result.error);
      } else {
        if (result.user_id) userIdRef.current = result.user_id;
        setData(result);
        setStale(false);
        saveCache(userIdRef.current, result);
        if (result.status === 'ready') notifyCreditChange();
      }
    } catch {
      setError('Connection error.');
    }
    setLoading(false);
  }, []);

  const fetchSources = useCallback(async () => {
    try {
      const [projectsRes, samplesRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/tastemaker/voice-samples'),
      ]);
      if (projectsRes.ok) {
        const { projects: list } = await projectsRes.json();
        setProjects(list || []);
      }
      if (samplesRes.ok) {
        const { samples } = await samplesRes.json();
        setVoiceSamples(samples || []);
      }
    } catch { /* non-blocking */ }
  }, []);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const cached = loadCache(userIdRef.current);
    if (cached) {
      if (cached.user_id) userIdRef.current = cached.user_id;
      setData(cached);
    }
    fetchProfile();
    fetchSources();
  }, [fetchProfile, fetchSources]);

  // Live count reflects current inclusion toggles; updates immediately without waiting for refresh.
  const completedIds = data?.completed_project_ids ?? [];
  const liveCompletedCount = useMemo(() => {
    if (completedIds.length === 0) return 0;
    const includedProjectIds = new Set(projects.filter(p => p.included_in_tastemaker).map(p => p.id));
    return completedIds.filter(id => includedProjectIds.has(id)).length;
  }, [completedIds, projects]);

  const liveState = getTastemakerState(liveCompletedCount);
  const showVariations =
    (liveState === 'variations' || liveState === 'saturated') &&
    !!data?.variations &&
    !!data.variations.teach;

  const sources: Source[] = useMemo(() => {
    const completedIdSet = new Set(completedIds);
    const projectSources: Source[] = projects
      .filter(p => completedIdSet.has(p.id))
      .map(p => ({
        id: p.id,
        kind: 'project' as const,
        title: p.title,
        sourceType: 'project' as const,
        wordCount: 0,
        createdAt: p.created_at,
        included: p.included_in_tastemaker,
      }));
    const sampleSources: Source[] = voiceSamples.map(v => ({
      id: v.id,
      kind: 'voice_sample' as const,
      title: v.title,
      sourceType: v.source_type,
      wordCount: v.word_count,
      createdAt: v.created_at,
      included: v.included_in_tastemaker,
      notes: v.notes,
    }));
    return [...projectSources, ...sampleSources].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [projects, voiceSamples, completedIds]);

  const excludedCount = sources.filter(s => !s.included).length;

  async function toggleProject(id: string, included: boolean) {
    setProjects(prev => prev.map(p => (p.id === id ? { ...p, included_in_tastemaker: included } : p)));
    setStale(true);
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ included }),
      });
      if (!res.ok) {
        setProjects(prev => prev.map(p => (p.id === id ? { ...p, included_in_tastemaker: !included } : p)));
        showMutationError('Failed to update project. Try again.');
      }
    } catch {
      setProjects(prev => prev.map(p => (p.id === id ? { ...p, included_in_tastemaker: !included } : p)));
      showMutationError('Network error. Check your connection and try again.');
    }
  }

  async function toggleVoiceSample(id: string, included: boolean) {
    setVoiceSamples(prev => prev.map(v => (v.id === id ? { ...v, included_in_tastemaker: included } : v)));
    setStale(true);
    try {
      const res = await fetch(`/api/tastemaker/voice-samples/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ included }),
      });
      if (!res.ok) {
        setVoiceSamples(prev => prev.map(v => (v.id === id ? { ...v, included_in_tastemaker: !included } : v)));
        showMutationError('Failed to update voice sample. Try again.');
      }
    } catch {
      setVoiceSamples(prev => prev.map(v => (v.id === id ? { ...v, included_in_tastemaker: !included } : v)));
      showMutationError('Network error. Check your connection and try again.');
    }
  }

  function onToggleSource(id: string, included: boolean) {
    const sample = voiceSamples.find(v => v.id === id);
    if (sample) {
      toggleVoiceSample(id, included);
    } else {
      toggleProject(id, included);
    }
  }

  async function deleteVoiceSample(id: string) {
    const previous = voiceSamples;
    setVoiceSamples(prev => prev.filter(v => v.id !== id));
    setStale(true);
    setExpanded(null);
    try {
      const res = await fetch(`/api/tastemaker/voice-samples/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        setVoiceSamples(previous);
        showMutationError('Failed to delete voice sample. Try again.');
      }
    } catch {
      setVoiceSamples(previous);
      showMutationError('Network error. Check your connection and try again.');
    }
  }

  async function saveVoiceSampleTitle(id: string, title: string) {
    const previousSamples = voiceSamples;
    const previousExpanded = expanded;
    setVoiceSamples(prev => prev.map(v => (v.id === id ? { ...v, title } : v)));
    setExpanded(prev => (prev && prev.id === id ? { ...prev, title } : prev));
    try {
      const res = await fetch(`/api/tastemaker/voice-samples/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) {
        setVoiceSamples(previousSamples);
        setExpanded(previousExpanded);
        showMutationError('Failed to update title. Try again.');
      }
    } catch {
      setVoiceSamples(previousSamples);
      setExpanded(previousExpanded);
      showMutationError('Network error. Check your connection and try again.');
    }
  }

  async function saveVoiceSampleNotes(id: string, notes: string) {
    const previousSamples = voiceSamples;
    const previousExpanded = expanded;
    setVoiceSamples(prev => prev.map(v => (v.id === id ? { ...v, notes } : v)));
    setExpanded(prev => (prev && prev.id === id ? { ...prev, notes } : prev));
    try {
      const res = await fetch(`/api/tastemaker/voice-samples/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) {
        setVoiceSamples(previousSamples);
        setExpanded(previousExpanded);
        showMutationError('Failed to update notes. Try again.');
      }
    } catch {
      setVoiceSamples(previousSamples);
      setExpanded(previousExpanded);
      showMutationError('Network error. Check your connection and try again.');
    }
  }

  async function expandSource(source: Source) {
    setExpanded(source);
    if (source.kind === 'voice_sample' && !source.content) {
      try {
        const res = await fetch(`/api/tastemaker/voice-samples/${source.id}`);
        if (res.ok) {
          const { sample } = await res.json();
          setExpanded(prev => (prev && prev.id === source.id ? { ...prev, content: sample.content, notes: sample.notes } : prev));
        }
      } catch { /* non-blocking */ }
    }
  }

  function openProject(id: string) {
    const project = contextProjects.find((p: Project) => p.id === id);
    if (project) setCurrentProject(project);
    setExpanded(null);
    router.push('/app/write');
  }

  function onVoiceSampleCreated(sample: VoiceSampleListRow) {
    setVoiceSamples(prev => [sample, ...prev]);
    setStale(true);
  }

  // ── Loading / error states ────────────────────────────────────────────

  if (loading && !data) {
    return (
      <div className="space-y-5">
        <Header />
        <div className="bg-bg-card border border-border rounded-xl p-8 text-center">
          <p className="text-[14px] text-text-dim">Analyzing your projects...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="space-y-5">
        <Header />
        <div className="text-[13px] text-red bg-red/5 border border-red/20 rounded-lg px-4 py-3">{error}</div>
      </div>
    );
  }

  // ── Building state ────────────────────────────────────────────────────

  if (!data || liveState === 'building') {
    return (
      <div className="space-y-5">
        <Header />
        <div className="bg-bg-card border border-border rounded-xl p-8 space-y-6">
          <div className="text-center space-y-4">
            <p className="text-[15px] text-text-bright font-medium">Your creative profile is building...</p>
            <div className="max-w-md mx-auto">
              <ProgressStaircase completedCount={liveCompletedCount} />
            </div>
            <p className="text-[13px] text-text-dim">
              Complete {Math.max(0, TASTEMAKER_THRESHOLDS.base - liveCompletedCount)} more project
              {TASTEMAKER_THRESHOLDS.base - liveCompletedCount !== 1 ? 's' : ''} to unlock your Taste Profile.
            </p>
          </div>

          <div className="border-t border-border/50 pt-5">
            <p className="text-[12px] text-text-muted mb-3">What you&apos;ll see:</p>
            <ul className="space-y-1.5 text-[13px] text-text-dim">
              <li>Your creative fingerprint, style, pace, and tool preferences</li>
              <li>Voice patterns the data reveals about your writing</li>
              <li>A portable profile you can copy into any AI tool</li>
              <li>Growth suggestions from your actual project data</li>
              <li>At 9 projects: three voice variations (Teach, Argue, Connect)</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // ── Ready state ───────────────────────────────────────────────────────

  const { stats, prose, generated_at } = data;
  if (!stats || !prose) return null;

  return (
    <div className="space-y-5">
      <Header />

      {error && <div className="text-[13px] text-red bg-red/5 border border-red/20 rounded-lg px-4 py-3">{error}</div>}

      <div className="bg-bg-card border border-border rounded-xl p-5 space-y-3">
        <ProgressStaircase completedCount={liveCompletedCount} />
        <div className="flex items-center justify-between pt-2">
          <p className="text-[12px] text-text-muted">
            {generated_at && <>Updated {new Date(generated_at).toLocaleDateString()}</>}
          </p>
          <button
            onClick={fetchProfile}
            disabled={loading}
            className="text-[12px] text-text-muted hover:text-amber bg-transparent border border-border rounded px-3 py-1.5 cursor-pointer hover:border-amber/30 transition-colors disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh Profile (1 credit)'}
          </button>
        </div>
      </div>

      {stale && (
        <div className="flex items-center justify-between gap-3 text-[13px] bg-amber/5 border border-amber/30 rounded-lg px-4 py-3">
          <span className="text-text-bright">
            {excludedCount > 0
              ? `${excludedCount} source${excludedCount === 1 ? '' : 's'} excluded. Refresh to update your profile.`
              : 'Sources changed. Refresh to update your profile.'}
          </span>
          <button
            onClick={fetchProfile}
            disabled={loading}
            className="shrink-0 text-[12px] text-bg bg-amber hover:bg-amber-bright rounded px-3 py-1.5 cursor-pointer transition-colors disabled:opacity-50 font-medium"
          >
            {loading ? 'Refreshing...' : 'Refresh now'}
          </button>
        </div>
      )}

      {/* Creative Fingerprint */}
      <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border/50">
          <h3 className="text-[14px] font-medium text-text-bright">Creative Fingerprint</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-border/30">
          <StatCell label="Style" value={stats.preferred_style ? `${friendlyLabel(stats.preferred_style.value, STYLE_LABELS)} (${stats.preferred_style.count}/${stats.completed_projects})` : 'No clear pref'} />
          <StatCell label="Pace" value={`${stats.avg_wpm} WPM`} />
          <StatCell label="Length" value={`~${stats.avg_video_length} minutes`} />
          <StatCell label="Writer" value={stats.preferred_writer ? `${friendlyLabel(stats.preferred_writer.value, WRITER_LABELS)} (${stats.preferred_writer.count}/${stats.completed_projects})` : 'No clear pref'} />
          <StatCell label="Hook" value={stats.preferred_hook ? `${stats.preferred_hook.value} (${stats.preferred_hook.count}/${stats.completed_projects})` : 'No clear pref'} />
          <StatCell label="Research" value={`Used on ${stats.research_usage_rate}% of projects`} />
          <StatCell label="Avg Words" value={`${stats.avg_word_count.toLocaleString()}`} />
        </div>
      </div>

      {/* Voice Patterns */}
      <div className="bg-bg-card border border-border rounded-xl p-5 space-y-2">
        <h3 className="text-[14px] font-medium text-text-bright">Voice Patterns</h3>
        <SimpleMarkdown content={prose.voice_patterns} />
      </div>

      {/* Portable Taste Profile */}
      <div className="bg-bg-card border border-border rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[14px] font-medium text-text-bright">Your Portable Taste Profile</h3>
          <CopyBtn text={prose.portable_profile} label="Copy Profile" />
        </div>
        <p className="text-[11px] text-text-muted">Paste this into any AI tool to maintain your creative voice.</p>
        <div className="bg-bg-elevated border border-border/50 rounded-lg px-4 py-3">
          <SimpleMarkdown content={prose.portable_profile} />
        </div>
      </div>

      {/* Growth Suggestions */}
      <div className="bg-bg-card border border-border rounded-xl p-5 space-y-2">
        <h3 className="text-[14px] font-medium text-text-bright">Growth Suggestions</h3>
        <SimpleMarkdown content={prose.growth_suggestions} />
      </div>

      {/* Variations */}
      {showVariations && data.variations && (
        <VariationsSection variations={data.variations} />
      )}

      {/* Sources */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[14px] font-medium text-text-bright">Your Sources</h3>
            <p className="text-[12px] text-text-dim mt-0.5">
              Completed projects and voice samples feeding the profile. Toggle to include or exclude.
            </p>
          </div>
          <button
            onClick={() => setAddOpen(true)}
            className="text-[12px] text-amber hover:text-amber-bright bg-transparent border border-amber/30 rounded px-3 py-1.5 cursor-pointer hover:border-amber/50 transition-colors whitespace-nowrap"
          >
            + Add Voice Sample
          </button>
        </div>
        <SourcesGrid
          sources={sources}
          onToggle={onToggleSource}
          onExpand={expandSource}
          onDelete={deleteVoiceSample}
        />
      </section>

      <SourceExpandModal
        source={expanded}
        onClose={() => setExpanded(null)}
        onSaveTitle={saveVoiceSampleTitle}
        onSaveNotes={saveVoiceSampleNotes}
        onDelete={deleteVoiceSample}
        onOpenProject={openProject}
      />

      <AddVoiceSampleModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={onVoiceSampleCreated}
      />

      {mutationError && (
        <div
          role="alert"
          className="fixed bottom-4 right-4 z-50 bg-red text-white px-4 py-3 rounded-lg shadow-lg text-[13px] max-w-sm"
        >
          {mutationError}
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function Header() {
  const [guideOpen, setGuideOpen] = useState(false);

  return (
    <div className="space-y-3">
      <div>
        <h2 className="font-serif text-[22px] text-text-bright">Tastemaker</h2>
        <p className="text-text-dim text-[13px] mt-1">Your creative patterns, distilled from your project data.</p>
      </div>
      <div>
        <button
          onClick={() => setGuideOpen(!guideOpen)}
          className="flex items-center gap-2 text-text-dim text-[13px] hover:text-text-bright transition-colors bg-transparent border-none cursor-pointer p-0"
        >
          <span className={`transform transition-transform ${guideOpen ? 'rotate-90' : ''}`}>&rsaquo;</span>
          How the Tastemaker Works
        </button>
        {guideOpen && (
          <div className="mt-3 text-text-dim text-[13px] leading-relaxed space-y-3 pl-4 border-l border-border">
            <p>
              The Tastemaker reads your creative patterns across completed projects. No
              questionnaires, no setup. It watches what you actually do: which styles you
              pick, which hooks you write, how your scripts score, which AI tools you lean on.
            </p>
            <p>At 7 completed projects you unlock:</p>
            <ul className="space-y-1 pl-1">
              <li><strong className="text-text-bright">Creative Fingerprint</strong>, your default style, pace, hook type, and tool preferences</li>
              <li><strong className="text-text-bright">Voice Patterns</strong>, what the data reveals about your writing tendencies and blind spots</li>
              <li><strong className="text-text-bright">Portable Taste Profile</strong>, a one-page creative profile you can copy into ChatGPT, Claude, Gemini, or any AI tool</li>
              <li><strong className="text-text-bright">Growth Suggestions</strong>, data-driven observations from your actual project history</li>
            </ul>
            <p>At 9 completed projects you unlock three <strong className="text-text-bright">Voice Variations</strong> (Teach, Argue, Connect), same voice, different creative situations.</p>
            <p>At 25 completed projects the profile reaches <strong className="text-text-bright">Saturation</strong>. Further refreshes track voice evolution over time.</p>
            <p className="text-text-muted">A project counts as &ldquo;completed&rdquo; when it has a script with 200+ words on the Write page. You can exclude individual projects and upload external voice samples in the Sources section.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-bg-card px-4 py-3">
      <div className="text-[11px] text-text-muted uppercase tracking-wider mb-0.5">{label}</div>
      <div className="text-[13px] text-text-bright">{value}</div>
    </div>
  );
}
