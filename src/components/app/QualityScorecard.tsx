'use client';

import { useState, useEffect, useRef } from 'react';
import { useProject } from '@/lib/project-context';
import { loadProjectBundle } from '@/lib/project-bundle';
import { useProjectData, SaveIndicator } from '@/lib/use-project-data';
import { useRegisterPageContext } from '@/contexts/PageContextProvider';
import { notifyCreditChange } from '@/components/app/CreditHealthBar';

interface QualityData {
  quality_output: string;
  quality_your_pick: string;
  quality_kept_output: string;
}

const DEFAULTS: QualityData = { quality_output: '', quality_your_pick: '', quality_kept_output: '' };

export default function QualityScorecard() {
  const { currentProject } = useProject();
  const { data, setData, saveStatus } = useProjectData<QualityData>('refine', DEFAULTS);

  const [scriptText, setScriptText] = useState('');
  const [showScript, setShowScript] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!currentProject?.id) return;
    loadProjectBundle(currentProject.id).then((bundle) => {
      const ws = bundle.write as { script_draft?: string } | undefined;
      if (ws?.script_draft) setScriptText(ws.script_draft);
    }).catch(() => {});
  }, [currentProject?.id]);

  async function handleRun() {
    if (!scriptText.trim() || loading) return;
    setLoading(true);
    setError('');

    const prompt = `Here is my script draft:\n${scriptText.trim()}\n\nScore this script's AI output quality on these dimensions (1-10 each):\n\n1. VOICE AUTHENTICITY — Does it sound like a real person or like AI wrote it?\n2. CONVERSATIONAL FLOW — Would this sound natural read aloud?\n3. SPECIFICITY — Are claims backed by specific data, names, and examples?\n4. SENTENCE VARIETY — Mix of short punchy and longer explanatory sentences?\n5. ORIGINALITY — Does it avoid cliché phrases and predictable structure?\n6. EM DASH USAGE — Are em dashes used sparingly or everywhere (AI tell)?\n7. TRANSITION QUALITY — Are transitions smooth and varied?\n8. OPENING STRENGTH — Does the first line demand attention?\n9. EMOTIONAL RANGE — Does the tone shift appropriately?\n10. HUMAN IMPERFECTION — Are there moments of natural hesitation, humor, or personal aside?\n\nFor each dimension: give the score, quote the best and worst example from the script, and provide one specific fix.\nFinal overall score out of 100.`;

    try {
      const res = await fetch('/api/ai/run-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        const d = await res.json();
        setError(d.error || 'Failed.');
        setLoading(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) { setError('No response'); setLoading(false); return; }

      let output = '';
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === 'text') output += event.text;
          } catch { /* skip */ }
        }
      }

      setData((prev) => ({ ...prev, quality_output: output }));
      notifyCreditChange();
    } catch { setError('Connection error.'); }
    setLoading(false);
  }

  function handleKeep() {
    setData((prev) => ({ ...prev, quality_kept_output: prev.quality_output }));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const wrapperRef = useRef<HTMLDivElement>(null);
  useRegisterPageContext('quality_scorecard', 'Quality Scorecard', () => {
    return `Tool: AI Output Quality Scorecard\nOutput: ${data.quality_output ? 'Generated' : 'Not run yet'}\nYour pick: ${data.quality_your_pick || '(empty)'}`;
  }, wrapperRef);

  const preview = scriptText.split('\n').slice(0, 3).join('\n');

  return (
    <div ref={wrapperRef} className="space-y-5">
      <div className="flex items-center gap-3">
        <div>
          <h2 className="font-serif text-[22px] text-text-bright">AI Output Quality Scorecard</h2>
          <p className="text-text-dim text-[13px] mt-1">Score your script on 10 quality dimensions — voice, flow, specificity, originality, and more.</p>
        </div>
        <SaveIndicator status={saveStatus} />
      </div>

      {scriptText && (
        <div className="bg-bg-elevated border border-border/50 rounded-lg px-4 py-3">
          <div className="text-[12px] text-text-muted mb-1">Script being scored</div>
          <div className="text-[13px] text-text-dim whitespace-pre-wrap">{showScript ? scriptText : preview + '...'}</div>
          <button onClick={() => setShowScript(!showScript)} className="text-[11px] text-amber mt-1 bg-transparent border-none cursor-pointer">{showScript ? 'Collapse' : 'Show full script'}</button>
        </div>
      )}

      <button onClick={handleRun} disabled={!scriptText.trim() || loading} className="flex items-center gap-2 px-5 py-2.5 bg-amber text-bg text-[14px] font-medium rounded-xl border-none cursor-pointer transition-all hover:bg-amber-bright hover:text-bg disabled:opacity-50 disabled:cursor-not-allowed">
        {loading ? 'Scoring...' : 'Run Quality Scorecard'} <span className="text-[12px] opacity-70">(1 credit)</span>
      </button>

      {error && <div className="text-[13px] text-red bg-red/5 border border-red/20 rounded-lg px-4 py-3">{error}</div>}

      {data.quality_output && (
        <div className="bg-bg-card border border-border rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-text-muted uppercase tracking-wider">Quality Scorecard Results</span>
            <button onClick={handleKeep} className="text-[11px] text-amber hover:text-amber-bright bg-transparent border border-amber/20 rounded px-2 py-1 cursor-pointer hover:bg-amber/10">
              {copied ? 'Kept ✓' : 'Keep This Output'}
            </button>
          </div>
          <div className="text-[14px] text-text-primary leading-relaxed whitespace-pre-wrap">{data.quality_output}</div>
        </div>
      )}

      {data.quality_output && (
        <div>
          <label className="block text-[13px] text-text-bright mb-1.5">Your Pick</label>
          <textarea value={data.quality_your_pick} onChange={(e) => setData((prev) => ({ ...prev, quality_your_pick: e.target.value }))} placeholder="Notes on what to fix based on the scorecard." rows={3} className="w-full bg-bg-card border border-border rounded-lg px-4 py-3 text-[14px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber/50 focus:ring-1 focus:ring-amber/20 transition-colors resize-y" />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-bg-elevated border border-border rounded-lg p-4">
          <div className="text-[12px] text-green font-medium mb-1">Good output</div>
          <div className="text-[13px] text-text-dim">Honest scoring with specific examples quoted from the script. At least 2 dimensions below 6.</div>
        </div>
        <div className="bg-bg-elevated border border-border rounded-lg p-4">
          <div className="text-[12px] text-red font-medium mb-1">Red flags</div>
          <div className="text-[13px] text-text-dim">All scores 8+ with vague justifications. No specific quotes from the script.</div>
        </div>
      </div>
    </div>
  );
}
