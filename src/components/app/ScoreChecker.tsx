'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface AiScore {
  criterion: string;
  score: number;
  reason: string;
}

const CRITERION_ORDER = [
  { label: 'Curiosity', key: 'curiosity' },
  { label: 'Audience Relevance', key: 'audienceRelevance' },
  { label: 'Novelty', key: 'novelty' },
  { label: 'Proof Available', key: 'proofAvailable' },
  { label: 'Emotional Tension', key: 'emotionalTension' },
  { label: 'Title Potential', key: 'titlePotential' },
  { label: 'Thumbnail Potential', key: 'thumbnailPotential' },
  { label: 'Satisfaction Potential', key: 'satisfactionPotential' },
  { label: 'Production Feasibility', key: 'productionFeasibility' },
];

interface ScoreCheckerProps {
  idea: string;
  userScores: Record<string, number>;
}

interface ComparisonRow {
  label: string;
  userScore: number;
  aiScore: number;
  gap: number;
  reason: string;
}

function getGapStyle(gap: number): { color: string; label: string } {
  const abs = Math.abs(gap);
  if (abs >= 3) return { color: 'text-red', label: 'Big gap — are you sure?' };
  if (abs >= 2) return { color: 'text-amber', label: 'Worth examining' };
  return { color: 'text-green', label: '' };
}

