'use client';

import { useState } from 'react';

interface AuditItem {
  key: string;
  label: string;
  mustPass: boolean;
}

interface AuditSection {
  title: string;
  items: AuditItem[];
}

const AUDIT_SECTIONS: AuditSection[] = [
  {
    title: 'The Hook',
    items: [
      { key: 'hookDelivers', label: 'Hook delivers on title/thumbnail promise within 30 seconds', mustPass: true },
      { key: 'noThroatClearing', label: 'Zero throat-clearing sentences in first 15 seconds (no "Hey guys," no "So today...")', mustPass: true },
      { key: 'valuePromise', label: 'Value promise is EXPLICIT within 15 seconds', mustPass: false },
      { key: 'noBackButton', label: 'A viewer would NOT hit back button after 30 seconds', mustPass: false },
    ],
  },
  {
    title: 'Open Loops',
    items: [
      { key: 'twoLoops', label: 'At least 2 unresolved questions planted in first 90 seconds', mustPass: true },
      { key: 'loopPayoffs', label: 'Each loop has a SPECIFIC payoff later (you can point to the timestamp)', mustPass: false },
      { key: 'loopsInteresting', label: 'Loops are interesting enough that the viewer actively wants the answer', mustPass: false },
    ],
  },
  {
    title: 'Pattern Interrupts',
    items: [
      { key: 'shiftEvery30', label: 'Substantive shift every 20–30 seconds (new data, tonal change, rhetorical question)', mustPass: false },
      { key: 'contentDriven', label: 'Interrupts are content-driven (not just "cut to B-roll")', mustPass: false },
      { key: 'no45SecDrought', label: 'No section goes longer than 45 seconds without some kind of shift', mustPass: false },
    ],
  },
  {
    title: 'The 35% Pivot',
    items: [
      { key: 'clearPivot', label: 'Clear reframe at roughly the 1/3 mark', mustPass: true },
      { key: 'pivotNewAngle', label: 'Pivot introduces a new angle or cross-disciplinary connection', mustPass: false },
      { key: 'pivotReframes', label: 'Viewer thinks differently about the topic after the pivot', mustPass: false },
    ],
  },
  {
    title: 'The Sagging Middle',
    items: [
      { key: 'strongMiddle', label: 'Strongest or most controversial content is at 50% mark, NOT the end', mustPass: true },
      { key: 'middleMiniHooks', label: 'Middle section has its own mini-hooks and mini-payoffs', mustPass: false },
      { key: 'midpointRewards', label: 'Viewer at midpoint has received at least 2 concrete rewards', mustPass: false },
    ],
  },
  {
    title: 'Pacing',
    items: [
      { key: 'readAloud', label: 'Read the entire script aloud without stumbling', mustPass: true },
      { key: 'timingMatch', label: 'Timing matches target length at natural speaking pace', mustPass: false },
      { key: 'rhythmVariation', label: 'Rhythmic variation (not every sentence is the same length)', mustPass: false },
      { key: 'denseBreathing', label: 'Dense sections followed by breathing room', mustPass: false },
    ],
  },
  {
    title: 'Conversational Quality',
    items: [
      { key: 'barstoolTest', label: 'Every sentence passes the barstool test', mustPass: true },
      { key: 'noAIFiller', label: 'No AI filler: "truly," "essentially," "it\'s worth noting," "dive in," "without further ado"', mustPass: true },
      { key: 'contractions', label: "Contractions used naturally (don't, can't, won't)", mustPass: false },
      { key: 'soundsLikeYou', label: 'Script sounds like YOU, not like "a YouTube script"', mustPass: false },
      { key: 'noPassiveJargon', label: 'No passive voice, no jargon without translation', mustPass: false },
    ],
  },
  {
    title: 'The Ending',
    items: [
      { key: 'allLoopsResolved', label: 'All open loops resolved', mustPass: true },
      { key: 'targetEmotion', label: 'Viewer feels the specific emotion you intended', mustPass: false },
      { key: 'sessionHook', label: 'Session hook to a SPECIFIC next video', mustPass: false },
      { key: 'briefCTA', label: 'CTA is brief and natural (if included at all)', mustPass: false },
    ],
  },
  {
    title: 'Fact-Check',
    items: [
      { key: 'verifiedStats', label: 'Every statistic has a verifiable source', mustPass: true },
      { key: 'hedgingUsed', label: 'Claims you\'re uncertain about use appropriate hedging', mustPass: false },
      { key: 'noCommunityNote', label: 'Nothing could trigger a Community Note', mustPass: false },
    ],
  },
];

const ALL_ITEMS = AUDIT_SECTIONS.flatMap((s) => s.items);
const MUST_PASS_ITEMS = ALL_ITEMS.filter((i) => i.mustPass);
const TOTAL_COUNT = ALL_ITEMS.length;
const MUST_PASS_COUNT = MUST_PASS_ITEMS.length;

