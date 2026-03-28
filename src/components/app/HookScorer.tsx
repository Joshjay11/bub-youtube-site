'use client';

import { useState, useRef } from 'react';
import { useProject } from '@/lib/project-context';
import { useProjectData, SaveIndicator } from '@/lib/use-project-data';
import { useRegisterPageContext } from '@/contexts/PageContextProvider';
import { notifyCreditChange } from '@/components/app/CreditHealthBar';

const CRITERIA_LABELS = [
  'Opens mid-action or mid-thought',
  'Creates a SPECIFIC curiosity gap',
  'Contains a number, name, or concrete detail',
  'Makes a promise the video keeps',
  'Excludes wrong audience',
  'Avoids starting with "I" or "So"',
  'Creates stakes',
  'Under 90 words',
  'Matches title/thumbnail promise',
  'Would stop YOU scrolling',
];

interface CriterionScore {
  criterion: number;
  score: number;
  reasoning: string;
  fix: string | null;
}

interface HookEvaluation {
  scores: CriterionScore[];
  total: number;
  summary: string;
}

interface HookScoreData {
  evaluation: HookEvaluation | null;
}

const DEFAULTS: HookScoreData = { evaluation: null };

interface HookScorerProps {
  hookText: string;
  onAiScores?: (scores: Array<{ criterion: number; score: number }>) => void;
}

export default function HookScorer({ hookText, onAiScores }: HookScorerProps) {
  const { currentProject } = useProject();
  const { data, setData, saveStatus } = useProjectData<HookScoreData>('hook_score', DEFAULTS);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const evaluation = data.evaluation;
  const hasHook = hookText.trim().length > 0;

  async function handleScore() {
    if (!hasHook || loading) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/ai/score-hook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hookText: hookText.trim(), projectId: currentProject?.id }),
      });

      const result = await res.json();

      if (result.evaluation) {
        setData({ evaluation: result.evaluation });
        notifyCreditChange();
        onAiScores?.(result.evaluation.scores);
      } else if (result.needsUpgrade) {
        setError('No AI credits remaining. Add your API key in Settings.');
      } else {
        setError(result.error || 'Failed to score hook.');
      }
    } catch {
      setError('Connection error. Please try again.');
    }

    setLoading(false);
  }

  const wrapperRef = useRef<HTMLDivElement>(null);
  useRegisterPageContext('hook_score', 'Hook AI Score', () => {
    if (!evaluation) return 'Tool: Hook AI Score\nStatus: Not scored yet';
    const lines = [`Tool: Hook AI Score`, `Total: ${evaluation.total}/10`, `Summary: ${evaluation.summary}`];
    for (const s of evaluation.scores) {
      const label = CRITERIA_LABELS[s.criterion - 1] || `Criterion ${s.criterion}`;
      lines.push(`  ${s.score ? '✓' : '✗'} ${label}: ${s.reasoning}`);
    }
    return lines.join('\n');
  }, wrapperRef);

  if (!hasHook) return null;

  return (
    <div ref={wrapperRef} className="space-y-4 mt-5">
      {/* Score button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleScore}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-amber/10 text-amber text-[14px] font-medium rounded-xl border border-amber/20 cursor-pointer transition-all hover:bg-amber/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading && (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {loading ? 'Scoring...' : 'Score My Hook'} <span className="text-[12px] opacity-70">(1 credit)</span>
        </button>
        <SaveIndicator status={saveStatus} />
      </div>

      {error && (
        <div className="text-[13px] text-red bg-red/5 border border-red/20 rounded-lg px-4 py-3">{error}</div>
      )}

      {/* Evaluation results */}
      {evaluation && (
        <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <h3 className="text-[15px] font-medium text-text-bright">AI Hook Score</h3>
            <div className={`text-[18px] font-serif font-bold ${evaluation.total >= 8 ? 'text-green' : evaluation.total >= 5 ? 'text-amber' : 'text-red'}`}>
              {evaluation.total}/10
            </div>
          </div>

          {/* Criteria rows */}
          {evaluation.scores.map((s) => {
            const label = CRITERIA_LABELS[s.criterion - 1] || `Criterion ${s.criterion}`;
            const pass = s.score === 1;

            return (
              <div key={s.criterion} className="border-b border-border/30 last:border-0">
                <div className="px-5 py-3 flex items-start gap-3">
                  <div className={`shrink-0 mt-0.5 w-5 h-5 rounded flex items-center justify-center text-[12px] ${
                    pass ? 'bg-green/10 text-green' : 'bg-red/10 text-red'
                  }`}>
                    {pass ? '✓' : '✗'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-text-primary">{label}</div>
                    <div className="text-[12px] text-text-dim mt-0.5">{s.reasoning}</div>
                    {!pass && s.fix && (
                      <div className="text-[12px] text-amber mt-1 pl-3 border-l-2 border-amber/30">
                        Fix: {s.fix}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Summary */}
          <div className="px-5 py-3 border-t border-border bg-bg-elevated/50">
            <p className="text-[13px] text-text-dim">{evaluation.summary}</p>
          </div>
        </div>
      )}
    </div>
  );
}
