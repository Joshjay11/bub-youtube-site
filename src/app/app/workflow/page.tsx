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
            For when you need a script done, not perfected. Follow these steps in order.
          </p>

          <div className="space-y-3">
            {[
              { step: 1, title: 'Idea Scorecard', desc: "Score your idea with AI. If it's below 30, pivot before you invest time.", link: '/app/idea-validator' },
              { step: 2, title: 'Viewer Belief Map', desc: "Map the viewer's belief shift. AI helps you frame the transformation.", link: '/app/idea-validator' },
              { step: 3, title: 'Research Sprint', desc: 'Run AI-powered topic research across 5 angles. The system does the heavy lifting — you curate the best findings.', link: '/app/research' },
              { step: 4, title: 'Pick Structure + Set Pacing', desc: 'Choose your video style and set your pacing. The system calculates word count targets automatically.', link: '/app/write' },
              { step: 5, title: 'Write the Hook', desc: 'Generate hooks with AI, score them automatically. Pick the highest scorer.', link: '/app/structure' },
              { step: 6, title: 'Generate Script', desc: "Generate your full script with dual AI writers. Pick the draft that sounds most like you.", link: '/app/write' },
              { step: 7, title: 'Refine + Audit', desc: "Run the Editor's Table and Quality Score. Then run the automated retention audit. Fix any failures.", link: '/app/optimize' },
              { step: 8, title: 'Post-Production', desc: 'Export your script for ElevenLabs voiceover and generate your video beat sheet with image prompts.', link: '/app/post-production' },
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
                  <span className="text-[15px] font-medium text-text-bright group-hover:text-amber transition-colors">{item.title}</span>
                  <p className="text-[13px] text-text-dim mt-1">{item.desc}</p>
                </div>
              </a>
            ))}
          </div>

          <div className="mt-3 bg-bg-card border border-amber/20 rounded-xl p-4">
            <p className="text-[13px] text-text-dim">
              <span className="text-amber font-medium">Decision gate after Step 3:</span> If you don&apos;t have a clear angle, either the topic needs more exploration or it&apos;s not strong enough. Check your Idea Scorecard again.
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
                day: 'Part 1', title: 'Research + Concept',
                items: [
                  'Full Idea Scorecard + Viewer Belief Map',
                  'Full Competitive Video Analysis (all 3 videos)',
                  'Title/Thumbnail Matrix + Alignment Planner',
                  'Extended research using AI prompts (3A through 3E)',
                  'Framing Worksheet',
                ],
              },
              {
                day: 'Part 2', title: 'Structure + Draft',
                items: [
                  'Video type selection + pacing calculator',
                  'Hook generation + scoring',
                  'AI Outline Audit (3F)',
                  'Dual-model script generation',
                  'Let it sit overnight if possible',
                ],
              },
              {
                day: 'Part 3', title: 'Refine + Polish + Post-Production',
                items: [
                  "Editor's Table (three-editor analysis)",
                  'Quality Score + fix application',
                  'Retention Audit — fix all failures',
                  'Read-aloud pass — the one step AI can\'t do for you',
                  'ElevenLabs export + beat sheet generation',
                ],
              },
            ].map((day) => (
              <div key={day.day} className="bg-bg-card border border-border rounded-xl p-5">
                <div className="mb-3">
                  <h3 className="text-[16px] font-medium text-text-bright">{day.day}: {day.title}</h3>
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