type Checks = Record<string, boolean>;

function getOverallVerdict(mustPassChecked: number, totalChecked: number): { label: string; color: string; advice: string } {
  if (mustPassChecked === MUST_PASS_COUNT && totalChecked >= TOTAL_COUNT * 0.8) {
    return { label: 'Ready to record', color: 'text-green', advice: 'All MUST PASS items cleared and strong overall coverage.' };
  }
  if (mustPassChecked < MUST_PASS_COUNT) {
    return { label: 'Fix MUST PASS items first', color: 'text-red', advice: `${MUST_PASS_COUNT - mustPassChecked} non-negotiable item${MUST_PASS_COUNT - mustPassChecked === 1 ? '' : 's'} still unchecked.` };
  }
  return { label: 'Major revision needed', color: 'text-amber', advice: 'MUST PASS items cleared but too many secondary items are weak.' };
}

export default function ScriptAudit() {
  const [checks, setChecks] = useState<Checks>(
    Object.fromEntries(ALL_ITEMS.map((i) => [i.key, false]))
  );

  const totalChecked = Object.values(checks).filter(Boolean).length;
  const mustPassChecked = MUST_PASS_ITEMS.filter((i) => checks[i.key]).length;
  const verdict = getOverallVerdict(mustPassChecked, totalChecked);

  function toggle(key: string) {
    setChecks((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleReset() {
    setChecks(Object.fromEntries(ALL_ITEMS.map((i) => [i.key, false])));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-[24px] text-text-bright">Script Ready Audit</h2>
          <p className="text-text-dim text-[13px] mt-1">Run through this before finalizing any script. Items marked <span className="text-red font-medium">MUST PASS</span> are non-negotiable.</p>
        </div>
        <button
          onClick={handleReset}
          className="text-[13px] text-text-muted hover:text-text-dim transition-colors px-3 py-1.5 rounded-lg border border-border hover:border-border-light"
        >
          Reset
        </button>
      </div>

      {/* Progress overview */}
      <div className="bg-bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-6">
            <div>
              <div className="text-[12px] text-text-muted uppercase tracking-wider">Must Pass</div>
              <div className={`text-[24px] font-mono font-bold ${mustPassChecked === MUST_PASS_COUNT ? 'text-green' : 'text-red'}`}>
                {mustPassChecked}<span className="text-text-muted text-[14px]"> / {MUST_PASS_COUNT}</span>
              </div>
            </div>
            <div className="w-px h-8 bg-border" />
            <div>
              <div className="text-[12px] text-text-muted uppercase tracking-wider">Total</div>
              <div className="text-[24px] font-mono font-bold text-text-bright">
                {totalChecked}<span className="text-text-muted text-[14px]"> / {TOTAL_COUNT}</span>
              </div>
            </div>
          </div>
          <div className={`text-[16px] font-bold ${verdict.color}`}>{verdict.label}</div>
        </div>
        {/* Combined progress bar */}
        <div className="h-3 bg-bg-elevated rounded-full overflow-hidden flex">
          <div
            className="h-full bg-green transition-all duration-300"
            style={{ width: `${(totalChecked / TOTAL_COUNT) * 100}%` }}
          />
        </div>
        <p className="text-text-dim text-[13px] mt-2">{verdict.advice}</p>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {AUDIT_SECTIONS.map((section) => {
          const sectionChecked = section.items.filter((i) => checks[i.key]).length;

          return (
            <div key={section.title} className="bg-bg-card border border-border rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-border/50">
                <h3 className="text-[15px] font-medium text-text-bright">{section.title}</h3>
                <span className="text-[12px] text-text-muted">{sectionChecked}/{section.items.length}</span>
              </div>
              <div className="divide-y divide-border/30">
                {section.items.map((item) => (
                  <label
                    key={item.key}
                    className={`flex items-start gap-4 px-5 py-3.5 cursor-pointer hover:bg-bg-card-hover/50 transition-colors ${
                      item.mustPass && !checks[item.key] ? 'border-l-2 border-l-red' : ''
                    }`}
                  >
                    <div className="relative shrink-0 mt-0.5">
                      <input
                        type="checkbox"
                        checked={checks[item.key]}
                        onChange={() => toggle(item.key)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${
                        checks[item.key]
                          ? 'bg-green border-green'
                          : item.mustPass
                            ? 'border-red/50 bg-red/5'
                            : 'border-border-light bg-bg-elevated'
                      }`}>
                        {checks[item.key] && (
                          <svg className="w-3.5 h-3.5 text-bg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className={`text-[14px] ${checks[item.key] ? 'text-text-bright line-through opacity-60' : 'text-text-primary'}`}>
                        {item.label}
                      </span>
                      {item.mustPass && !checks[item.key] && (
                        <span className="inline-block ml-2 text-[11px] font-bold text-red bg-red/10 px-1.5 py-0.5 rounded">MUST PASS</span>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
