'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { notifyCreditChange } from '@/components/app/CreditHealthBar';

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
  // Building state
  completed_projects?: number;
  total_projects?: number;
  required?: number;
  remaining?: number;
  // Ready state
  stats?: Stats;
  prose?: {
    voice_patterns: string;
    portable_profile: string;
    growth_suggestions: string;
  };
  generated_at?: string;
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

// ─── Markdown Renderer (safe — no dangerouslySetInnerHTML) ──────────────────

function InlineText({ text }: { text: string }) {
  // Split on bold markers and render as spans
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
  const [data, setData] = useState<TastemakerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const hasFetched = useRef(false);
  const userIdRef = useRef<string>('default');

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
        saveCache(userIdRef.current, result);
        if (result.status === 'ready') notifyCreditChange();
      }
    } catch {
      setError('Connection error.');
    }
    setLoading(false);
  }, []);

  // Load cache on mount, then fetch fresh
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    // Try loading cache with user_id from a previous response
    const cached = loadCache(userIdRef.current);
    if (cached) {
      if (cached.user_id) userIdRef.current = cached.user_id;
      setData(cached);
    }
    fetchProfile();
  }, [fetchProfile]);

  // ── Building State ──────────────────────────────────────────────────────

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

  if (!data || data.status === 'building') {
    const completed = data?.completed_projects || 0;
    const required = data?.required || 7;
    const remaining = data?.remaining || (7 - completed);
    const pct = Math.round((completed / required) * 100);

    return (
      <div className="space-y-5">
        <Header />
        <div className="bg-bg-card border border-border rounded-xl p-8 space-y-6">
          <div className="text-center space-y-3">
            <p className="text-[15px] text-text-bright font-medium">Your creative profile is building...</p>

            {/* Progress bar */}
            <div className="max-w-xs mx-auto">
              <div className="h-2.5 bg-bg-elevated rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-[13px] text-text-muted mt-2">
                <span className="text-text-bright font-medium">{completed}</span> of {required} projects completed
              </p>
            </div>

            <p className="text-[13px] text-text-dim">
              Complete {remaining} more project{remaining !== 1 ? 's' : ''} to unlock your Taste Profile.
            </p>
          </div>

          <div className="border-t border-border/50 pt-5">
            <p className="text-[12px] text-text-muted mb-3">What you&apos;ll see:</p>
            <ul className="space-y-1.5 text-[13px] text-text-dim">
              <li>Your creative fingerprint — style, pace, and tool preferences</li>
              <li>Voice patterns the data reveals about your writing</li>
              <li>A portable profile you can copy into any AI tool</li>
              <li>Growth suggestions from your actual project data</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // ── Ready State ─────────────────────────────────────────────────────────

  const { stats, prose, generated_at } = data;
  if (!stats || !prose) return null;

  return (
    <div className="space-y-5">
      <Header />

      {error && <div className="text-[13px] text-red bg-red/5 border border-red/20 rounded-lg px-4 py-3">{error}</div>}

      {/* Meta line + refresh */}
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-text-dim">
          Based on <span className="text-text-bright font-medium">{stats.completed_projects} completed projects</span>
          {generated_at && (
            <span className="text-text-muted ml-2">
              · Updated {new Date(generated_at).toLocaleDateString()}
            </span>
          )}
        </p>
        <button
          onClick={fetchProfile}
          disabled={loading}
          className="text-[12px] text-text-muted hover:text-amber bg-transparent border border-border rounded px-3 py-1.5 cursor-pointer hover:border-amber/30 transition-colors disabled:opacity-50"
        >
          {loading ? 'Refreshing...' : 'Refresh Profile (1 credit)'}
        </button>
      </div>

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
              The Tastemaker reads your creative patterns across completed projects — no
              questionnaires, no setup. It watches what you actually do: which styles you
              pick, which hooks you write, how your scripts score, which AI tools you lean on.
            </p>
            <p>After 7 completed projects, it generates:</p>
            <ul className="space-y-1 pl-1">
              <li><strong className="text-text-bright">Creative Fingerprint</strong> — your default style, pace, hook type, and tool preferences</li>
              <li><strong className="text-text-bright">Voice Patterns</strong> — what the data reveals about your writing tendencies and blind spots</li>
              <li><strong className="text-text-bright">Portable Taste Profile</strong> — a one-page creative profile you can copy into ChatGPT, Claude, Gemini, or any AI tool. It&apos;s your YouTube persona, distilled.</li>
              <li><strong className="text-text-bright">Growth Suggestions</strong> — data-driven observations (not motivation) from your actual project history</li>
            </ul>
            <p>The profile gets sharper with every project. You can refresh it anytime after it unlocks.</p>
            <p className="text-text-muted">A project counts as &ldquo;completed&rdquo; when it has a script with 200+ words on the Write page.</p>
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
