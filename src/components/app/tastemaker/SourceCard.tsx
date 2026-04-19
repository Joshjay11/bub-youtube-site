'use client';

import { SOURCE_BADGE_LABELS, type Source } from './types';

interface SourceCardProps {
  source: Source;
  onToggle: (id: string, included: boolean) => void;
  onExpand: (source: Source) => void;
  onDelete?: (id: string) => void;
}

export default function SourceCard({ source, onToggle, onExpand, onDelete }: SourceCardProps) {
  const badge = SOURCE_BADGE_LABELS[source.sourceType];
  const kindLabel = source.kind === 'project' ? 'Project' : 'Voice Sample';
  const dim = !source.included;

  return (
    <div
      className={`relative bg-bg-card border border-border rounded-xl p-4 flex flex-col gap-3 transition-all cursor-pointer group hover:border-amber/30 ${dim ? 'opacity-40' : ''}`}
      onClick={() => onExpand(source)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="shrink-0 w-9 h-9 rounded-lg bg-bg-elevated border border-border/50 flex items-center justify-center">
            <span className="text-[9px] font-bold tracking-wider text-text-muted">{badge}</span>
          </div>
          <span className="text-[10px] uppercase tracking-wider text-text-muted">{kindLabel}</span>
        </div>
        <label
          className="relative inline-flex items-center cursor-pointer shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={source.included}
            onChange={(e) => onToggle(source.id, e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-8 h-4 bg-bg-elevated border border-border rounded-full peer-checked:bg-amber/30 peer-checked:border-amber/50 transition-colors relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-text-muted peer-checked:after:bg-amber after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-4" />
        </label>
      </div>

      <p className="text-[13px] font-medium text-text-bright line-clamp-2 leading-snug">
        {source.title}
      </p>

      <div className="mt-auto flex items-center justify-between text-[11px] text-text-muted">
        <span>{source.wordCount.toLocaleString()} words</span>
        <span>{new Date(source.createdAt).toLocaleDateString()}</span>
      </div>

      {dim && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-wider text-text-muted bg-bg-elevated/80 px-2 py-0.5 rounded">
          Excluded
        </div>
      )}

      {onDelete && source.kind === 'voice_sample' && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(source.id);
          }}
          className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-[11px] text-text-muted hover:text-red bg-bg-elevated border border-border rounded px-2 py-1 cursor-pointer"
        >
          Delete
        </button>
      )}
    </div>
  );
}
