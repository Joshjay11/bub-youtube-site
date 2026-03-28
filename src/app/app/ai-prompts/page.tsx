'use client';

import { useState, useEffect } from 'react';
import PromptRunner from '@/components/app/PromptRunner';
import { PROMPTS } from '@/lib/prompts';
import UpstreamContext from '@/components/app/UpstreamContext';
import RunningBrief from '@/components/app/RunningBrief';
import { useProject } from '@/lib/project-context';
import { type ProjectBundle, loadProjectBundle, compileBrief } from '@/lib/project-bundle';

function buildPrefills(promptId: string, bundle: ProjectBundle): Record<string, string> {
  const idea = bundle.idea_entry?.currentIdea || '';
  const fw = bundle.framing_worksheet;
  const aa = bundle.audience_avatar;
  const vbm = bundle.viewer_belief_map;
  const rk = bundle.research_keeper?.notes?.trim() || '';

  const audience = [aa?.idealViewer, aa?.problem].filter(Boolean).join('. ') || '';

  switch (promptId) {
    case 'find-angle': // 3A
      return {
        topic: idea,
        obvious_take: '', // Hard to auto-derive the "obvious" take — leave for user
        audience,
        channel_lens: fw?.oneSentence || '',
      };

    case 'cross-disciplinary': // 3B
      return {
        topic: idea,
      };

    case 'counter-arguments': // 3C
      return {
        thesis: fw?.oneSentence || '',
      };

    case 'outline-from-research': { // 3D — dump the full brief
      const brief = compileBrief(bundle);
      return {
        topic: idea,
        research_notes: rk || brief,
        angle: fw?.contrarianAngle || fw?.oneSentence || '',
        target_length: '12',
        video_type: '',
      };
    }

    case 'hook-variants': // 3E
      return {
        topic: idea,
        angle: fw?.contrarianAngle || fw?.oneSentence || '',
        title: '', // User defines title
        audience_belief: vbm?.currentBelief || '',
      };

    case 'script-audit': // 3F
      return {
        script: '', // User pastes script
      };

    case 'compression-check': // 3G
      return {
        section: '', // User pastes section
      };

    case 'output-quality-scorecard': // 3H
      return {
        ai_output: '', // User pastes AI output
      };

    default:
      return {};
  }
}

export default function AIPromptsPage() {
  const [activeId, setActiveId] = useState(PROMPTS[0].id);
  const activePrompt = PROMPTS.find((p) => p.id === activeId)!;
  const { currentProject } = useProject();
  const [bundle, setBundle] = useState<ProjectBundle | null>(null);

  useEffect(() => {
    if (!currentProject?.id) {
      setBundle(null);
      return;
    }
    loadProjectBundle(currentProject.id).then(setBundle).catch(() => {});
  }, [currentProject?.id]);

  const prefill = bundle ? buildPrefills(activeId, bundle) : {};

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

      {/* PromptRunner keyed to force remount on switch, with prefill from upstream */}
      <PromptRunner key={`${activeId}-${currentProject?.id ?? 'none'}`} prompt={activePrompt} prefill={prefill} />

      <div className="mt-12">
        <RunningBrief />
      </div>
    </div>
  );
}
