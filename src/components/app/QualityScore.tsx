'use client';

import { useState, useEffect, useRef } from 'react';
import { useProject } from '@/lib/project-context';
import { loadProjectBundle } from '@/lib/project-bundle';
import { useProjectData, SaveIndicator } from '@/lib/use-project-data';
import { useRegisterPageContext } from '@/contexts/PageContextProvider';
import { notifyCreditChange } from '@/components/app/CreditHealthBar';

interface QualityIssue {
  original: string;
  problem: string;
  fix: string;
  severity: 'high' | 'medium';
}

interface QualityResult {
  overall_score: number;
  issues: QualityIssue[];
}

interface QualityData {
  result: QualityResult | null;
  staged_fixes: Record<number, boolean>;
}

const DEFAULTS: QualityData = { result: null, staged_fixes: {} };

const SYSTEM_PROMPT = `You are a script quality analyzer. Scan this YouTube script line by line and identify the WORST offending phrases and sentences — the ones that most hurt quality, voice, or impact.

What counts as a worst offender:
- Weak or vague phrasing that could be sharper
- Sentences that sound robotic or AI-generated
- Awkward transitions between ideas
- Redundant phrases or filler
- Passive voice where active would hit harder
- Clichés or overused phrases
- Lines that break conversational flow

Only flag lines that genuinely need fixing. If the script is strong, you might find 3-4 issues. If it needs work, you might find 10-12. Do NOT flag lines just to fill a quota. Quality over quantity. Only return medium or high severity issues.

Also provide an overall quality score out of 100.

Respond ONLY with JSON:
{
  "overall_score": 76,
  "issues": [
    {
      "original": "The exact original line from the script",
      "problem": "Brief description of what's wrong",
      "fix": "The rewritten version of the line",
      "severity": "high"
    }
  ]
}`;

