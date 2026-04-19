'use client';

import { useState } from 'react';
import {
  TASTEMAKER_STATE_META,
  TASTEMAKER_THRESHOLDS,
  getTastemakerState,
  type TastemakerState,
} from '@/lib/tastemaker-state';

const SEGMENT_ORDER: TastemakerState[] = ['building', 'base', 'variations', 'saturated'];

const SEGMENT_THRESHOLDS: Record<TastemakerState, number> = {
  building: 0,
  base: TASTEMAKER_THRESHOLDS.base,
  variations: TASTEMAKER_THRESHOLDS.variations,
  saturated: TASTEMAKER_THRESHOLDS.saturated,
};

interface ProgressStaircaseProps {
  completedCount: number;
}

export default function ProgressStaircase({ completedCount }: ProgressStaircaseProps) {
  const [hovered, setHovered] = useState<TastemakerState | null>(null);
  const activeState = getTastemakerState(completedCount);
  const activeIndex = SEGMENT_ORDER.indexOf(activeState);
  const activeMeta = TASTEMAKER_STATE_META[activeState];

  const nextThreshold =
    activeState === 'saturated'
      ? TASTEMAKER_THRESHOLDS.saturated
      : SEGMENT_THRESHOLDS[SEGMENT_ORDER[activeIndex + 1]];

  const countLabel =
    activeState === 'saturated'
      ? `${completedCount} projects — ${activeMeta.label}`
      : `${completedCount} of ${nextThreshold} projects — ${activeMeta.label}`;

  return (
    <div className="space-y-2">
      <div className="flex gap-1.5">
        {SEGMENT_ORDER.map((segment, i) => {
          const meta = TASTEMAKER_STATE_META[segment];
          const isCompleted = i < activeIndex;
          const isActive = i === activeIndex;
          const segmentBg = isCompleted || isActive ? meta.color : '#2a2a2a';

          const startCount = SEGMENT_THRESHOLDS[segment];
          const endCount = SEGMENT_ORDER[i + 1] ? SEGMENT_THRESHOLDS[SEGMENT_ORDER[i + 1]] : startCount + 1;
          const span = Math.max(1, endCount - startCount);
          const fillPct = isActive
            ? Math.min(100, Math.max(0, ((completedCount - startCount) / span) * 100))
            : isCompleted
              ? 100
              : 0;

          return (
            <div
              key={segment}
              className="relative flex-1 group"
              onMouseEnter={() => setHovered(segment)}
              onMouseLeave={() => setHovered(null)}
            >
              <div
                className="h-2.5 rounded-full overflow-hidden"
                style={{ backgroundColor: isCompleted ? segmentBg : '#2a2a2a' }}
              >
                {isActive && (
                  <div
                    className="h-full transition-all duration-500"
                    style={{ width: `${fillPct}%`, backgroundColor: meta.color }}
                  />
                )}
              </div>
              {hovered === segment && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-bg-elevated border border-border rounded-lg px-3 py-2 shadow-lg z-10 pointer-events-none">
                  <p className="text-[12px] font-medium text-text-bright mb-1">{meta.label}</p>
                  <p className="text-[11px] text-text-dim leading-snug">{meta.tooltip}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-[12px] text-text-muted">{countLabel}</p>
    </div>
  );
}