export default function ScoreChecker({ idea, userScores }: ScoreCheckerProps) {
  const [aiScores, setAiScores] = useState<AiScore[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stale, setStale] = useState(false);
  const [gapResponses, setGapResponses] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const lastCheckedScoresRef = useRef<string>('');

  const hasIdea = idea.trim().length > 0;
  const hasEngaged = Object.values(userScores).some((v) => v !== 3);

  useEffect(() => {
    if (!aiScores) return;
    const current = JSON.stringify(userScores);
    if (lastCheckedScoresRef.current && current !== lastCheckedScoresRef.current) {
      setStale(true);
    }
  }, [userScores, aiScores]);

  async function handleCheck() {
    if (!hasIdea || loading) return;
    setLoading(true);
    setError('');
    setAiScores(null);
    setStale(false);
    setGapResponses({});

    try {
      const res = await fetch('/api/ai/score-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea: idea.trim() }),
      });

      const data = await res.json();

      if (data.aiScores) {
        setAiScores(data.aiScores);
        lastCheckedScoresRef.current = JSON.stringify(userScores);
      } else if (data.needsUpgrade) {
        setError('No AI credits remaining. Add your API key in Settings.');
      } else {
        setError(data.error || 'Failed to check scores.');
      }
    } catch {
      setError('Connection error. Please try again.');
    }

    setLoading(false);
  }

  const handleResponseChange = useCallback((label: string, value: string) => {
    setGapResponses((prev) => ({ ...prev, [label]: value }));
  }, []);

  function getComparison(): { rows: ComparisonRow[]; userTotal: number; aiTotal: number } | null {
    if (!aiScores) return null;

    const rows = CRITERION_ORDER.map((c) => {
      const userScore = userScores[c.key] ?? 3;
      const aiEntry = aiScores.find(
        (a) => a.criterion.toLowerCase().replace(/\s+/g, '') === c.label.toLowerCase().replace(/\s+/g, '')
      );
      const aiScore = aiEntry?.score ?? 3;
      const reason = aiEntry?.reason ?? '';
      const gap = userScore - aiScore;
      return { label: c.label, userScore, aiScore, gap, reason };
    });

    return {
      rows,
      userTotal: rows.reduce((s, r) => s + r.userScore, 0),
      aiTotal: rows.reduce((s, r) => s + r.aiScore, 0),
    };
  }

  const comparison = getComparison();
  const bigGapRows = comparison?.rows.filter((r) => Math.abs(r.gap) >= 2) ?? [];
  const hasAnyBigGaps = bigGapRows.length > 0;
  const filledResponses = bigGapRows.filter((r) => (gapResponses[r.label] ?? '').trim().length > 0);

  function handleCopyNotes() {
    if (!filledResponses.length) return;
    const text = filledResponses
      .map((r) => `${r.label.toUpperCase()} (You: ${r.userScore}, AI: ${r.aiScore})\n${gapResponses[r.label].trim()}`)
      .join('\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Button state
  let buttonText = 'Check My Scores';
  let buttonDisabled = false;
  let buttonTitle = '';

  if (!hasIdea) {
    buttonDisabled = true;
    buttonTitle = 'Pin an idea first';
  } else if (!hasEngaged) {
    buttonTitle = 'Score your idea first, then check';
  } else if (loading) {
    buttonText = 'Checking...';
    buttonDisabled = true;
  } else if (stale) {
    buttonText = 'Re-check Scores';
  }

  return (
    <div className="space-y-4">
      {/* Check button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleCheck}
          disabled={buttonDisabled || loading}
          title={buttonTitle}
          className="flex items-center gap-2 px-5 py-2.5 bg-amber text-bg text-[14px] font-medium rounded-xl border-none cursor-pointer transition-all hover:bg-amber-bright hover:text-bg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading && (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {buttonText}
        </button>
        {stale && <span className="text-[12px] text-amber">Scores changed since last check</span>}
        {!hasEngaged && hasIdea && !loading && (
          <span className="text-[12px] text-text-muted">Score your idea first, then check</span>
        )}
      </div>

      {error && (
        <div className="text-[13px] text-red bg-red/5 border border-red/20 rounded-lg px-4 py-3">{error}</div>
      )}

      {/* Comparison */}
      {comparison && (
        <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <h3 className="text-[15px] font-medium text-text-bright">Score Check</h3>
          </div>

          {/* Header row */}
          <div className="grid grid-cols-[1fr_56px_56px_auto] gap-0 px-5 py-2 border-b border-border/50">
            <div className="text-[12px] text-text-muted font-medium uppercase tracking-wider">Criterion</div>
            <div className="text-[12px] text-text-muted font-medium uppercase tracking-wider text-center">You</div>
            <div className="text-[12px] text-text-muted font-medium uppercase tracking-wider text-center">AI</div>
            <div className="text-[12px] text-text-muted font-medium uppercase tracking-wider pl-5">Gap</div>
          </div>

          {/* Rows */}
          {comparison.rows.map((row) => {
            const { color, label } = getGapStyle(row.gap);
            const absGap = Math.abs(row.gap);
            const hasBigGap = absGap >= 2;

            return (
              <div key={row.label} className="border-b border-border/30 last:border-0">
                {/* Score row */}
                <div className="grid grid-cols-[1fr_56px_56px_auto] gap-0 px-5 py-2.5 items-center hover:bg-bg-card-hover/30 transition-colors">
                  <div className="text-[13px] text-text-primary">{row.label}</div>
                  <div className="text-center text-[14px] font-mono text-text-bright">{row.userScore}</div>
                  <div className="text-center text-[14px] font-mono text-text-dim">{row.aiScore}</div>
                  <div className="pl-5">
                    {absGap === 0 ? (
                      <span className="text-green text-[13px]">✓</span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <span className={`text-[14px] font-mono ${color}`}>
                          {row.gap > 0 ? '+' : ''}{row.gap}
                        </span>
                        {label && <span className={`text-[11px] ${color}`}>← {label}</span>}
                      </span>
                    )}
                  </div>
                </div>

                {/* Expanded gap area — auto-shown for gaps of 2+ */}
                {hasBigGap && (
                  <div className="px-5 pb-4 pt-1 space-y-2">
                    {row.reason && (
                      <div className="text-[12px] text-text-muted pl-3 border-l-2 border-border-light">
                        <span className="text-text-dim">AI says: </span>{row.reason}
                      </div>
                    )}
                    <textarea
                      value={gapResponses[row.label] ?? ''}
                      onChange={(e) => handleResponseChange(row.label, e.target.value)}
                      placeholder="Why do you disagree — or how will you fix this?"
                      rows={2}
                      className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber/50 focus:ring-1 focus:ring-amber/20 transition-colors resize-y"
                    />
                  </div>
                )}
              </div>
            );
          })}

          {/* No big gaps message */}
          {!hasAnyBigGaps && (
            <div className="px-5 py-4 border-t border-border/50 text-center">
              <p className="text-[13px] text-green">No major gaps — you and the AI agree. Proceed with confidence.</p>
            </div>
          )}

          {/* Totals */}
          <div className="px-5 py-4 border-t border-border flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-6 text-[14px]">
              <span>
                <span className="text-text-muted">Your Total: </span>
                <span className="font-mono font-bold text-text-bright">{comparison.userTotal}</span>
              </span>
              <span>
                <span className="text-text-muted">AI Total: </span>
                <span className="font-mono font-bold text-text-dim">{comparison.aiTotal}</span>
              </span>
            </div>
            <div className="text-[13px] text-text-muted">
              Gap: <span className={`font-mono ${Math.abs(comparison.userTotal - comparison.aiTotal) >= 5 ? 'text-amber' : 'text-green'}`}>
                {comparison.userTotal - comparison.aiTotal > 0 ? '+' : ''}{comparison.userTotal - comparison.aiTotal}
              </span>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="px-5 py-3 border-t border-border/50 bg-bg-elevated/50">
            <p className="text-[12px] text-text-muted leading-relaxed">
              This is a second opinion, not a final answer. If you disagree with the AI, have a reason — that disagreement might be your video&apos;s best angle.
            </p>
          </div>
        </div>
      )}

      {/* Gap Notes Summary */}
      {filledResponses.length > 0 && (
        <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <h3 className="text-[15px] font-medium text-text-bright">Your Gap Notes</h3>
            <button
              onClick={handleCopyNotes}
              className="flex items-center gap-1.5 text-[12px] text-text-muted hover:text-text-dim transition-colors bg-transparent border-none cursor-pointer"
            >
              {copied ? (
                <>
                  <svg className="w-3.5 h-3.5 text-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Copied
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </>
              )}
            </button>
          </div>
          <div className="divide-y divide-border/30">
            {filledResponses.map((row) => (
              <div key={row.label} className="px-5 py-3">
                <div className="text-[12px] text-text-muted uppercase tracking-wider mb-1">
                  {row.label} <span className="normal-case tracking-normal">(You: {row.userScore}, AI: {row.aiScore})</span>
                </div>
                <p className="text-[13px] text-text-primary leading-relaxed">{gapResponses[row.label]}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
