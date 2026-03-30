export default function WorkflowPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="font-serif text-[32px] text-text-bright mb-2">Workflow</h1>
      <p className="text-text-dim text-[15px] mb-8">
        Two paths depending on what you need. The Fast Path gets a script done in ~2 hours. The Quality Path is a 3-day deep dive for high-stakes videos.
      </p>

      <div className="space-y-12">
        {/* Fast Path */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <span className="text-[12px] font-bold text-amber bg-amber/10 px-2 py-0.5 rounded">6A</span>
            <h2 className="font-serif text-[24px] text-text-bright">Minimum Viable Script (The Fast Path)</h2>
          </div>
          <p className="text-[14px] text-text-dim mb-5">
            For when you need a script done, not perfected. Follow these steps in order. Set a timer for each. When the timer goes off, move to the next step even if you&apos;re not &ldquo;done.&rdquo;
          </p>

          <div className="space-y-3">
            {[
              { step: 1, time: '10 min', title: 'Idea Scorecard', module: '0A', desc: "Score the idea. If it's below 30, pick a different idea. Don't script something that's DOA.", link: '/app/idea-validator' },
              { step: 2, time: '10 min', title: 'Viewer Belief Map', module: '0B', desc: 'What do they believe before, what should they believe after.', link: '/app/idea-validator' },
              { step: 3, time: '30 min MAX', title: 'Research Sprint', module: 'M1+M3', desc: "Find: 3–5 key facts, 1 surprising thing, 1 counter-argument, 1 cross-disciplinary connection. Use AI prompts. When the timer goes off, STOP.", link: '/app/ai-prompts' },
              { step: 4, time: '5 min', title: 'Pick Structure + Set Pacing', module: '2A+4A', desc: 'Use the Decision Tree. Pick your template. Run the Pacing Calculator. You now have word count targets.', link: '/app/write' },
              { step: 5, time: '15 min', title: 'Write the Hook', module: '2E+2G', desc: "Use the Hook Formula Bank. Write 2–3 versions. Score them on the Scorecard. Pick the highest scorer.", link: '/app/structure' },
              { step: 6, time: '30 min', title: 'Fill the Canvas', module: '4B', desc: "Section by section, don't polish. Ugly is fine. Hit the word count targets.", link: '/app/write' },
              { step: 7, time: '15 min', title: 'Audit + Read-Aloud', module: '5A', desc: 'Run the MUST PASS items from the Script Ready Audit. Read the whole thing aloud with a stopwatch. Fix every stumble.', link: '/app/optimize' },
            ].map((item) => (
              <a
                key={item.step}
                href={item.link}
                className="flex items-start gap-4 bg-bg-card border border-border rounded-xl p-5 hover:border-amber/30 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-amber/10 text-amber text-[14px] font-bold flex items-center justify-center shrink-0">
                  {item.step}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[15px] font-medium text-text-bright group-hover:text-amber transition-colors">{item.title}</span>
                    <span className="text-[11px] text-text-muted font-mono">{item.module}</span>
                  </div>
                  <p className="text-[13px] text-text-dim">{item.desc}</p>
                </div>
                <span className="text-[13px] text-amber font-mono shrink-0">{item.time}</span>
              </a>
            ))}
          </div>

          <div className="mt-4 bg-bg-elevated border border-border rounded-xl p-4 text-center">
            <p className="text-[14px] text-text-dim">
              <span className="text-amber font-medium">Total: ~2 hours.</span> Your first few scripts will take longer. By script 5, this becomes muscle memory.
            </p>
          </div>

          <div className="mt-3 bg-bg-card border border-amber/20 rounded-xl p-4">
            <p className="text-[13px] text-text-dim">
              <span className="text-amber font-medium">Decision gate after Step 3:</span> If you don&apos;t have a clear angle after 30 minutes, either the topic needs more exploration or it&apos;s not strong enough. Check your Idea Scorecard again.
            </p>
          </div>

          <div className="mt-3 bg-bg-card border border-border rounded-xl p-4">
            <p className="text-[13px] text-text-dim">
              <span className="text-text-bright font-medium">Stuck on the hook?</span> Skip it. Write the body first. The hook reveals itself once you know what the strongest moment is.
            </p>
          </div>
        </section>

        <hr className="rule" style={{ margin: '0' }} />

        {/* Quality Path */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <span className="text-[12px] font-bold text-amber bg-amber/10 px-2 py-0.5 rounded">6B</span>
            <h2 className="font-serif text-[24px] text-text-bright">Deep-Dive Optimization (The Quality Path)</h2>
          </div>
          <p className="text-[14px] text-text-dim mb-5">
            For high-stakes videos, sponsor integrations, or when you want top-tier quality.
          </p>

          <div className="space-y-4">
            {[
              {
                day: 'Day 1', title: 'Research + Concept', time: '2–3 hours',
                items: [
                  'Full Idea Scorecard + Viewer Belief Map',
                  'Full Competitive Video Analysis (all 3 videos)',
                  'Title/Thumbnail Matrix + Alignment Planner',
                  'Extended research using AI prompts (3A through 3E)',
                  'Framing Worksheet',
                ],
              },
              {
                day: 'Day 2', title: 'Structure + Draft', time: '2–3 hours',
                items: [
                  'Video Type Decision Tree + template selection',
                  'Pacing Calculator',
                  'Full script draft in the Canvas',
                  'Let it sit overnight',
                ],
              },
              {
                day: 'Day 3', title: 'Refine + Polish', time: '1–2 hours',
                items: [
                  'Full Script Ready Audit (all items, not just MUST PASS)',
                  'AI Outline Audit prompt (3F)',
                  'Read-aloud pass with stopwatch',
                  'Compression check on any heavy sections',
                  'Satisfaction Engineering Checklist',
                  'Retention Prediction',
                ],
              },
            ].map((day) => (
              <div key={day.day} className="bg-bg-card border border-border rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[16px] font-medium text-text-bright">{day.day}: {day.title}</h3>
                  <span className="text-[13px] text-amber font-mono">{day.time}</span>
                </div>
                <ul className="space-y-1.5">
                  {day.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-[13px] text-text-dim">
                      <span className="text-amber mt-0.5">-</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <hr className="rule" style={{ margin: '0' }} />

        {/* What This Template Can and Can't Do */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <span className="text-[12px] font-bold text-amber bg-amber/10 px-2 py-0.5 rounded">6C</span>
            <h2 className="font-serif text-[24px] text-text-bright">What This System Can and Can&apos;t Do</h2>
          </div>
          <p className="text-[14px] text-text-dim mb-5">An honest diagnostic.</p>

          <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-[12px] text-text-muted font-medium px-5 py-3 uppercase tracking-wider">Challenge</th>
                  <th className="text-center text-[12px] text-green font-medium px-3 py-3 uppercase tracking-wider w-28">Handles It</th>
                  <th className="text-center text-[12px] text-amber font-medium px-3 py-3 uppercase tracking-wider w-28">Framework</th>
                  <th className="text-center text-[12px] text-text-dim font-medium px-3 py-3 uppercase tracking-wider w-28">Human Only</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { challenge: 'Structuring for retention', handles: true, framework: false, human: false },
                  { challenge: 'Generating video ideas', handles: false, framework: true, human: false },
                  { challenge: 'Writing hooks', handles: false, framework: true, human: false },
                  { challenge: 'Pacing for your speaking style', handles: false, framework: true, human: false },
                  { challenge: 'Fact-checking claims', handles: false, framework: true, human: false },
                  { challenge: 'Choosing the BEST idea from several', handles: false, framework: false, human: true },
                  { challenge: 'Deep original research', handles: false, framework: false, human: true },
                  { challenge: 'Matching your specific voice', handles: false, framework: false, human: true },
                  { challenge: 'Knowing when to break the formula', handles: false, framework: false, human: true },
                  { challenge: 'Cross-video strategic planning', handles: false, framework: false, human: true },
                  { challenge: 'Writing for unfamiliar topics', handles: false, framework: false, human: true },
                  { challenge: 'Calibrating controversy', handles: false, framework: false, human: true },
                ].map((row) => (
                  <tr key={row.challenge} className="border-b border-border/50 last:border-0">
                    <td className="px-5 py-3 text-[13px] text-text-primary">{row.challenge}</td>
                    <td className="px-3 py-3 text-center">{row.handles && <span className="text-green">&#10003;</span>}</td>
                    <td className="px-3 py-3 text-center">{row.framework && <span className="text-amber">&#10003;</span>}</td>
                    <td className="px-3 py-3 text-center">{row.human && <span className="text-text-dim">&#10003;</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-[13px] text-text-muted mt-4 text-center">
            This system will make you significantly better at scriptwriting. It will not replace the judgment that comes from writing hundreds of scripts.
          </p>
        </section>
      </div>
    </div>
  );
}
