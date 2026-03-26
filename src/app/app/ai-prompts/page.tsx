'use client';

import { useState } from 'react';
import PromptRunner from '@/components/app/PromptRunner';
import { PROMPTS } from '@/lib/prompts';
import UpstreamContext from '@/components/app/UpstreamContext';
import RunningBrief from '@/components/app/RunningBrief';

export default function AIPromptsPage() {
  const [activeId, setActiveId] = useState(PROMPTS[0].id);
  const activePrompt = PROMPTS.find((p) => p.id === activeId)!;

  return (
    <div>
      <h1 className="font-serif text-[32px] text-text-bright mb-2">AI Prompts</h1>
      <p className="text-text-dim text-[15px] mb-2">
        Run AI-powered prompts for brainstorming, outlines, and retention analysis.
      </p>
      <p className="text-text-muted text-[13px] mb-8">
        These are thinking-partner prompts — not &quot;make me a script&quot; prompts. Always edit the output. Your voice goes in AFTER the AI helps with structure.
      </p>

      <UpstreamContext section="ai-prompts" />

      {/* Prompt selector tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {PROMPTS.map((prompt) => (
          <button
            key={prompt.id}
            onClick={() => setActiveId(prompt.id)}
            className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${
              prompt.id === activeId
                ? 'bg-amber text-bg'
                : 'bg-bg-card text-text-dim border border-border hover:border-border-light hover:text-text-primary'
            }`}
          >
            <span className="text-[11px] opacity-70 mr-1.5">{prompt.code}</span>
            {prompt.title}
          </button>
        ))}
      </div>

      {/* Active prompt header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-[13px] font-mono text-amber bg-amber/10 px-2 py-0.5 rounded">{activePrompt.code}</span>
          <h2 className="font-serif text-[24px] text-text-bright">{activePrompt.title}</h2>
        </div>
        <p className="text-text-dim text-[14px]">{activePrompt.description}</p>
      </div>

      {/* PromptRunner keyed to force remount on switch */}
      <PromptRunner key={activeId} prompt={activePrompt} />

      <div className="mt-12">
        <RunningBrief />
      </div>
    </div>
  );
}
