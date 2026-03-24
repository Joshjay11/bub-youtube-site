'use client';

import { useState, useMemo } from 'react';
import { HOOKS, HOOK_TYPES, NICHES, CHANNEL_SIZES, type Hook } from '@/lib/hooks-data';

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 9 ? 'bg-green/10 text-green' : score >= 7 ? 'bg-amber/10 text-amber' : 'bg-red/10 text-red';
  return <span className={`inline-block px-2 py-0.5 rounded text-[12px] font-bold ${color}`}>{score}/10</span>;
}

function TypeTag({ type }: { type: string }) {
  const label = HOOK_TYPES.find((t) => t.value === type)?.label || type;
  return <span className="inline-block bg-bg-elevated text-text-dim text-[11px] px-2 py-0.5 rounded">{label}</span>;
}

function NicheTag({ niche }: { niche: string }) {
  return <span className="inline-block bg-bg-elevated text-text-muted text-[11px] px-2 py-0.5 rounded capitalize">{niche}</span>;
}

export default function HookLibrary() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [nicheFilter, setNicheFilter] = useState<string>('all');
  const [sizeFilter, setSizeFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    return HOOKS.filter((hook) => {
      if (typeFilter !== 'all' && hook.hook_type !== typeFilter) return false;
      if (nicheFilter !== 'all' && hook.niche !== nicheFilter) return false;
      if (sizeFilter !== 'all' && hook.channel_size !== sizeFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          hook.hook_text.toLowerCase().includes(q) ||
          hook.creator.toLowerCase().includes(q) ||
          hook.video_title.toLowerCase().includes(q) ||
          hook.steal_this_structure.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [search, typeFilter, nicheFilter, sizeFilter]);

  function clearFilters() {
    setSearch('');
    setTypeFilter('all');
    setNicheFilter('all');
    setSizeFilter('all');
  }

  const hasFilters = search || typeFilter !== 'all' || nicheFilter !== 'all' || sizeFilter !== 'all';

  return (
    <div className="space-y-6">
      {/* Search + Filters */}
      <div className="space-y-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search hooks by text, creator, or structure..."
          className="w-full bg-bg-card border border-border rounded-xl px-4 py-3 text-[14px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber/50 focus:ring-1 focus:ring-amber/20 transition-colors"
        />

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Hook Type */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-bg-card border border-border rounded-lg px-3 py-2 text-[13px] text-text-primary focus:outline-none focus:border-amber/50"
          >
            <option value="all">All Types</option>
            {HOOK_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          {/* Niche */}
          <select
            value={nicheFilter}
            onChange={(e) => setNicheFilter(e.target.value)}
            className="bg-bg-card border border-border rounded-lg px-3 py-2 text-[13px] text-text-primary focus:outline-none focus:border-amber/50"
          >
            <option value="all">All Niches</option>
            {NICHES.map((n) => (
              <option key={n} value={n} className="capitalize">{n.charAt(0).toUpperCase() + n.slice(1)}</option>
            ))}
          </select>

          {/* Channel Size */}
          <select
            value={sizeFilter}
            onChange={(e) => setSizeFilter(e.target.value)}
            className="bg-bg-card border border-border rounded-lg px-3 py-2 text-[13px] text-text-primary focus:outline-none focus:border-amber/50"
          >
            <option value="all">All Sizes</option>
            {CHANNEL_SIZES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          <span className="text-[13px] text-text-muted">{filtered.length} hook{filtered.length !== 1 ? 's' : ''}</span>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-[13px] text-text-muted hover:text-text-dim transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Hook Cards */}
      <div className="space-y-3">
        {filtered.map((hook) => (
          <HookCard
            key={hook.id}
            hook={hook}
            isExpanded={expandedId === hook.id}
            onToggle={() => setExpandedId(expandedId === hook.id ? null : hook.id)}
          />
        ))}

        {filtered.length === 0 && (
          <div className="bg-bg-card border border-border rounded-xl p-10 text-center text-text-muted">
            No hooks match your filters.
          </div>
        )}
      </div>
    </div>
  );
}

function HookCard({ hook, isExpanded, onToggle }: { hook: Hook; isExpanded: boolean; onToggle: () => void }) {
  return (
    <div className={`bg-bg-card border rounded-xl transition-colors ${isExpanded ? 'border-amber/30' : 'border-border hover:border-border-light'}`}>
      <button onClick={onToggle} className="w-full text-left p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-[15px] text-text-bright leading-snug mb-2">&ldquo;{hook.hook_text}&rdquo;</p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[12px] text-text-dim">{hook.creator}</span>
              <span className="text-text-muted">·</span>
              <TypeTag type={hook.hook_type} />
              <NicheTag niche={hook.niche} />
              <span className={`text-[11px] capitalize ${
                hook.channel_size === 'large' ? 'text-text-dim' : hook.channel_size === 'mid' ? 'text-amber-dim' : 'text-green'
              }`}>
                {hook.channel_size}
              </span>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-3">
            <ScoreBadge score={hook.score} />
            <svg
              className={`w-4 h-4 text-text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="px-5 pb-5 border-t border-border/50 pt-4 space-y-4">
          <div className="text-[12px] text-text-muted italic mb-1">{hook.video_title}</div>

          <div>
            <div className="text-[12px] text-amber font-medium mb-1">Why it works</div>
            <p className="text-[13px] text-text-dim leading-relaxed">{hook.why_it_works}</p>
          </div>

          <div>
            <div className="text-[12px] text-text-bright font-medium mb-1">What you&apos;d change</div>
            <p className="text-[13px] text-text-dim leading-relaxed">{hook.what_youd_change}</p>
          </div>

          <div className="bg-bg-elevated border border-border rounded-lg p-4">
            <div className="text-[12px] text-green font-medium mb-1">Steal-this-structure</div>
            <p className="text-[14px] text-text-bright font-mono leading-relaxed">{hook.steal_this_structure}</p>
          </div>

          <div className="flex gap-4 text-[12px]">
            <div>
              <span className="text-text-muted">Best for: </span>
              <span className="text-text-dim">{hook.best_for}</span>
            </div>
          </div>
          <div className="text-[12px]">
            <span className="text-text-muted">Avoid for: </span>
            <span className="text-text-dim">{hook.avoid_for}</span>
          </div>
        </div>
      )}
    </div>
  );
}
