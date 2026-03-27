'use client';

import { useEffect, useMemo, useRef } from 'react';
import ScoreChecker from '@/components/app/ScoreChecker';
import { useProjectData, SaveIndicator } from '@/lib/use-project-data';
import { useRegisterPageContext } from '@/contexts/PageContextProvider';

const CRITERIA = [
  { key: 'curiosity', label: 'Curiosity', question: 'Would a stranger click this?', low: 'Generic topic, no surprise', high: 'Specific claim that demands an answer' },
  { key: 'audienceRelevance', label: 'Audience Relevance', question: 'Does YOUR audience need this?', low: 'Tangentially related', high: "They're asking for this in comments" },
  { key: 'novelty', label: 'Novelty', question: 'Has this angle been done to death?', low: '10 videos with this exact take exist', high: 'Nobody has approached it this way' },
  { key: 'proofAvailable', label: 'Proof Available', question: 'Can you back it up?', low: 'Opinion only, no data', high: 'Studies, examples, receipts' },
  { key: 'emotionalTension', label: 'Emotional Tension', question: 'Does it create a feeling?', low: 'Pure information transfer', high: 'Makes them angry, hopeful, or curious' },
  { key: 'titlePotential', label: 'Title Potential', question: 'Can you write a title with a knowledge gap?', low: 'Descriptive but flat', high: "You'd click it yourself" },
  { key: 'thumbnailPotential', label: 'Thumbnail Potential', question: 'Can you make a thumb that stops scrolling?', low: 'Text-heavy, no visual hook', high: 'Clear visual concept, high contrast' },
  { key: 'satisfactionPotential', label: 'Satisfaction Potential', question: 'Will viewers feel the video delivered?', low: 'Vague payoff, lots of filler', high: 'Crystal clear delivery on promise' },
  { key: 'productionFeasibility', label: 'Production Feasibility', question: 'Can you actually make this?', low: "Requires assets you don't have", high: 'Fully within your capability' },
] as const;

type Scores = Record<string, number>;

const DEFAULT_SCORES: Scores = Object.fromEntries(CRITERIA.map((c) => [c.key, 3]));

interface ScorecardData {
  scores: Scores;
}

function getVerdict(total: number): { label: string; color: string; bg: string; glow: string } {
  if (total >= 40) return { label: 'GO', color: 'text-green', bg: 'bg-green/10', glow: 'shadow-[0_0_24px_rgba(34,197,94,0.3)]' };
  if (total >= 30) return { label: 'HOLD', color: 'text-amber', bg: 'bg-amber/10', glow: 'shadow-[0_0_24px_rgba(212,163,66,0.3)]' };
  return { label: 'KILL', color: 'text-red', bg: 'bg-red/10', glow: 'shadow-[0_0_24px_rgba(239,68,68,0.3)]' };
}

function getVerdictAdvice(total: number): string {
  if (total >= 40) return 'Script it.';
  if (total >= 30) return "Revisit monthly. Sometimes the timing is wrong, not the idea.";
  return "Archive it. Don't delete — your worst idea today might be perfect in 6 months.";
}

export default function IdeaScorecard({ idea = '' }: { idea?: string }) {
  const { data, setData, saveStatus } = useProjectData<ScorecardData>('idea_scorecard', { scores: DEFAULT_SCORES });

  const scores = useMemo(() => ({ ...DEFAULT_SCORES, ...data.scores }), [data.scores]);
  const total = Object.values(scores).reduce((sum, v) => sum + v, 0);
  const verdict = getVerdict(total);

  function handleChange(key: string, value: number) {
    setData((prev) => ({ ...prev, scores: { ...prev.scores, [key]: value } }));
  }

  function handleReset() {
    setData({ scores: DEFAULT_SCORES });
  }

  const wrapperRef = useRef<HTMLDivElement>(null);
  useRegisterPageContext('idea_scorecard', 'Idea Scorecard', () => {
    const lines = [`Tool: Idea Scorecard`, `Video Idea: ${idea || '(not entered yet)'}`, `Total: ${total}/45`, `Verdict: ${verdict.label}`];
    lines.push('Scores:');
    for (const c of CRITERIA) {
      lines.push(`  ${c.label}: ${scores[c.key]}`);
    }
    return lines.join('\n');
  }, wrapperRef);

  // Keep data.scores populated on first render
  useEffect(() => {
    if (!data.scores || Object.keys(data.scores).length === 0) {
      setData({ scores: DEFAULT_SCORES });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div ref={wrapperRef} className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="font-serif text-[24px] text-text-bright">Idea Scorecard</h2>
            <p className="text-text-dim text-[13px] mt-1">Rate each criterion 1–5. Score determines if you should script it, hold it, or kill it.</p>
          </div>
          <SaveIndicator status={saveStatus} />
        </div>
        <button
          onClick={handleReset}
          className="text-[13px] text-text-muted hover:text-text-dim transition-colors px-3 py-1.5 rounded-lg border border-border hover:border-border-light"
        >
          Reset
        </button>
      </div>

      <div className="space-y-1">
        {CRITERIA.map((criterion) => {
          const value = scores[criterion.key];
          return (
            <div
              key={criterion.key}
              className="bg-bg-card border border-border rounded-xl p-5 hover:border-border-light transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-1">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                    <span className="text-[15px] font-medium text-text-bright">{criterion.label}</span>
                    <span className="text-[13px] text-text-dim">— {criterion.question}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-1">
                    <span className="text-[12px] text-text-muted">1: {criterion.low}</span>
                    <span className="text-[12px] text-text-muted">5: {criterion.high}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => handleChange(criterion.key, n)}
                      className={`w-9 h-9 rounded-lg text-[14px] font-medium transition-all ${
                        n === value
                          ? 'bg-amber text-bg scale-110'
                          : n < value
                            ? 'bg-amber/20 text-amber hover:bg-amber/30'
                            : 'bg-bg-elevated text-text-muted hover:bg-bg-card-hover hover:text-text-dim'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Score + Verdict */}
      <div className={`rounded-xl border border-border p-6 text-center ${verdict.bg} ${verdict.glow} transition-all duration-500`}>
        <div className="text-[48px] font-serif font-bold leading-none mb-1">
          <span className={verdict.color}>{total}</span>
          <span className="text-text-muted text-[24px]"> / 45</span>
        </div>
        <div className={`inline-block text-[18px] font-bold tracking-widest mt-2 px-4 py-1 rounded-full ${verdict.bg} ${verdict.color}`}>
          {verdict.label}
        </div>
        <p className="text-text-dim text-[14px] mt-3">{getVerdictAdvice(total)}</p>
      </div>

      {/* Score Checker */}
      <ScoreChecker idea={idea} userScores={scores} />
    </div>
  );
}
