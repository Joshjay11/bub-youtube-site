'use client';

import { useState, useRef } from 'react';
import { useProject } from '@/lib/project-context';
import { useProjectData, SaveIndicator } from '@/lib/use-project-data';
import { useRegisterPageContext } from '@/contexts/PageContextProvider';
import { notifyCreditChange } from '@/components/app/CreditHealthBar';

interface WriterData {
  script_draft: string;
  selected_model: string;
  word_count: number;
  draft_a_output: string;
  draft_b_output: string;
}

const DEFAULTS: WriterData = { script_draft: '', selected_model: '', word_count: 0, draft_a_output: '', draft_b_output: '' };

export default function DualModelWriter() {
  const { currentProject } = useProject();
  const { data, setData, saveStatus } = useProjectData<WriterData>('write', DEFAULTS);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [draftA, setDraftA] = useState(data.draft_a_output || '');
  const [draftB, setDraftB] = useState(data.draft_b_output || '');
  const [wcA, setWcA] = useState(0);
  const [wcB, setWcB] = useState(0);
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    if (!currentProject?.id || loading) return;
    setLoading(true);
    setError('');
    setDraftA('');
    setDraftB('');

    try {
      const [resA, resB] = await Promise.allSettled([
        fetch('/api/ai/generate-script', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId: currentProject.id, model: 'sonnet' }),
        }).then((r) => r.json()),
        fetch('/api/ai/generate-script', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId: currentProject.id, model: 'mistral-creative' }),
        }).then((r) => r.json()),
      ]);

      if (resA.status === 'fulfilled' && resA.value.script) {
        setDraftA(resA.value.script);
        setWcA(resA.value.wordCount || 0);
      } else {
        setDraftA('Generation failed. ' + (resA.status === 'fulfilled' ? resA.value.error : resA.reason));
      }

      if (resB.status === 'fulfilled' && resB.value.script) {
        setDraftB(resB.value.script);
        setWcB(resB.value.wordCount || 0);
      } else {
        setDraftB('Generation failed. ' + (resB.status === 'fulfilled' ? resB.value.error : resB.reason));
      }

      notifyCreditChange();
    } catch {
      setError('Connection error. Please try again.');
    }

    setLoading(false);
  }

  function chooseDraft(which: 'a' | 'b') {
    const script = which === 'a' ? draftA : draftB;
    const model = which === 'a' ? 'sonnet' : 'mistral-creative';
    const wc = script.trim().split(/\s+/).length;
    setData({ script_draft: script, selected_model: model, word_count: wc, draft_a_output: draftA, draft_b_output: draftB });

    // Log model preference (fire-and-forget)
    if (currentProject?.id) {
      fetch('/api/projects/model-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProject.id,
          chosenModel: model,
          rejectedModel: model === 'sonnet' ? 'mistral-creative' : 'sonnet',
        }),
      }).catch(() => {});
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(data.script_draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const wrapperRef = useRef<HTMLDivElement>(null);
  useRegisterPageContext('dual_model_writer', 'Script Generator', () => {
    if (!data.script_draft) return 'Tool: Script Generator\nStatus: No script generated yet';
    return `Tool: Script Generator\nSelected model: ${data.selected_model}\nWord count: ${data.word_count}\nFirst 200 words: ${data.script_draft.slice(0, 800)}`;
  }, wrapperRef);

  const hasDrafts = draftA.length > 0 || draftB.length > 0;

  return (
    <div ref={wrapperRef} className="space-y-6">
      <div className="flex items-center gap-3">
        <div>
          <h2 className="font-serif text-[24px] text-text-bright">Generate Full Script</h2>
          <p className="text-text-dim text-[13px] mt-1">
            Your outline and research generate a full spoken-word script. You&apos;ll get drafts from two AI writers — pick the one that sounds more like you.
          </p>
        </div>
        <SaveIndicator status={saveStatus} />
      </div>

      <button
        onClick={handleGenerate}
        disabled={!currentProject?.id || loading}
        className="flex items-center gap-2 px-5 py-2.5 bg-amber text-bg text-[14px] font-medium rounded-xl border-none cursor-pointer transition-all hover:bg-amber-bright hover:text-bg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading && (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {loading ? 'Generating from two models...' : 'Generate Script'} <span className="text-[12px] opacity-70">(2 credits)</span>
      </button>

      {error && <div className="text-[13px] text-red bg-red/5 border border-red/20 rounded-lg px-4 py-3">{error}</div>}

      {hasDrafts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border flex items-center justify-between">
              <div><div className="text-[14px] text-text-bright font-medium">Writer A</div><div className="text-[11px] text-text-muted">Claude Sonnet</div></div>
              {wcA > 0 && <span className="text-[12px] text-text-muted font-mono">{wcA} words</span>}
            </div>
            <div className="px-5 py-4 max-h-[400px] overflow-y-auto">
              <div className="text-[13px] text-text-primary leading-relaxed whitespace-pre-wrap">{draftA}</div>
            </div>
            <div className="px-5 py-3 border-t border-border">
              <button onClick={() => chooseDraft('a')} className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${data.selected_model === 'sonnet' ? 'bg-green/10 text-green border border-green/20' : 'bg-amber/10 text-amber border border-amber/20 hover:bg-amber/20'}`}>
                {data.selected_model === 'sonnet' ? 'Chosen ✓' : 'Choose This Draft'}
              </button>
            </div>
          </div>
          <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border flex items-center justify-between">
              <div><div className="text-[14px] text-text-bright font-medium">Writer B</div><div className="text-[11px] text-text-muted">Mistral Creative</div></div>
              {wcB > 0 && <span className="text-[12px] text-text-muted font-mono">{wcB} words</span>}
            </div>
            <div className="px-5 py-4 max-h-[400px] overflow-y-auto">
              <div className="text-[13px] text-text-primary leading-relaxed whitespace-pre-wrap">{draftB}</div>
            </div>
            <div className="px-5 py-3 border-t border-border">
              <button onClick={() => chooseDraft('b')} className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${data.selected_model === 'mistral-creative' ? 'bg-green/10 text-green border border-green/20' : 'bg-amber/10 text-amber border border-amber/20 hover:bg-amber/20'}`}>
                {data.selected_model === 'mistral-creative' ? 'Chosen ✓' : 'Choose This Draft'}
              </button>
            </div>
          </div>
        </div>
      )}

      {data.script_draft && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[16px] text-text-bright font-medium">Your Script</h3>
              <span className="text-[12px] text-text-muted">Selected: {data.selected_model === 'sonnet' ? 'Claude Sonnet' : 'Mistral Creative'} — {data.word_count} words (~{Math.round(data.word_count / 150)} min)</span>
            </div>
            <button onClick={handleCopy} className="flex items-center gap-1.5 text-[12px] text-text-muted hover:text-text-dim transition-colors bg-transparent border border-border rounded-lg px-3 py-1.5 cursor-pointer hover:border-border-light">
              {copied ? 'Copied ✓' : 'Copy Script'}
            </button>
          </div>
          <textarea
            value={data.script_draft}
            onChange={(e) => {
              const wc = e.target.value.trim().split(/\s+/).length;
              setData((prev) => ({ ...prev, script_draft: e.target.value, word_count: wc }));
            }}
            rows={20}
            className="w-full bg-bg-card border border-border rounded-xl px-5 py-4 text-[14px] text-text-primary focus:outline-none focus:border-amber/50 focus:ring-1 focus:ring-amber/20 transition-colors resize-y font-mono leading-relaxed"
          />
        </div>
      )}
    </div>
  );
}
