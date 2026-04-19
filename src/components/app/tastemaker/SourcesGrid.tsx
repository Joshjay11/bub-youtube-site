'use client';

import SourceCard from './SourceCard';
import type { Source } from './types';

interface SourcesGridProps {
  sources: Source[];
  onToggle: (id: string, included: boolean) => void;
  onExpand: (source: Source) => void;
  onDelete?: (id: string) => void;
}

export default function SourcesGrid({ sources, onToggle, onExpand, onDelete }: SourcesGridProps) {
  if (sources.length === 0) {
    return (
      <div className="bg-bg-card border border-border rounded-xl p-8 text-center">
        <p className="text-[13px] text-text-dim">
          No sources yet. Complete projects in the Script Studio or upload voice samples to feed your Tastemaker.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {sources.map((source) => (
        <SourceCard
          key={`${source.kind}-${source.id}`}
          source={source}
          onToggle={onToggle}
          onExpand={onExpand}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
