'use client';

import { useState, useEffect, useRef } from 'react';

interface AiScore {
  criterion: string;
  score: number;
  reason: string;
}

// Maps criterion labels to score keys
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
  const lastCheckedScoresRef = useRef<string>('');

  const hasIdea = idea.trim().length > 0;
  const hasEngaged = Object.values(userScores).some((v) => v !== 3);

  // Detect score changes after a check
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

  // Build comparison data
  function getComparison() {
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

    const userTotal = rows.reduce((s, r) => s + r.userScore, 0);
    const aiTotal = rows.reduce((s, r) => s + r.aiScore, 0);

    return { rows, userTotal, aiTotal };
  }

  const comparison = getComparison();

  // Determine button state
  let buttonText = 'Check My Scores';
  let buttonDisabled = false;
  let buttonTitle = '';

  if (!hasIdea) {
    buttonDisabled = true;
    buttonTitle = 'Pin an idea first';
    buttonText = 'Check My Scores';
  } else if (!hasEngaged) {
    buttonText = 'Check My Scores';
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
        {stale && (
          <span className="text-[12px] text-amber">Scores changed since last check</span>
        )}
        {!hasEngaged && hasIdea && (
          <span className="text-[12px] text-text-muted">Score your idea first, then check</span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="text-[13px] text-red bg-red/5 border border-red/20 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Comparison table */}
      {comparison && (
        <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <h3 className="text-[15px] font-medium text-text-bright">Score Check</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left text-[12px] text-text-muted font-medium px-5 py-2.5 uppercase tracking-wider">Criterion</th>
                  <th className="text-center text-[12px] text-text-muted font-medium px-3 py-2.5 uppercase tracking-wider w-16">You</th>
                  <th className="text-center text-[12px] text-text-muted font-medium px-3 py-2.5 uppercase tracking-wider w-16">AI</th>
                  <th className="text-left text-[12px] text-text-muted font-medium px-5 py-2.5 uppercase tracking-wider">Gap</th>
                </tr>
              </thead>
              <tbody>
                {comparison.rows.map((row) => {
                  const { color, label } = getGapStyle(row.gap);
                  const absGap = Math.abs(row.gap);
                  return (
                    <tr key={row.label} className="border-b border-border/30 last:border-0 hover:bg-bg-card-hover/30 transition-colors group">
                      <td className="px-5 py-2.5">
                        <div className="text-[13px] text-text-primary">{row.label}</div>
                        {absGap >= 2 && row.reason && (
                          <div className="text-[11px] text-text-muted mt-0.5 max-w-[300px]">{row.reason}</div>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-center text-[14px] font-mono text-text-bright">{row.userScore}</td>
                      <td className="px-3 py-2.5 text-center text-[14px] font-mono text-text-dim">{row.aiScore}</td>
                      <td className="px-5 py-2.5">
                        {absGap === 0 ? (
                          <span className="text-green text-[13px]">✓</span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <span className={`text-[14px] font-mono ${color}`}>
                              {row.gap > 0 ? '+' : ''}{row.gap}
                            </span>
                            {label && (
                              <span className={`text-[11px] ${color}`}>← {label}</span>
                            )}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="px-5 py-4 border-t border-border flex items-center justify-between">
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
    </div>
  );
}
