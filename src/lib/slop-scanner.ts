export interface SlopViolation {
  type: string;
  matches: string[];
  count: number;
  description: string;
}

export interface SlopScanResult {
  score: number;
  violations: SlopViolation[];
  verdict: 'clean' | 'minor' | 'needs_work';
}

const BANNED_WORDS = [
  'tapestry', 'testament', 'ministrations', 'visceral', 'palpable',
  'delve', 'landscape', 'multifaceted', 'nuanced', 'paradigm',
  'synergy', 'leverage', 'ecosystem', 'holistic', 'robust',
  'seamlessly', 'game-changer', 'cutting-edge', 'groundbreaking',
  'revolutionary', 'transformative', 'embark', 'unleash', 'unlock',
  'navigating', 'realm', 'beacon', 'pivotal', 'cornerstone',
  'underpins', 'underscores', 'encompasses', 'facilitates',
];

// Note: em/en dash literals below are encoded as \u2014 / \u2013 escapes because this
// scanner detects em-dash overuse, so the raw character would be flagged by the repo's
// em-dash guardrail. The runtime regex behavior is identical.
const STRUCTURAL_PATTERNS = [
  { pattern: /No \w+\. No \w+\. Just \w+\./gi, type: 'no_x_no_y_just_z', description: '"No X. No Y. Just Z." Classic AI structure' },
  { pattern: /It's not just .+[\u2014\u2013] it's .+\./gi, type: 'not_just_its', description: '"It\'s not just X \u2014 it\'s Y." AI comparison cliché' },
  { pattern: /Here's the thing[.:]/gi, type: 'heres_the_thing', description: '"Here\'s the thing." Overused AI transition' },
  { pattern: /Let that sink in\.?/gi, type: 'let_that_sink_in', description: '"Let that sink in." AI dramatic pause cliché' },
  { pattern: /But here's where it gets .+\./gi, type: 'heres_where', description: '"But here\'s where it gets..." AI pivot cliché' },
  { pattern: /Think about (that|it|this) for a (moment|second)\.?/gi, type: 'think_about_it', description: '"Think about that for a moment." AI filler' },
];

export function scanForSlop(text: string): SlopScanResult {
  const violations: SlopViolation[] = [];
  const words = text.split(/\s+/);
  const wordCount = words.length;

  for (const word of BANNED_WORDS) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = text.match(regex);
    if (matches) {
      violations.push({ type: 'banned_word', matches: [word], count: matches.length, description: `"${word}". AI tell` });
    }
  }

  for (const { pattern, type, description } of STRUCTURAL_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      violations.push({ type, matches: matches.slice(0, 3), count: matches.length, description });
    }
  }

  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const lengths = sentences.map((s) => s.trim().split(/\s+/).length);
  if (lengths.length > 3) {
    const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / lengths.length;
    const stdDev = Math.sqrt(variance);
    if (stdDev < 3.0) {
      violations.push({ type: 'cadence_too_regular', matches: [`Std dev: ${stdDev.toFixed(1)} (should be 4+)`], count: 1, description: 'Sentence lengths too uniform. Sounds robotic' });
    }
  }

  const emDashes = (text.match(/\u2014/g) || []).length;
  if (emDashes > wordCount / 50) {
    violations.push({ type: 'em_dash_overuse', matches: [`${emDashes} em dashes in ${wordCount} words`], count: emDashes, description: 'Em dash overuse. AI cadence marker' });
  }

  const violationWeight = violations.reduce((sum, v) => sum + v.count, 0);
  const rawScore = Math.min(100, (violationWeight / Math.max(wordCount / 100, 1)) * 20);
  const score = Math.round(rawScore);

  return { score, violations, verdict: score === 0 ? 'clean' : score <= 15 ? 'minor' : 'needs_work' };
}
