export default function HookExamplesPage() {
  const examples = [
    {
      type: 'Contradiction',
      bad: {
        text: "Today I'll explain why everything you know about productivity is wrong.",
        score: '3/10',
        why: '"Everything you know" is too broad. "Today I\'ll explain" is throat-clearing. No specificity.',
      },
      better: {
        text: "The most productive people in the world don't use to-do lists. Here's what they do instead.",
        score: '6/10',
        why: 'Specific claim (no to-do lists). Creates curiosity (what DO they use?). But "most productive" is vague — who? Prove it.',
      },
      best: {
        text: "I tracked 200 CEOs for a year. The ones who got the most done had one thing in common — and it's not discipline, focus, or morning routines.",
        score: '9/10',
        why: 'Specific data (200 CEOs, one year). Rules out the obvious answers. The viewer HAS to know. Credibility baked in.',
      },
    },
    {
      type: 'Question',
      bad: {
        text: 'Have you ever wondered why some thumbnails get more clicks?',
        score: '3/10',
        why: 'Low specificity. "Some thumbnails" is vague. No stakes.',
      },
      better: {
        text: 'Why do some thumbnails get 10% CTR while others get 2%? I tested 50 to find out.',
        score: '6/10',
        why: 'Numbers. Personal experiment. But "I tested 50" is modest — not enough to feel authoritative.',
      },
      best: {
        text: "Why do some thumbnails get 10% CTR? I tested 200 across 6 niches and found a pattern that contradicts what every thumbnail expert says.",
        score: '9/10',
        why: 'Larger dataset. Cross-niche (generalizable). "Contradicts experts" creates tension. Two curiosity gaps — the pattern AND why experts are wrong.',
      },
    },
    {
      type: 'Cold Open / Story',
      bad: {
        text: 'So I was at this conference last week and something interesting happened.',
        score: '3/10',
        why: 'No visual. No stakes. "Something interesting" is the viewer\'s job to decide, not yours.',
      },
      better: {
        text: 'Three months ago, a researcher walked into a lab in Zurich and ran an experiment that should have been impossible.',
        score: '6/10',
        why: 'Specificity (Zurich, three months ago). "Should have been impossible" creates stakes. But we don\'t know WHY we should care yet.',
      },
      best: {
        text: "The room was empty except for a single monitor showing a number nobody expected. The researcher checked it twice. Then she called her supervisor. Then the supervisor called the press. Within 48 hours, three governments were scrambling.",
        score: '9/10',
        why: "Cinematic. Escalating stakes in real-time. You're IN the scene. Multiple layers of reaction confirm this is important before you even know what happened.",
      },
    },
    {
      type: 'Data',
      bad: {
        text: 'Statistics show that most people fail at their goals.',
        score: '3/10',
        why: '"Statistics show" is the weakest attribution in language. "Most people" and "goals" are both vague.',
      },
      better: {
        text: "92% of New Year's resolutions fail by February. But there's a psychological trick that flips those odds.",
        score: '6/10',
        why: 'Specific number. Specific timeframe. Promise of a solution.',
      },
      best: {
        text: "A 40-year longitudinal study at Harvard tracked 724 people from their twenties to their eighties. The single strongest predictor of whether they were healthy and happy had nothing to do with money, career, or exercise.",
        score: '9/10',
        why: 'Massive authority (Harvard, 40 years, 724 people). Rules out three obvious answers. The viewer literally cannot not click.',
      },
    },
    {
      type: 'Challenge',
      bad: {
        text: 'I decided to try something different this month.',
        score: '3/10',
        why: 'No specificity. No stakes. "Something different" means nothing.',
      },
      better: {
        text: "I deleted all social media for 30 days. Here's what happened to my productivity.",
        score: '6/10',
        why: 'Clear experiment. Time-bound. Measurable outcome.',
      },
      best: {
        text: "I gave $50,000 of my company's ad budget to an AI and told it to run everything for 90 days. I wasn't allowed to touch a single campaign. The results broke three things I believed about marketing.",
        score: '9/10',
        why: "Real money (stakes). Constraint (wasn't allowed to touch). Specific outcome (broke three beliefs). The risk is tangible.",
      },
    },
    {
      type: 'Stakes',
      bad: {
        text: 'This is something you should really pay attention to.',
        score: '3/10',
        why: "Telling someone to care doesn't make them care. No specificity.",
      },
      better: {
        text: "In 2026, YouTube is changing how it recommends videos. If you're a creator, this affects you starting next month.",
        score: '6/10',
        why: 'Specific platform, specific year, specific timeline. But "this affects you" is still vague — HOW?',
      },
      best: {
        text: "In 47 days, YouTube will finish rolling out a system that makes watch time less important than viewer satisfaction. Channels optimized for watch time are about to see their traffic cut in half. Here's how to be on the right side of it.",
        score: '9/10',
        why: 'Exact number (47 days). Specific consequence (traffic cut in half). Clear division (right side vs. wrong side). Urgency without clickbait.',
      },
    },
  ];

  return (
    <div className="max-w-3xl">
      <h1 className="font-serif text-[32px] text-text-bright mb-2">Bad / Better / Best Hook Examples</h1>
      <p className="text-text-dim text-[15px] mb-8">
        For each hook type, here&apos;s what a 3/10, 6/10, and 9/10 looks like — and why.
      </p>

      <div className="space-y-10">
        {examples.map((example) => (
          <div key={example.type}>
            <h2 className="font-serif text-[22px] text-text-bright mb-4">{example.type}</h2>
            <div className="space-y-3">
              {/* Bad */}
              <div className="bg-bg-card border border-red/20 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[12px] font-bold text-red bg-red/10 px-2 py-0.5 rounded">BAD</span>
                  <span className="text-[12px] text-text-muted">{example.bad.score}</span>
                </div>
                <p className="text-[15px] text-text-bright italic mb-2">&ldquo;{example.bad.text}&rdquo;</p>
                <p className="text-[13px] text-text-dim"><span className="text-red">Why it fails:</span> {example.bad.why}</p>
              </div>

              {/* Better */}
              <div className="bg-bg-card border border-amber/20 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[12px] font-bold text-amber bg-amber/10 px-2 py-0.5 rounded">BETTER</span>
                  <span className="text-[12px] text-text-muted">{example.better.score}</span>
                </div>
                <p className="text-[15px] text-text-bright italic mb-2">&ldquo;{example.better.text}&rdquo;</p>
                <p className="text-[13px] text-text-dim"><span className="text-amber">Why it&apos;s better:</span> {example.better.why}</p>
              </div>

              {/* Best */}
              <div className="bg-bg-card border border-green/20 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[12px] font-bold text-green bg-green/10 px-2 py-0.5 rounded">BEST</span>
                  <span className="text-[12px] text-text-muted">{example.best.score}</span>
                </div>
                <p className="text-[15px] text-text-bright italic mb-2">&ldquo;{example.best.text}&rdquo;</p>
                <p className="text-[13px] text-text-dim"><span className="text-green">Why it works:</span> {example.best.why}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