export default function QualityScore() {
  const { currentProject } = useProject();
  const { data, setData, saveStatus } = useProjectData<QualityData>('quality_score', DEFAULTS);

  const [scriptText, setScriptText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [applied, setApplied] = useState(false);

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
    setApplied(false);

    try {
      const res = await fetch('/api/ai/run-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: `${SYSTEM_PROMPT}\n\nScript to analyze:\n\n${scriptText.trim()}` }),
      });

      if (!res.ok) {
        const d = await res.json();
        setError(d.error || 'Failed.');
        setLoading(false);
        return;
      }

      // Stream the response
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

      // Parse JSON from output
      const stripped = output.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      let parsed: QualityResult;
      try {
        parsed = JSON.parse(stripped);
      } catch {
        const first = output.indexOf('{');
        const last = output.lastIndexOf('}');
        if (first !== -1 && last > first) {
          parsed = JSON.parse(output.slice(first, last + 1));
        } else {
          throw new Error('Failed to parse quality score response');
        }
      }

      setData({ result: parsed, staged_fixes: {} });
      notifyCreditChange();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to analyze script.');
    }
    setLoading(false);
  }

  function toggleFix(index: number) {
    setData((prev) => ({
      ...prev,
      staged_fixes: { ...prev.staged_fixes, [index]: !prev.staged_fixes?.[index] },
    }));
  }

  async function applyFixes() {
    if (!data.result || !currentProject?.id) return;

    let updatedScript = scriptText;

    // Apply fixes in reverse order of appearance to avoid index shifting
    const fixesToApply = data.result.issues
      .map((issue, i) => ({ ...issue, index: i }))
      .filter((_, i) => data.staged_fixes?.[i])
      .reverse();

    for (const fix of fixesToApply) {
      if (updatedScript.includes(fix.original)) {
        updatedScript = updatedScript.replace(fix.original, fix.fix);
      }
    }

    // Save back to write.script_draft
    try {
      const getRes = await fetch(`/api/projects/data?projectId=${currentProject.id}&toolKey=write`);
      const getJson = await getRes.json();
      const currentWriteData = (getJson?.data && typeof getJson.data === 'object') ? getJson.data : {};

      await fetch('/api/projects/data', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProject.id,
          toolKey: 'write',
          data: { ...currentWriteData, script_draft: updatedScript, word_count: updatedScript.trim().split(/\s+/).length },
        }),
      });

      setScriptText(updatedScript);
      setApplied(true);
    } catch {
      setError('Failed to update script.');
    }
  }

  const stagedCount = Object.values(data.staged_fixes || {}).filter(Boolean).length;
  const r = data.result;

  const wrapperRef = useRef<HTMLDivElement>(null);
  useRegisterPageContext('quality_score', 'Quality Score', () => {
    if (!r) return 'Tool: Quality Score\nStatus: Not run yet';
    return `Tool: Quality Score\nOverall: ${r.overall_score}/100\nIssues found: ${r.issues.length}\nFixes staged: ${stagedCount}`;
  }, wrapperRef);

  return (
    <div ref={wrapperRef} className="space-y-5">
      <div className="flex items-center gap-3">
        <div>
          <h2 className="font-serif text-[22px] text-text-bright">Quality Score</h2>
          <p className="text-text-dim text-[13px] mt-1">Find the worst offending lines and fix them with one click.</p>
        </div>
        <SaveIndicator status={saveStatus} />
      </div>

      <button
        onClick={handleRun}
        disabled={!scriptText.trim() || loading}
        className="flex items-center gap-2 px-5 py-2.5 bg-amber text-bg text-[14px] font-medium rounded-xl border-none cursor-pointer transition-all hover:bg-amber-bright hover:text-bg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Analyzing...' : 'Run Quality Score'} <span className="text-[12px] opacity-70">(1 credit)</span>
      </button>

      {error && <div className="text-[13px] text-red bg-red/5 border border-red/20 rounded-lg px-4 py-3">{error}</div>}

      {r && (
        <div className="space-y-4">
          {/* Overall score */}
          <div className="bg-bg-card border border-border rounded-xl p-5 flex items-center justify-between">
            <div>
              <div className="text-[12px] text-text-muted uppercase tracking-wider mb-1">Overall Quality</div>
              <div className="text-[36px] font-serif font-bold leading-none">
                <span className={r.overall_score >= 80 ? 'text-green' : r.overall_score >= 60 ? 'text-amber' : 'text-red'}>
                  {r.overall_score}
                </span>
                <span className="text-text-muted text-[18px]"> / 100</span>
              </div>
            </div>
            <div className="text-[13px] text-text-dim">{r.issues.length} issue{r.issues.length !== 1 ? 's' : ''} found</div>
          </div>

          {/* Issues */}
          <div className="space-y-3">
            {r.issues.map((issue, i) => {
              const isStaged = !!data.staged_fixes?.[i];
              return (
                <div key={i} className={`bg-bg-card border rounded-xl p-4 transition-all ${isStaged ? 'border-green/30 bg-green/[0.02]' : 'border-border'}`}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${issue.severity === 'high' ? 'bg-red/10 text-red' : 'bg-amber/10 text-amber'}`}>
                      {issue.severity}
                    </span>
                    <button
                      onClick={() => toggleFix(i)}
                      className={`text-[12px] font-medium px-3 py-1 rounded transition-all ${
                        isStaged
                          ? 'bg-green/10 text-green border border-green/20'
                          : 'text-text-muted hover:text-amber border border-border hover:border-amber/30'
                      }`}
                    >
                      {isStaged ? 'Staged ✓' : 'Keep Fix'}
                    </button>
                  </div>
                  <div className="text-[13px] text-red/70 line-through mb-1">&ldquo;{issue.original}&rdquo;</div>
                  <div className="text-[12px] text-text-muted mb-2">{issue.problem}</div>
                  <div className="text-[13px] text-green">&ldquo;{issue.fix}&rdquo;</div>
                </div>
              );
            })}
          </div>

          {/* Apply fixes button */}
          {stagedCount > 0 && !applied && (
            <button
              onClick={applyFixes}
              className="w-full py-3 bg-green/10 text-green border border-green/20 rounded-xl text-[14px] font-medium cursor-pointer hover:bg-green/20 transition-all"
            >
              Update Script ({stagedCount} fix{stagedCount !== 1 ? 'es' : ''})
            </button>
          )}

          {applied && (
            <div className="bg-green/5 border border-green/20 rounded-xl px-5 py-3 text-center text-[13px] text-green">
              Script updated with {stagedCount} fix{stagedCount !== 1 ? 'es' : ''} applied. Changes flow to Optimize automatically.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
