'use client';

import { useState } from 'react';

const LENGTHS = [5, 8, 10, 12, 13, 15] as const;
const PACES = [
  { label: 'Tutorial', wpm: 120 },
  { label: 'Conversational', wpm: 140 },
  { label: 'Energetic', wpm: 160 },
] as const;

const SECTIONS = [
  { key: 'hook', label: 'Hook', pct: 0.08, job: 'Create the contract. What are you promising the viewer?' },
  { key: 'contextBridge', label: 'Context Bridge', pct: 0.05, job: 'Earn 60 more seconds. Just enough context for the first point to land.' },
  { key: 'microAct1', label: 'Micro-Act 1', pct: 0.20, job: 'Deliver the first reward. The viewer should learn something real here.' },
  { key: 'pivot', label: '35% Pivot', pct: 0.07, job: 'Reframe everything. Introduce the lens they didn\'t expect.' },
  { key: 'microAct2', label: 'Micro-Act 2', pct: 0.25, job: 'Deepen with evidence. Scatter mini-payoffs throughout.' },
  { key: 'escalation', label: 'Escalation', pct: 0.20, job: 'Highest energy. Fastest pacing. Build to the climax.' },
  { key: 'grandPayoff', label: 'Grand Payoff', pct: 0.10, job: 'Resolve ALL open loops from the first 90 seconds.' },
  { key: 'sessionHook', label: 'Session Hook + CTA', pct: 0.05, job: 'Bridge to a SPECIFIC next video. Not "check out my channel."' },
] as const;

export interface PacingResult {
  targetMinutes: number;
  wpm: number;
  totalWords: number;
  sections: { key: string; label: string; words: number; job: string }[];
}

export default function PacingCalculator({ onCalculate }: { onCalculate?: (result: PacingResult) => void }) {
  const [targetMinutes, setTargetMinutes] = useState(12);
  const [paceIndex, setPaceIndex] = useState(1); // default: Conversational

  const wpm = PACES[paceIndex].wpm;
  const totalWords = targetMinutes * wpm;
  const sections = SECTIONS.map((s) => ({
    key: s.key,
    label: s.label,
    words: Math.round(totalWords * s.pct),
    job: s.job,
  }));

  function formatTime(minutes: number, pct: number): string {
    const totalSeconds = minutes * 60;
    let runningSeconds = 0;
    // Calculate start time based on sections before this one
    const idx = SECTIONS.findIndex((s) => s.pct === pct);
    for (let i = 0; i < idx; i++) {
      runningSeconds += totalSeconds * SECTIONS[i].pct;
    }
    const endSeconds = runningSeconds + totalSeconds * pct;
    const startMin = Math.floor(runningSeconds / 60);
    const startSec = Math.floor(runningSeconds % 60);
    const endMin = Math.floor(endSeconds / 60);
    const endSec = Math.floor(endSeconds % 60);
    return `${startMin}:${String(startSec).padStart(2, '0')} – ${endMin}:${String(endSec).padStart(2, '0')}`;
  }

  function handleApply() {
    onCalculate?.({ targetMinutes, wpm, totalWords, sections });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-[24px] text-text-bright">Pacing Calculator</h2>
        <p className="text-text-dim text-[13px] mt-1">Set your constraints before writing. Word count targets per section.</p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4">
        <div className="bg-bg-card border border-border rounded-xl p-4 flex-1 min-w-[200px]">
          <label className="block text-[13px] text-text-dim mb-2">Target Video Length</label>
          <div className="flex gap-2">
            {LENGTHS.map((len) => (
              <button
                key={len}
                onClick={() => setTargetMinutes(len)}
                className={`px-3 py-2 rounded-lg text-[14px] font-medium transition-all ${
                  len === targetMinutes
                    ? 'bg-amber text-bg'
                    : 'bg-bg-elevated text-text-muted hover:text-text-dim hover:bg-bg-card-hover'
                }`}
              >
                {len}m
              </button>
            ))}
          </div>
        </div>

        <div className="bg-bg-card border border-border rounded-xl p-4 flex-1 min-w-[200px]">
          <label className="block text-[13px] text-text-dim mb-2">Speaking Pace</label>
          <div className="flex gap-2">
            {PACES.map((pace, i) => (
              <button
                key={pace.label}
                onClick={() => setPaceIndex(i)}
                className={`px-3 py-2 rounded-lg text-[14px] font-medium transition-all ${
                  i === paceIndex
                    ? 'bg-amber text-bg'
                    : 'bg-bg-elevated text-text-muted hover:text-text-dim hover:bg-bg-card-hover'
                }`}
              >
                {pace.label}
                <span className="text-[11px] opacity-70 ml-1">{pace.wpm}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Total */}
      <div className="bg-bg-card border border-amber/20 rounded-xl p-4 flex items-center justify-between">
        <div>
          <span className="text-text-dim text-[13px]">Total Script Length</span>
          <div className="text-[28px] font-serif font-bold text-amber leading-tight">
            {totalWords.toLocaleString()} <span className="text-[16px] text-text-dim font-normal">words</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-text-dim text-[13px]">At {wpm} WPM</span>
          <div className="text-[20px] text-text-bright font-medium">{targetMinutes} minutes</div>
        </div>
      </div>

      {/* Section breakdown table */}
      <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-[12px] text-text-muted font-medium px-5 py-3 uppercase tracking-wider">Section</th>
              <th className="text-left text-[12px] text-text-muted font-medium px-5 py-3 uppercase tracking-wider">Timestamp</th>
              <th className="text-right text-[12px] text-text-muted font-medium px-5 py-3 uppercase tracking-wider">% of Script</th>
              <th className="text-right text-[12px] text-text-muted font-medium px-5 py-3 uppercase tracking-wider">Target Words</th>
            </tr>
          </thead>
          <tbody>
            {SECTIONS.map((section, i) => (
              <tr key={section.key} className="border-b border-border/50 last:border-0 hover:bg-bg-card-hover/50 transition-colors">
                <td className="px-5 py-3">
                  <div className="text-[14px] text-text-bright font-medium">{section.label}</div>
                  <div className="text-[12px] text-text-muted mt-0.5">{section.job}</div>
                </td>
                <td className="px-5 py-3 text-[13px] text-text-dim font-mono">
                  {formatTime(targetMinutes, section.pct)}
                </td>
                <td className="px-5 py-3 text-right text-[14px] text-text-dim">
                  {Math.round(section.pct * 100)}%
                </td>
                <td className="px-5 py-3 text-right">
                  <span className="text-[16px] font-medium text-amber">{sections[i].words}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {onCalculate && (
        <button
          onClick={handleApply}
          className="w-full bg-amber hover:bg-amber-bright text-bg font-medium py-3 rounded-xl transition-colors text-[15px]"
        >
          Apply to Script Canvas
        </button>
      )}
    </div>
  );
}
