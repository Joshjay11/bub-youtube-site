'use client';

import { useState } from 'react';
import { useEscapeKey } from '@/lib/use-escape-key';
import VariationCard, { VARIATION_META, type VariationKey } from './VariationCard';

export interface Variations {
  teach: string;
  argue: string;
  connect: string;
}

interface VariationsSectionProps {
  variations: Variations;
}

const ORDER: VariationKey[] = ['teach', 'argue', 'connect'];

export default function VariationsSection({ variations }: VariationsSectionProps) {
  const [open, setOpen] = useState<VariationKey | null>(null);

  useEscapeKey(() => setOpen(null), open !== null);

  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-[14px] font-medium text-text-bright">Voice Variations</h3>
        <p className="text-[12px] text-text-dim mt-0.5">
          Same creator, different rooms. Each variation adapts your voice to a creative situation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {ORDER.map((key) => (
          <VariationCard
            key={key}
            variation={key}
            profileMarkdown={variations[key] ?? ''}
            onViewFull={setOpen}
          />
        ))}
      </div>

      {open && (
        <FullProfileModal
          variation={open}
          markdown={variations[open] ?? ''}
          onClose={() => setOpen(null)}
        />
      )}
    </section>
  );
}

function FullProfileModal({
  variation,
  markdown,
  onClose,
}: {
  variation: VariationKey;
  markdown: string;
  onClose: () => void;
}) {
  const meta = VARIATION_META[variation];
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-bg-card border border-border rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="px-5 py-4 border-b border-border/50 flex items-center justify-between"
          style={{ borderTopColor: meta.accent, borderTopWidth: '3px', borderTopStyle: 'solid' }}
        >
          <div>
            <h3 className="text-[16px] font-medium text-text-bright">{meta.name}</h3>
            <p className="text-[12px] text-text-muted italic mt-0.5">{meta.metaphor}</p>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-bright bg-transparent border-none cursor-pointer text-[20px] leading-none p-1"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="bg-bg-elevated border border-border/50 rounded-lg px-4 py-3">
            <pre className="text-[13px] text-text-dim whitespace-pre-wrap font-sans leading-relaxed">
              {markdown}
            </pre>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-border/50 flex items-center justify-end gap-2">
          <button
            onClick={copy}
            disabled={!markdown}
            className="text-[12px] text-bg bg-amber hover:bg-amber-bright rounded px-3 py-1.5 cursor-pointer transition-colors disabled:opacity-50 font-medium"
          >
            {copied ? 'Copied!' : 'Copy Profile'}
          </button>
          <button
            onClick={onClose}
            className="text-[12px] text-text-dim hover:text-text-bright bg-transparent border border-border rounded px-3 py-1.5 cursor-pointer hover:border-amber/30 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
