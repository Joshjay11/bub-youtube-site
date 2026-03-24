export default function FailureModesPage() {
  const modes = [
    {
      num: 1, title: 'Hook Too Broad',
      looks: 'Today we\'re going to talk about productivity.',
      why: 'No curiosity gap. No reason to stay.',
      fix: 'I tracked my output for 90 days using 6 different systems. Only one of them actually worked — and it\'s the one nobody recommends.',
    },
    {
      num: 2, title: 'Hook Overpromises',
      looks: 'Title says "SHOCKING results" but the content is mildly interesting.',
      why: 'Satisfaction score tanks. Algorithm learns your titles lie.',
      fix: 'Match your emotional intensity. If the content is "interesting," say "interesting." Save "shocking" for when something is actually shocking.',
    },
    {
      num: 3, title: 'Intro Takes Too Long',
      looks: '45+ seconds before the first piece of value.',
      why: 'The viewer came for the promise. Every second of context is borrowed time.',
      fix: 'Lead with a micro-payoff in the first 30 seconds. Give them one insight immediately, THEN add context.',
    },
    {
      num: 4, title: 'Point Is Buried Under Setup',
      looks: '2 minutes of background before the actual insight.',
      why: 'The viewer feels lectured at, not rewarded.',
      fix: 'State the insight first, then explain why it matters. "The answer is X. Here\'s how we know, and why it changes everything."',
    },
    {
      num: 5, title: 'Example Is Too Generic',
      looks: 'Imagine you\'re someone who wants to be more productive...',
      why: 'Hypotheticals don\'t engage. Real stories do.',
      fix: 'My friend Sarah runs a 7-figure business and can\'t wake up before 10am. Here\'s her system.',
    },
    {
      num: 6, title: 'Transition Feels Random',
      looks: 'Okay, moving on to the next point...',
      why: 'The viewer feels the structure. Structure should be invisible.',
      fix: 'Use a bridge question: "But that raises a problem. If X is true, then why does Y happen?"',
    },
    {
      num: 7, title: 'Middle Repeats Itself',
      looks: 'The same point made three ways in different sections.',
      why: 'The viewer feels like they\'re not progressing.',
      fix: 'Each section must teach something NEW. If a section only reinforces a previous point, cut it.',
    },
    {
      num: 8, title: 'No Pivot at 35%',
      looks: 'Single thread from start to finish.',
      why: 'Curiosity expires. One question only sustains attention for 3-4 minutes.',
      fix: 'Introduce a second question that reframes the first. See the 35% Pivot guide.',
    },
    {
      num: 9, title: 'Best Content Saved for the End',
      looks: 'The most surprising insight is at the 85% mark.',
      why: '60% of viewers never see it. Your best work is wasted.',
      fix: 'Put your strongest content at the 50% mark. The ending resolves — it doesn\'t reveal.',
    },
    {
      num: 10, title: 'Payoff Arrives Too Late',
      looks: 'So what does all of this mean?" at the 90% mark.',
      why: 'Viewers who stayed that long are already committed. The ones you LOST were the ones who needed the payoff earlier.',
      fix: 'Scatter mini-payoffs throughout. Each section should reward the viewer for staying.',
    },
    {
      num: 11, title: 'Pacing Is Monotone',
      looks: 'Every section is the same length, same energy, same structure.',
      why: 'Predictability is the enemy of attention.',
      fix: 'Alternate dense sections with breathing room. Follow a 90-second deep dive with a 20-second anecdote.',
    },
    {
      num: 12, title: 'Too Much Hedging',
      looks: '"Maybe," "kind of," "I think," "it\'s possible that" in every paragraph.',
      why: 'Uncertainty is contagious. If you don\'t sound sure, the viewer doesn\'t feel sure.',
      fix: 'State claims directly. Use hedging only when intellectual honesty requires it — and make the uncertainty interesting.',
    },
    {
      num: 13, title: 'Ending Is Abrupt',
      looks: 'Final point → "Thanks for watching!" → End screen.',
      why: 'No resolution. Open loops dangling. Viewer feels unsatisfied.',
      fix: 'Resolve every loop. Then bridge: "And that\'s exactly why [specific next video] matters. I\'ll link it here."',
    },
    {
      num: 14, title: 'Script Sounds Written, Not Spoken',
      looks: 'Long sentences, passive voice, complex subordinate clauses.',
      why: 'The creator stumbles reading it. The stumble shows on camera.',
      fix: 'Read it aloud. Every stumble gets rewritten. If you can\'t say it in one breath, split it.',
    },
    {
      num: 15, title: 'Fact Without Context',
      looks: 'The market grew by 47% last year.',
      why: 'Numbers without meaning are noise.',
      fix: 'The market grew by 47% last year — that\'s faster than crypto in 2017. And nobody saw it coming.',
    },
  ];

  return (
    <div className="max-w-3xl">
      <h1 className="font-serif text-[32px] text-text-bright mb-2">15 Retention Failure Modes</h1>
      <p className="text-text-dim text-[15px] mb-8">
        When a video underperforms, diagnose it here. Each failure mode includes what it looks like, why it kills retention, and a before/after fix.
      </p>

      <div className="space-y-4">
        {modes.map((mode) => (
          <div key={mode.num} className="bg-bg-card border border-border rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-lg bg-red/10 text-red text-[13px] font-bold flex items-center justify-center">{mode.num}</span>
              <h3 className="text-[16px] font-medium text-text-bright">{mode.title}</h3>
            </div>

            <div className="bg-bg-elevated rounded-lg px-4 py-3 space-y-2">
              <div>
                <span className="text-[12px] text-red font-medium">Looks like: </span>
                <span className="text-[13px] text-text-dim italic">&ldquo;{mode.looks}&rdquo;</span>
              </div>
              <div>
                <span className="text-[12px] text-amber font-medium">Why it kills: </span>
                <span className="text-[13px] text-text-dim">{mode.why}</span>
              </div>
            </div>

            <div className="border-l-2 border-green/50 pl-4">
              <span className="text-[12px] text-green font-medium">Fix: </span>
              <span className="text-[14px] text-text-primary">{mode.fix}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
