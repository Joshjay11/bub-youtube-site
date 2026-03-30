'use client';

import { useState, useEffect, useCallback } from 'react';
import PromptRunner from '@/components/app/PromptRunner';
import { PROMPTS } from '@/lib/prompts';
import UpstreamContext from '@/components/app/UpstreamContext';
import RunningBrief from '@/components/app/RunningBrief';
import AIPromptsGuide from '@/components/app/AIPromptsGuide';
import { useProject } from '@/lib/project-context';
import { type ProjectBundle, loadProjectBundle, compileBrief } from '@/lib/project-bundle';
import { useProjectData, SaveIndicator } from '@/lib/use-project-data';

interface AllPromptsData {
  fields: Record<string, Record<string, string>>;
  outputs: Record<string, string>;
  kept: Record<string, string>;
  picks: Record<string, string>;
}

const DEFAULTS: AllPromptsData = { fields: {}, outputs: {}, kept: {}, picks: {} };

function buildPrefills(promptId: string, bundle: ProjectBundle): Record<string, string> {
  const idea = bundle.idea_entry?.currentIdea || '';
  const fw = bundle.framing_worksheet;
  const aa = bundle.audience_avatar;
  const vbm = bundle.viewer_belief_map;
  const rk = bundle.research_keeper?.notes?.trim() || '';
  const audience = [aa?.idealViewer, aa?.problem].filter(Boolean).join('. ') || '';

  switch (promptId) {
    case 'find-angle':
      return { topic: idea, obvious_take: vbm?.currentBelief || '', audience, channel_lens: fw?.oneSentence || '' };
    case 'cross-disciplinary':
      return { topic: idea };
    case 'counter-arguments':
      return { thesis: fw?.oneSentence || '' };
    case 'outline-from-research': {
      const brief = compileBrief(bundle);
      return { topic: idea, research_notes: rk || brief, angle: fw?.contrarianAngle || fw?.oneSentence || '', target_length: '12', video_type: '' };
    }
    case 'hook-variants':
      return { topic: idea, angle: fw?.contrarianAngle || fw?.oneSentence || '', title: '', audience_belief: vbm?.currentBelief || '' };
    default:
      return {};
  }
}

export default function AIPromptsPage() {
  const [activeId, setActiveId] = useState(PROMPTS[0].id);
  const activePrompt = PROMPTS.find((p) => p.id === activeId)!;
  const { currentProject } = useProject();
  const [bundle, setBundle] = useState<ProjectBundle | null>(null);
  const [bundleLoaded, setBundleLoaded] = useState(false);

  const { data, setData, saveStatus } = useProjectData<AllPromptsData>('ai_prompts_state', DEFAULTS);

  useEffect(() => {
    setBundleLoaded(false);
    if (!currentProject?.id) {
      setBundle(null);
      setBundleLoaded(true);
      return;
    }
    loadProjectBundle(currentProject.id)
      .then((b) => { setBundle(b); setBundleLoaded(true); })
      .catch(() => setBundleLoaded(true));
  }, [currentProject?.id]);

  const prefill = bundle ? buildPrefills(activeId, bundle) : {};

  const savedState = (data.fields?.[activeId] || data.outputs?.[activeId])
    ? { values: data.fields?.[activeId] || {}, output: data.outputs?.[activeId] || '' }
    : undefined;

  const handleStateChange = useCallback((state: { values: Record<string, string>; output: string }) => {
    setData((prev) => ({
      ...prev,
      fields: { ...prev.fields, [activeId]: state.values },
      outputs: { ...prev.outputs, [activeId]: state.output },
    }));
  }, [activeId, setData]);

  const handleKeepOutput = useCallback((output: string) => {
    setData((prev) => ({
      ...prev,
      kept: { ...prev.kept, [activePrompt.code.toLowerCase()]: output },
    }));
  }, [activePrompt.code, setData]);

  const keptOutput = data.kept?.[activePrompt.code.toLowerCase()] || null;

  const handlePickChange = useCallback((text: string) => {
    setData((prev) => ({
      ...prev,
      picks: { ...prev.picks, [activePrompt.code.toLowerCase()]: text },
    }));
  }, [activePrompt.code, setData]);

  const currentPick = data.picks?.[activePrompt.code.toLowerCase()] || '';

  // Listen for sidebar Save Progress button
  useEffect(() => {
    function handleSaveEvent() {
      setData((prev) => ({ ...prev }));
    }
    window.addEventListener('save-progress', handleSaveEvent);
    return () => window.removeEventListener('save-progress', handleSaveEvent);
  }, [setData]);

  if (!bundleLoaded) {
    return (
      <div>
        <h1 className="font-serif text-[32px] text-text-bright mb-2">AI Prompts</h1>
        <p className="text-text-dim text-[15px]">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <h1 className="font-serif text-[32px] text-text-bright">AI Prompts</h1>
        <SaveIndicator status={saveStatus} />
      </div>
      <p className="text-text-dim text-[15px] mb-2">
        Run AI-powered prompts for brainstorming, outlines, and retention analysis.
      </p>
      <p className="text-text-muted text-[13px] mb-8">
        Your work saves automatically as you go. Fields, outputs, and kept selections persist across sessions.
      </p>

      <UpstreamContext section="ai-prompts" />
      <AIPromptsGuide onSelectPrompt={(id) => setActiveId(id)} />

      {/* Tabs — green dot on tabs with kept output */}
      <div className="flex flex-wrap gap-2 mb-8">
        {PROMPTS.map((prompt) => {
          const code = prompt.code.toLowerCase();
          const hasKept = !!(data.picks?.[code]?.trim() || data.kept?.[code]);
          return (
            <button
              key={prompt.id}
              onClick={() => setActiveId(prompt.id)}
              className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all relative ${
                prompt.id === activeId
                  ? 'bg-amber text-bg'
                  : 'bg-bg-card text-text-dim border border-border hover:border-border-light hover:text-text-primary'
              }`}
            >
              <span className="text-[11px] opacity-70 mr-1.5">{prompt.code}</span>
              {prompt.title}
              {hasKept && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-green" title="Output kept" />}
            </button>
          );
        })}
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-[13px] font-mono text-amber bg-amber/10 px-2 py-0.5 rounded">{activePrompt.code}</span>
          <h2 className="font-serif text-[24px] text-text-bright">{activePrompt.title}</h2>
        </div>
        <p className="text-text-dim text-[14px]">{activePrompt.description}</p>
      </div>

      <PromptRunner
        key={`${activeId}-${currentProject?.id ?? 'none'}`}
        prompt={activePrompt}
        prefill={prefill}
        savedState={savedState}
        onStateChange={handleStateChange}
        onKeepOutput={handleKeepOutput}
        keptOutput={keptOutput}
        pick={currentPick}
        onPickChange={handlePickChange}
      />

      {/* Your Picks summary */}
      {Object.values(data.picks || {}).some((v) => v?.trim()) && (
        <div className="mt-8 bg-bg-card border border-border rounded-xl p-5">
          <h3 className="text-[14px] text-text-bright font-medium mb-3">Your Picks</h3>
          <div className="space-y-3">
            {Object.entries(data.picks || {}).map(([code, text]) => {
              if (!text?.trim()) return null;
              const p = PROMPTS.find((pr) => pr.code.toLowerCase() === code);
              return (
                <div key={code} className="text-[13px]">
                  <span className="text-amber font-mono mr-2">{p?.code || code.toUpperCase()}</span>
                  <span className="text-text-dim">{text.slice(0, 200)}{text.length > 200 ? '...' : ''}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-12">
        <RunningBrief />
      </div>

    </div>
  );
}
