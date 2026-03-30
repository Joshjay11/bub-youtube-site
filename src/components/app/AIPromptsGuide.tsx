'use client';

import { useState } from 'react';

const PHASE_1 = [
  { code: '3A', id: 'find-angle', title: 'Find the Angle', desc: 'Get 5 fresh angles your audience hasn\'t heard' },
  { code: '3B', id: 'cross-disciplinary', title: 'Cross-Disciplinary Connection', desc: 'Find the unexpected link that makes your video original' },
  { code: '3C', id: 'counter-arguments', title: 'Counter-Arguments', desc: 'Know the strongest objections before your commenters do' },
  { code: '3D', id: 'outline-from-research', title: 'Outline from Research', desc: 'Turn all your upstream work into a structured beat map' },
  { code: '3E', id: 'hook-variants', title: 'Hook Variants', desc: 'Second pass on hooks if you\'ve updated your angle' },
];

const PHASE_2 = [
  { code: '3F', id: 'outline-audit', title: 'Outline Audit', desc: 'Check your outline for structural problems before writing' },
];

const FLOWS = [
  { label: 'Quick Path', desc: 'most videos', steps: '3A → 3D → 3F → Write' },
  { label: 'Deep Path', desc: 'important videos', steps: '3A → 3B → 3C → 3D → 3F → Write' },
  { label: 'Polish Only', desc: 'after writing', steps: 'Refine page (Editor\'s Table + Compression)' },
];

interface AIPromptsGuideProps {
  onSelectPrompt?: (promptId: string) => void;
}

export default function AIPromptsGuide({ onSelectPrompt }: AIPromptsGuideProps) {
  const [expanded, setExpanded] = useState(false);

  function handleDownload() {
    fetch('/guides/ai-prompts-guide.md')
      .then((r) => r.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'BUB_AI_Prompts_Reference_Guide.md';
        a.click();
        URL.revokeObjectURL(url);
      });
  }

  function PromptLink({ code, id, title, desc }: { code: string; id: string; title: string; desc: string }) {
    return (
      <button
        onClick={() => onSelectPrompt?.(id)}
        className="w-full text-left flex items-start gap-3 px-3 py-2 rounded-lg hover:bg-bg-card-hover/50 transition-colors bg-transparent border-none cursor-pointer group"
      >
        <span className="text-[11px] font-mono text-amber bg-amber/10 px-1.5 py-0.5 rounded shrink-0 mt-0.5">{code}</span>
        <div className="min-w-0">
          <span className="text-[13px] text-text-bright group-hover:text-amber transition-colors">{title}</span>
          <span className="text-[12px] text-text-muted ml-1.5">— {desc}</span>
        </div>
      </button>
    );
  }

  return (
    <div className="bg-bg-card border border-border rounded-xl mb-6 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-3 text-left bg-transparent border-none cursor-pointer"
      >
        <div className="flex items-center gap-2 min-w-0">
          <svg
            className={`w-3.5 h-3.5 text-text-muted transition-transform shrink-0 ${expanded ? 'rotate-90' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-[14px] text-text-bright font-medium">How to Use This Page</span>
          {!expanded && (
            <span className="text-[12px] text-text-muted ml-2">6 prompts, 2 phases — click to see the recommended flow</span>
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-border/50 pt-4 space-y-6">
          {/* Intro */}
          <p className="text-[13px] text-text-dim leading-relaxed">
            These prompts help you THINK, not write. Phase 1 is for before you draft. Phase 2 is for after you have script text.
          </p>

          {/* Phase 1 */}
          <div>
            <h3 className="text-[13px] text-amber font-medium uppercase tracking-wider mb-2">Phase 1: Pre-Writing</h3>
            <div className="space-y-0.5">
              {PHASE_1.map((p) => (
                <PromptLink key={p.id} {...p} />
              ))}
            </div>
          </div>

          {/* Phase 2 */}
          <div>
            <h3 className="text-[13px] text-amber font-medium uppercase tracking-wider mb-2">Phase 2: Post-Writing</h3>
            <div className="space-y-0.5">
              {PHASE_2.map((p) => (
                <PromptLink key={p.id} {...p} />
              ))}
            </div>
          </div>

          {/* Recommended flows */}
          <div>
            <h3 className="text-[13px] text-text-bright font-medium mb-3">Recommended Flow</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {FLOWS.map((flow) => (
                <div key={flow.label} className="bg-bg-elevated border border-border/50 rounded-lg px-3 py-2.5">
                  <div className="text-[13px] text-text-bright font-medium">{flow.label}</div>
                  <div className="text-[11px] text-text-muted mb-1">({flow.desc})</div>
                  <div className="text-[12px] text-amber font-mono">{flow.steps}</div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[12px] text-text-muted">
            After writing your script on the Write page, use the <a href="/app/refine" className="text-amber hover:text-amber-bright">Refine page</a> for compression checks, AI quality scoring, and editorial cleanup.
          </p>

          {/* Download */}
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 text-[12px] text-text-muted hover:text-text-dim transition-colors bg-transparent border border-border rounded-lg px-3 py-2 cursor-pointer hover:border-border-light"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Download Full Guide (Markdown)
          </button>
        </div>
      )}
    </div>
  );
}
