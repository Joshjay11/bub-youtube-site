'use client';

import { useRef } from 'react';
import { useProjectData, SaveIndicator } from '@/lib/use-project-data';
import { useRegisterPageContext } from '@/contexts/PageContextProvider';

interface KeeperData {
  notes: string;
}

const DEFAULTS: KeeperData = { notes: '' };

interface ResearchKeeperProps {
  appendRef: React.MutableRefObject<((text: string) => void) | null>;
}

export default function ResearchKeeper({ appendRef }: ResearchKeeperProps) {
  const { data, setData, saveStatus } = useProjectData<KeeperData>('research_keeper', DEFAULTS);

  // Expose append function so TopicResearch can add to notes
  appendRef.current = (text: string) => {
    setData((prev) => ({
      notes: prev.notes ? `${prev.notes}\n\n${text}` : text,
    }));
  };

  const wrapperRef = useRef<HTMLDivElement>(null);
  useRegisterPageContext('research_keeper', 'Research Keeper', () => {
    const notes = (data.notes ?? '').trim();
    return `Tool: Research Keeper\nSaved notes: ${notes ? notes.slice(0, 500) + (notes.length > 500 ? '...' : '') : '(empty)'}`;
  }, wrapperRef);

  return (
    <div ref={wrapperRef} className="space-y-4">
      <div className="flex items-center gap-3">
        <div>
          <h2 className="font-serif text-[22px] text-text-bright">Keep for Your Script</h2>
          <p className="text-text-dim text-[13px] mt-1">
            Save anything from your research that you want in the final video. These notes follow you through every stage.
          </p>
        </div>
        <SaveIndicator status={saveStatus} />
      </div>

      <textarea
        value={data.notes ?? ''}
        onChange={(e) => setData({ notes: e.target.value })}
        placeholder="Click 'Keep this' on any research finding above, or type your own notes here..."
        rows={8}
        className="w-full bg-bg-card border border-border rounded-xl px-5 py-4 text-[14px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber/50 focus:ring-1 focus:ring-amber/20 transition-colors resize-y leading-relaxed"
      />

      {(data.notes ?? '').trim() && (
        <div className="text-[12px] text-text-muted">
          {(data.notes ?? '').trim().split(/\s+/).length} words saved
        </div>
      )}
    </div>
  );
}
