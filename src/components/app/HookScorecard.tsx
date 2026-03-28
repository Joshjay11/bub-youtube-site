'use client';

import { useRef } from 'react';
import { useProjectData, SaveIndicator } from '@/lib/use-project-data';
import { useRegisterPageContext } from '@/contexts/PageContextProvider';

const CRITERIA = [
  { key: 'opensMidAction', label: 'Opens mid-action or mid-thought', detail: 'Not "Hey guys" or "In this video"' },
  { key: 'specificGap', label: 'Creates a SPECIFIC curiosity gap', detail: 'Not a vague one' },
  { key: 'containsDetail', label: 'Contains a number, name, or concrete detail', detail: '' },
  { key: 'keepsPromise', label: 'Makes a promise the video actually keeps', detail: '' },
  { key: 'excludesWrongAudience', label: "Excludes people who wouldn't like this video", detail: 'You want qualified viewers' },
  { key: 'noIOrSoStart', label: 'Avoids starting with "I" or "So"', detail: '' },
  { key: 'createsStakes', label: 'Creates stakes', detail: 'Why should I care RIGHT NOW?' },
  { key: 'under90Words', label: 'Is under 90 words', detail: '' },
  { key: 'matchesTitleThumb', label: 'Matches the title/thumbnail promise', detail: '' },
  { key: 'wouldStopScrolling', label: 'Would make YOU stop scrolling if someone else said it', detail: '' },
] as const;

type Checks = Record<string, boolean>;

interface ScorecardData {
  checks: Checks;
}

const DEFAULT_CHECKS: Checks = Object.fromEntries(CRITERIA.map((c) => [c.key, false]));

function getVerdict(score: number): { label: string; color: string; advice: string } {
  if (score >= 8) return { label: 'Ship it.', color: 'text-green', advice: 'Your hook is strong. Go record.' };
  if (score >= 5) return { label: 'Revise.', color: 'text-amber', advice: 'One or two elements are weak. Tighten those specific points.' };
  return { label: 'Start over.', color: 'text-red', advice: "The concept isn't working, not just the wording." };
}

export default function HookScorecard({ hookDraft }: { hookDraft?: string }) {
  const { data, setData, saveStatus } = useProjectData<ScorecardData>('hook_scorecard', { checks: DEFAULT_CHECKS });

  const checks = { ...DEFAULT_CHECKS, ...data.checks };
  const score = Object.values(checks).filter(Boolean).length;
  const verdict = getVerdict(score);

  function toggle(key: string) {
    setData((prev) => ({ ...prev, checks: { ...prev.checks, [key]: !prev.checks?.[key] } }));
  }

  function handleReset() {
    setData({ checks: DEFAULT_CHECKS });
  }

  const wrapperRef = useRef<HTMLDivElement>(null);
  useRegisterPageContext('hook_scorecard', 'Hook Strength Scorecard', () => {
    const lines = [`Tool: Hook Strength Scorecard`, `Score: ${score}/10`, `Verdict: ${verdict.label}`];
    if (hookDraft) lines.push(`Hook being scored: "${hookDraft.slice(0, 150)}${hookDraft.length > 150 ? '...' : ''}"`);
    for (const c of CRITERIA) {
      lines.push(`  ${checks[c.key] ? '✓' : '✗'} ${c.label}`);
    }
    return lines.join('\n');
  }, wrapperRef);

  return (
    <div ref={wrapperRef} className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="font-serif text-[24px] text-text-bright">Hook Strength Scorecard</h2>
            <p className="text-text-dim text-[13px] mt-1">Score your hook. 1 point per criterion.</p>
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

      {/* Show hook draft for reference while scoring */}
      {hookDraft && (
        <div className="bg-bg-elevated border border-border/50 rounded-lg px-5 py-3">
          <div className="text-[11px] text-text-muted uppercase tracking-wider mb-1">Scoring this hook</div>
          <p className="text-[14px] text-text-primary leading-relaxed italic">&ldquo;{hookDraft}&rdquo;</p>
        </div>
      )}

      <div className="bg-bg-card border border-border rounded-xl divide-y divide-border/50">
        {CRITERIA.map((criterion, i) => (
          <label
            key={criterion.key}
            className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-bg-card-hover/50 transition-colors"
          >
            <div className="relative shrink-0">
              <input
                type="checkbox"
                checked={checks[criterion.key]}
                onChange={() => toggle(criterion.key)}
                className="sr-only"
              />
              <div className={`w-6 h-6 rounded-md border-2 transition-all flex items-center justify-center ${
                checks[criterion.key]
                  ? 'bg-amber border-amber'
                  : 'border-border-light bg-bg-elevated'
              }`}>
                {checks[criterion.key] && (
                  <svg className="w-4 h-4 text-bg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[13px] text-text-muted mr-2">{i + 1}.</span>
              <span className={`text-[14px] ${checks[criterion.key] ? 'text-text-bright' : 'text-text-primary'}`}>
                {criterion.label}
              </span>
              {criterion.detail && (
                <span className="text-[13px] text-text-muted ml-1">({criterion.detail})</span>
              )}
            </div>
          </label>
        ))}
      </div>

      {/* Score + Verdict */}
      <div className="rounded-xl border border-border bg-bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[12px] text-text-muted uppercase tracking-wider mb-1">Hook Score</div>
            <div className="text-[40px] font-serif font-bold leading-none">
              <span className={verdict.color}>{score}</span>
              <span className="text-text-muted text-[20px]"> / 10</span>
            </div>
          </div>
          <div className={`text-[20px] font-bold ${verdict.color}`}>{verdict.label}</div>
        </div>
        <div className="h-2 bg-bg-elevated rounded-full overflow-hidden mb-3">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              score >= 8 ? 'bg-green' : score >= 5 ? 'bg-amber' : 'bg-red'
            }`}
            style={{ width: `${score * 10}%` }}
          />
        </div>
        <p className="text-text-dim text-[14px]">{verdict.advice}</p>
      </div>
    </div>
  );
}
