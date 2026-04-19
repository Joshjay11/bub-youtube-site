'use client';

import { useState } from 'react';

export type VariationKey = 'teach' | 'argue' | 'connect';

export interface VariationMeta {
  name: string;
  tagline: string;
  metaphor: string;
  accent: string;
}

export const VARIATION_META: Record<VariationKey, VariationMeta> = {
  teach: {
    name: 'Teach Mode',
    tagline: 'For explainers, tutorials, and deep dives.',
    metaphor: "You're standing in a lecture hall.",
    accent: '#60a5fa',
  },
  argue: {
    name: 'Argue Mode',
    tagline: 'For commentary, reactions, and hot takes.',
    metaphor: "You're standing in a stadium.",
    accent: '#f87171',
  },
  connect: {
    name: 'Connect Mode',
    tagline: 'For vlogs, personal stories, and community updates.',
    metaphor: "You're standing in a living room.",
    accent: '#34d399',
  },
};

interface VariationCardProps {
  variation: VariationKey;
  profileMarkdown: string;
  onViewFull: (variation: VariationKey) => void;
}

export default function VariationCard({ variation, profileMarkdown, onViewFull }: VariationCardProps) {
  const meta = VARIATION_META[variation];
  const [copied, setCopied] = useState(false);

  async function copyProfile() {
    await navigator.clipboard.writeText(profileMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div
      className="bg-bg-card border border-border rounded-xl p-5 flex flex-col gap-3 hover:border-opacity-60 transition-colors"
      style={{ borderTopColor: meta.accent, borderTopWidth: '3px' }}
    >
      <div>
        <h4 className="text-[15px] font-medium text-text-bright">{meta.name}</h4>
        <p className="text-[12px] text-text-dim mt-1">{meta.tagline}</p>
        <p className="text-[11px] text-text-muted italic mt-1">{meta.metaphor}</p>
      </div>

      <div className="mt-auto flex items-center gap-2">
        <button
          onClick={copyProfile}
          disabled={!profileMarkdown}
          className="text-[12px] text-bg bg-amber hover:bg-amber-bright rounded px-3 py-1.5 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {copied ? 'Copied!' : 'Copy Profile'}
        </button>
        <button
          onClick={() => onViewFull(variation)}
          disabled={!profileMarkdown}
          className="text-[12px] text-text-dim hover:text-text-bright bg-transparent border border-border rounded px-3 py-1.5 cursor-pointer hover:border-amber/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          View Full Profile
        </button>
      </div>
    </div>
  );
}
