'use client';

import { useState, useCallback } from 'react';

const DEFAULT_WPM = 140;
const DEFAULT_MINUTES = 12;

const SECTIONS = [
  { key: 'hook', label: 'Hook', pct: 0.08, job: 'Create the contract. What are you promising the viewer?', timestamp: '0:00 – 0:30' },
  { key: 'contextBridge', label: 'Context Bridge', pct: 0.05, job: 'Earn 60 more seconds. Just enough context for the first point to land.', timestamp: '0:30 – 1:00' },
  { key: 'microAct1', label: 'Micro-Act 1', pct: 0.20, job: 'Deliver the first reward. The viewer should learn something real here.', timestamp: '1:00 – 3:30' },
  { key: 'pivot', label: '35% Pivot', pct: 0.07, job: "Reframe everything. Introduce the lens they didn't expect.", timestamp: '3:30 – 4:30' },
  { key: 'microAct2', label: 'Micro-Act 2', pct: 0.25, job: "Deepen with evidence. Scatter mini-payoffs. Don't save everything for the end.", timestamp: '4:30 – 7:00' },
  { key: 'escalation', label: 'Escalation', pct: 0.20, job: 'Highest energy. Fastest pacing. Build to the climax.', timestamp: '7:00 – 9:30' },
  { key: 'grandPayoff', label: 'Grand Payoff', pct: 0.10, job: 'Resolve ALL open loops from the first 90 seconds.', timestamp: '9:30 – 11:00' },
  { key: 'sessionHook', label: 'Session Hook + CTA', pct: 0.05, job: 'Bridge to a SPECIFIC next video. Not "check out my channel." Name the video.', timestamp: '11:00 – 12:00' },
] as const;

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

function getWordCountColor(actual: number, target: number): string {
  if (target === 0) return 'text-text-muted';
  const ratio = actual / target;
  if (ratio >= 0.9 && ratio <= 1.1) return 'text-green';
  if (ratio >= 0.75 && ratio <= 1.25) return 'text-amber';
  return 'text-red';
}

function getWordCountBg(actual: number, target: number): string {
  if (target === 0) return 'bg-bg-elevated';
  const ratio = actual / target;
  if (ratio >= 0.9 && ratio <= 1.1) return 'bg-green/5 border-green/20';
  if (ratio >= 0.75 && ratio <= 1.25) return 'bg-amber/5 border-amber/20';
  return 'bg-red/5 border-red/20';
}

type SectionTexts = Record<string, string>;

export default function ScriptCanvas() {
  const [texts, setTexts] = useState<SectionTexts>(
    Object.fromEntries(SECTIONS.map((s) => [s.key, '']))
  );
  const [expanded, setExpanded] = useState<Record<string, boolean>>(
    Object.fromEntries(SECTIONS.map((s) => [s.key, true]))
  );
  const [wpm] = useState(DEFAULT_WPM);
  const [targetMinutes] = useState(DEFAULT_MINUTES);

  const totalWords = Object.values(texts).reduce((sum, t) => sum + countWords(t), 0);
  const totalTarget = targetMinutes * wpm;
  const estimatedMinutes = totalWords / wpm;

  const handleTextChange = useCallback((key: string, value: string) => {
    setTexts((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleSection = useCallback((key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-[24px] text-text-bright">Script Draft Canvas</h2>
          <p className="text-text-dim text-[13px] mt-1">Write section by section. Word counts update live.</p>
        </div>
        <div className="flex items-center gap-4 text-[13px]">
          <span className="text-text-muted">
            Target: <span className="text-text-dim">{targetMinutes}m @ {wpm} WPM = {totalTarget.toLocaleString()} words</span>
          </span>
        </div>
      </div>

      {/* Live stats bar */}
      <div className="bg-bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-6 flex-wrap">
          <div>
            <div className="text-[12px] text-text-muted uppercase tracking-wider">Total Words</div>
            <div className={`text-[24px] font-mono font-bold ${getWordCountColor(totalWords, totalTarget)}`}>
              {totalWords.toLocaleString()}
              <span className="text-[14px] text-text-muted font-normal"> / {totalTarget.toLocaleString()}</span>
            </div>
          </div>
          <div className="w-px h-8 bg-border" />
          <div>
            <div className="text-[12px] text-text-muted uppercase tracking-wider">Est. Duration</div>
            <div className="text-[24px] font-mono font-bold text-text-bright">
              {estimatedMinutes.toFixed(1)}
              <span className="text-[14px] text-text-muted font-normal"> min</span>
            </div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="w-48">
          <div className="h-2 bg-bg-elevated rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                totalWords / totalTarget > 1.1 ? 'bg-red' : totalWords / totalTarget > 0.9 ? 'bg-green' : 'bg-amber'
              }`}
              style={{ width: `${Math.min(100, (totalWords / totalTarget) * 100)}%` }}
            />
          </div>
          <div className="text-[11px] text-text-muted text-right mt-1">{Math.round((totalWords / totalTarget) * 100)}%</div>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {SECTIONS.map((section) => {
          const wordTarget = Math.round(totalTarget * section.pct);
          const wordCount = countWords(texts[section.key]);
          const isExpanded = expanded[section.key];

          return (
            <div
              key={section.key}
              className={`rounded-xl border transition-colors ${
                isExpanded ? getWordCountBg(wordCount, wordTarget) : 'bg-bg-card border-border'
              }`}
            >
              {/* Header */}
              <button
                onClick={() => toggleSection(section.key)}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <svg
                    className={`w-4 h-4 text-text-muted transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                  <div>
                    <span className="text-[15px] font-medium text-text-bright">{section.label}</span>
                    <span className="text-[12px] text-text-muted ml-2">{section.timestamp}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[14px] font-mono ${getWordCountColor(wordCount, wordTarget)}`}>
                    {wordCount} / {wordTarget}
                  </span>
                </div>
              </button>

              {/* Content */}
              {isExpanded && (
                <div className="px-4 pb-4">
                  <div className="text-[12px] text-text-dim mb-2 pl-7">
                    {section.job}
                  </div>
                  <textarea
                    value={texts[section.key]}
                    onChange={(e) => handleTextChange(section.key, e.target.value)}
                    placeholder={`Write your ${section.label.toLowerCase()} here...`}
                    rows={section.pct >= 0.20 ? 8 : section.pct >= 0.10 ? 5 : 3}
                    className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-3 text-[14px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber/50 focus:ring-1 focus:ring-amber/20 transition-colors resize-y font-mono leading-relaxed"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
