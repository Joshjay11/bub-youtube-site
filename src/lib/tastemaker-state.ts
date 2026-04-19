export type TastemakerState = 'building' | 'base' | 'variations' | 'saturated';

export const TASTEMAKER_THRESHOLDS = {
  base: 7,
  variations: 9,
  saturated: 25,
} as const;

export function getTastemakerState(completedProjectCount: number): TastemakerState {
  if (completedProjectCount >= TASTEMAKER_THRESHOLDS.saturated) return 'saturated';
  if (completedProjectCount >= TASTEMAKER_THRESHOLDS.variations) return 'variations';
  if (completedProjectCount >= TASTEMAKER_THRESHOLDS.base) return 'base';
  return 'building';
}

export interface TastemakerStateMeta {
  label: string;
  color: string;
  tooltip: string;
}

export const TASTEMAKER_STATE_META: Record<TastemakerState, TastemakerStateMeta> = {
  building: {
    label: 'Building your creative profile',
    color: '#4a4a4a',
    tooltip: `Complete ${TASTEMAKER_THRESHOLDS.base} projects (scripts of 200+ words) to unlock your base profile.`,
  },
  base: {
    label: 'Base profile ready',
    color: '#d4a342',
    tooltip: 'Creative Fingerprint, Voice Patterns, Portable Taste Profile, and Growth Suggestions are available.',
  },
  variations: {
    label: 'Voice variations unlocked',
    color: '#4ade80',
    tooltip: 'Three voice variations (Teach, Argue, Connect) are now available in addition to the base profile.',
  },
  saturated: {
    label: 'Saturation reached — tracking voice evolution',
    color: '#fbbf24',
    tooltip: 'Your profile is stable. Refreshes now track how your voice evolves over time.',
  },
};
