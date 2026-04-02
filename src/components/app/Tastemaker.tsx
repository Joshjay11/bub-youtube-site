'use client';

import { useState, useEffect, useRef } from 'react';
import { notifyCreditChange } from '@/components/app/CreditHealthBar';

// ─── Friendly Label Maps ────────────────────────────────────────────────────

const WRITER_LABELS: Record<string, string> = {
  writer_a: 'Writer A (Claude)',
  writer_b: 'Writer B (Minimax)',
  writer_c: 'Writer C (Grok)',
};

const EDITOR_LABELS: Record<string, string> = {
  hemingway: 'Cut the Fat',
  asimov: 'Make It Clear',
  bukowski: 'Call the BS',
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
  preferred_editor: ModeResult | null;
  preferred_hook: ModeResult | null;
  avg_word_count: number;
  avg_slop_score: number;
  research_usage_rate: number;
}

interface TastemakerData {
  status: 'building' | 'ready';
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

const CACHE_KEY = 'bub_tastemaker_cache';

function loadCache(): TastemakerData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveCache(data: TastemakerData) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch { /* non-blocking */ }
}

// ─── Markdown Renderer (simple) ─────────────────────────────────────────────

function SimpleMarkdown({ content }: { content: string }) {
  // Convert markdown to basic HTML
  const html = content
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="text-amber bg-amber/10 px-1 rounded text-[12px]">$1</code>')
    .replace(/^[-*] (.+)$/gm, '<li class="ml-4 mb-1">$1</li>')
    .replace(/^→ (.+)$/gm, '<li class="ml-4 mb-1 list-none"><span class="text-amber mr-1">&rarr;</span>$1</li>')
    .replace(/(<li.*<\/li>\n?)+/g, '<ul class="list-disc space-y-0.5 mb-3">$&</ul>')
    .replace(/\n\n/g, '<br/><br/>');

  return (
    <div
      className="text-[13px] text-text-dim leading-relaxed prose-compact"
      dangerouslySetInnerHTML={{ __html: html }}
    />
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

  async function fetchProfile() {
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
        setData(result);
        saveCache(result);
        if (result.status === 'ready') notifyCreditChange();
      }
    } catch {
      setError('Connection error.');
    }
    setLoading(false);
  }

  // Load cache on mount, then fetch
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const cached = loadCache();
    if (cached) setData(cached);
    fetchProfile();
  }, []);

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
    const required = data?.required || 5;
    const remaining = data?.remaining || (5 - completed);
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
          <StatCell label="Editor" value={stats.preferred_editor ? `${friendlyLabel(stats.preferred_editor.value, EDITOR_LABELS)} (${stats.preferred_editor.count}/${stats.completed_projects})` : 'No clear pref'} />
          <StatCell label="Hook" value={stats.preferred_hook ? `${stats.preferred_hook.value} (${stats.preferred_hook.count}/${stats.completed_projects})` : 'No clear pref'} />
          <StatCell label="Research" value={`Used on ${stats.research_usage_rate}% of projects`} />
          <StatCell label="Avg Words" value={`${stats.avg_word_count.toLocaleString()}`} />
          <StatCell label="Slop Score" value={`${stats.avg_slop_score} avg`} />
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
          <pre className="text-[12px] text-text-primary font-mono leading-relaxed whitespace-pre-wrap">{prose.portable_profile}</pre>
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
  return (
    <div>
      <h2 className="font-serif text-[22px] text-text-bright">Tastemaker</h2>
      <p className="text-text-dim text-[13px] mt-1">Your creative patterns, distilled from your project data.</p>
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
