export interface Hook {
  id: number;
  hook_text: string;
  creator: string;
  video_title: string;
  channel_size: 'large' | 'mid' | 'small';
  hook_type: 'contradiction' | 'cold_open' | 'challenge' | 'question' | 'stakes' | 'data';
  niche: string;
  score: number;
  why_it_works: string;
  what_youd_change: string;
  steal_this_structure: string;
  best_for: string;
  avoid_for: string;
  confidence: string;
  source_model: string;
}

export const HOOK_TYPES = [
  { value: 'contradiction', label: 'Contradiction' },
  { value: 'cold_open', label: 'Cold Open' },
  { value: 'challenge', label: 'Challenge' },
  { value: 'question', label: 'Question' },
  { value: 'stakes', label: 'Stakes' },
  { value: 'data', label: 'Data' },
] as const;

export const NICHES = [
  'science', 'tech', 'health', 'finance', 'productivity',
  'cooking', 'travel', 'creative', 'history', 'gaming',
] as const;

export const CHANNEL_SIZES = [
  { value: 'large', label: 'Large (1M+)' },
  { value: 'mid', label: 'Mid (100K-1M)' },
  { value: 'small', label: 'Small (<100K)' },
] as const;

// Import the JSON data
import hooksJson from '../../hooks_database.json';
export const HOOKS: Hook[] = hooksJson as Hook[];
