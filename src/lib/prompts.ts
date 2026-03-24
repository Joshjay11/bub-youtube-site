export interface PromptVariable {
  key: string;
  label: string;
  placeholder: string;
  multiline?: boolean;
}

export interface PromptTemplate {
  id: string;
  code: string;
  title: string;
  description: string;
  template: string;
  variables: PromptVariable[];
  goodOutput: string;
  redFlags: string;
  weakOutputTip?: string;
}

export const PROMPTS: PromptTemplate[] = [
  {
    id: 'find-angle',
    code: '3A',
    title: 'Find the Angle',
    description: 'Get 5 fresh angles for your video topic that your audience hasn\'t heard before.',
    template: `I'm making a YouTube video about {{topic}}. Here's what every other creator says about it: {{obvious_take}}. I need a fresh angle that my audience hasn't heard before.

My audience is: {{audience}}
My channel's perspective is: {{channel_lens}}

Give me 5 angles that are NOT the obvious take. For each one, tell me: what's the hook, what's the surprising insight, and why would someone who's already seen 3 videos on this topic click on THIS one?`,
    variables: [
      { key: 'topic', label: 'Topic', placeholder: 'e.g. "compound interest"' },
      { key: 'obvious_take', label: 'The Obvious Take', placeholder: 'e.g. "start investing early and let compound interest work for you"' },
      { key: 'audience', label: 'Your Audience', placeholder: 'e.g. "25-35 year olds who know they should invest but haven\'t started"' },
      { key: 'channel_lens', label: 'Your Channel\'s Perspective', placeholder: 'e.g. "behavioral psychology applied to personal finance"' },
    ],
    goodOutput: '5 distinct angles where at least 2 make you think "I haven\'t seen that before." The hooks should be specific, not generic.',
    redFlags: 'All 5 angles are variations of the same idea. The hooks are vague ("discover the truth about..."). The angles require expertise you don\'t have.',
    weakOutputTip: 'Add more context about what your audience already believes (from Viewer Belief Map) and what competitors have already covered.',
  },
  {
    id: 'cross-disciplinary',
    code: '3B',
    title: 'Find the Cross-Disciplinary Connection',
    description: 'Find unexpected connections between your topic and completely different fields.',
    template: `My video is about {{topic}}. I want to find an unexpected connection to a completely different field that makes the viewer say "I never thought about it that way."

What does {{topic}} have in common with:
- A concept from psychology?
- A historical event most people don't know?
- A principle from a totally unrelated industry?
- A scientific finding that contradicts common sense?

Give me the 3 strongest connections with a 2-sentence explanation of why each one works.`,
    variables: [
      { key: 'topic', label: 'Topic', placeholder: 'e.g. "why restaurant pasta tastes different from homemade"' },
    ],
    goodOutput: 'At least one connection that surprises YOU. The connections should be specific, not surface-level analogies.',
    redFlags: 'Connections are surface-level analogies. "It\'s like..." comparisons that don\'t add insight.',
  },
  {
    id: 'counter-arguments',
    code: '3C',
    title: 'Generate Counter-Arguments',
    description: 'Find the strongest objections to your thesis so you can address them in your script.',
    template: `My video argues that {{thesis}}. I need to know the strongest possible objections to this argument.

Give me the top 5 counter-arguments, ranked by how convincing they are. For each one:
1. State the objection clearly
2. What evidence supports it?
3. How would I address it in my script without dismissing it?`,
    variables: [
      { key: 'thesis', label: 'Your Thesis', placeholder: 'e.g. "morning routines are overrated and most productivity advice is survivorship bias"', multiline: true },
    ],
    goodOutput: 'At least one counter-argument that makes you uncomfortable. That\'s the one you need to address in your script.',
    redFlags: 'None of the counter-arguments challenge your position. The AI is going easy on you.',
    weakOutputTip: 'Re-prompt with "Be more aggressive. What would a smart critic say?"',
  },
  {
    id: 'outline-from-research',
    code: '3D',
    title: 'Outline from Research',
    description: 'Turn your research notes into a structured video outline with the BUB beat map.',
    template: `Here are my research notes for a video about {{topic}}:
{{research_notes}}

My angle is: {{angle}}
Target length: {{target_length}} minutes
Video type: {{video_type}}

Create an outline using this structure:
- Hook (0-30 seconds): contradiction or surprise
- Micro-Act 1 (30s - 3 min): first reward
- The 35% Pivot (3-4 min): the unexpected reframe
- Micro-Act 2 (4-7 min): deeper exploration with mini-payoffs
- Escalation (7-9 min): build to the grand payoff
- Payoff + Session Hook (9-end): resolution

For each section, give me:
- The key point
- One data point or example to use
- The transition to the next section`,
    variables: [
      { key: 'topic', label: 'Topic', placeholder: 'e.g. "why sleep is more important than exercise"' },
      { key: 'research_notes', label: 'Research Notes', placeholder: 'Paste your key findings, stats, and insights...', multiline: true },
      { key: 'angle', label: 'Your Angle', placeholder: 'e.g. "the sleep-exercise paradox: why optimizing sleep gives better fitness results than more gym time"' },
      { key: 'target_length', label: 'Target Length (minutes)', placeholder: '12' },
      { key: 'video_type', label: 'Video Type', placeholder: 'e.g. Explainer, Tutorial, Story, Commentary, Listicle' },
    ],
    goodOutput: 'A clear outline where each section builds on the previous one, with specific data points and smooth transitions.',
    redFlags: 'Sections feel disconnected. The pivot doesn\'t actually reframe anything. Transitions are generic ("moving on...").',
  },
  {
    id: 'hook-variants',
    code: '3E',
    title: 'Hook Variants',
    description: 'Generate 5 different hooks using different techniques for the first 10 seconds.',
    template: `My video is about: {{topic}}
My angle is: {{angle}}
My title is: {{title}}
My audience believes: {{audience_belief}}

Write 5 different hooks for the first 10 seconds.
Each must use a different technique:
1. A contradiction hook
2. A cold open (drop into a scene)
3. A data-driven hook (surprising number)
4. A question hook
5. A stakes hook (why this matters RIGHT NOW)

Each hook: 2-3 sentences max, written for spoken delivery (short sentences, conversational, no filler).`,
    variables: [
      { key: 'topic', label: 'Topic', placeholder: 'e.g. "the hidden cost of free apps"' },
      { key: 'angle', label: 'Your Angle', placeholder: 'e.g. "free apps cost you more in attention and data than paid alternatives"' },
      { key: 'title', label: 'Your Title', placeholder: 'e.g. "The App on Your Phone That\'s Costing You $1,200 a Year"' },
      { key: 'audience_belief', label: 'What Your Audience Believes', placeholder: 'e.g. "free apps are a good deal because you\'re not paying anything"' },
    ],
    goodOutput: '5 genuinely different hooks where at least 2 make you want to keep watching. Written for spoken delivery, not essays.',
    redFlags: 'All hooks sound the same. They start with "I" or "So." They\'re longer than 3 sentences.',
  },
  {
    id: 'script-audit',
    code: '3F',
    title: 'Script Audit',
    description: 'Get an AI audit of your script draft for retention problems with specific fixes.',
    template: `Here is my script draft:
{{script}}

Audit this script for retention problems:

1. Does the hook deliver on the title promise within 30 seconds?
2. Where are the potential drop-off points?
3. Are there pattern interrupts every 20-30 seconds?
4. Is there a clear pivot or surprise at the 35% mark?
5. Are open loops planted early and paid off later?
6. Does the ending resolve everything AND point to the next video?
7. Would a viewer who left at 50% feel they got value?

For each problem found, suggest a specific fix.`,
    variables: [
      { key: 'script', label: 'Your Script Draft', placeholder: 'Paste your full script here...', multiline: true },
    ],
    goodOutput: 'Specific, actionable feedback pointing to exact moments in your script. Each problem comes with a concrete fix, not just "make it better."',
    redFlags: 'Vague feedback like "the middle could be stronger." No specific timestamps or sections referenced.',
  },
  {
    id: 'compression-check',
    code: '3G',
    title: 'Compression Check',
    description: 'Tighten wordy script sections into conversational, fast-paced delivery.',
    template: `Here is a section of my script that feels too long or academic:

{{section}}

Rewrite using conversational compression:
- Target: 8th grade reading level
- Average sentence length: 8-12 words
- Use analogies instead of jargon
- Must pass the barstool test (say it to a friend at a bar)
- Keep ALL key information, just deliver it faster

Give me 2 versions: one tight, one ultra-tight.`,
    variables: [
      { key: 'section', label: 'Script Section', placeholder: 'Paste the section that feels too long or academic...', multiline: true },
    ],
    goodOutput: 'Two versions that preserve all key information but sound like someone talking, not writing. The ultra-tight version should feel almost aggressive in its brevity.',
    redFlags: 'The rewrite loses key information. It sounds like a textbook summary instead of speech. Sentences are all the same length.',
  },
  {
    id: 'output-quality-scorecard',
    code: '3H',
    title: 'AI Output Quality Scorecard',
    description: 'Score any AI-generated structural output (outline, hook set, beat map) before using it.',
    template: `I asked an AI to generate the following structural output for my YouTube video:

{{ai_output}}

Score this output on each criterion (1-5):

1. Clear open loop in first 15 seconds?
2. Each section has a mini-payoff before the next?
3. At least 2 pattern interrupts planned?
4. Tension/stakes escalate as it progresses?
5. Specific proof or credential moment included?
6. Ending ties back to the opening?
7. Skeptical viewer would stay through the middle?
8. Deliverable in MY voice without major rewrites?

Give each criterion a score and a one-sentence explanation. Then give a total score out of 40 with a verdict:
- 30+: Use it. Edit for voice, but the structure is sound.
- 20-29: Heavy editing needed. The bones are there but it needs surgery.
- Below 20: Reject. Re-prompt with more context.`,
    variables: [
      { key: 'ai_output', label: 'AI Output to Score', placeholder: 'Paste the AI-generated outline, hook set, or beat map...', multiline: true },
    ],
    goodOutput: 'Honest scoring with specific explanations. At least 2 criteria should score below 3 — if everything scores 4-5, the AI is being too generous.',
    redFlags: 'All scores are 4-5 with vague justifications. No specific critique of weak sections.',
  },
];

/**
 * Inject variable values into a prompt template.
 * Replaces {{key}} placeholders with provided values.
 */
export function injectVariables(template: string, values: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return values[key] ?? match;
  });
}
