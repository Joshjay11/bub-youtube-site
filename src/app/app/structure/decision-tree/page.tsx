export default function DecisionTreePage() {
  return (
    <div className="max-w-3xl">
      <h1 className="font-serif text-[32px] text-text-bright mb-2">Video Type Decision Tree</h1>
      <p className="text-text-dim text-[15px] mb-8">
        Before picking a structure template, answer these three questions to find your video type.
      </p>

      <div className="space-y-8">
        {/* Question 1 */}
        <div className="bg-bg-card border border-border rounded-xl p-6">
          <h2 className="font-serif text-[20px] text-text-bright mb-4">1. What&apos;s the viewer&apos;s intent?</h2>
          <div className="space-y-2">
            {[
              { intent: 'They want to learn HOW to do something', type: 'Tutorial' },
              { intent: 'They want to understand WHY something works', type: 'Explainer' },
              { intent: 'They want to experience a narrative', type: 'Story / Documentary' },
              { intent: 'They want to hear a perspective', type: 'Commentary' },
              { intent: 'They want to browse options', type: 'Listicle' },
            ].map((item) => (
              <div key={item.type} className="flex items-center gap-3 px-4 py-3 rounded-lg bg-bg-elevated">
                <svg className="w-4 h-4 text-amber shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-[14px] text-text-primary flex-1">{item.intent}</span>
                <span className="text-[13px] text-amber font-medium">{item.type}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Question 2 */}
        <div className="bg-bg-card border border-border rounded-xl p-6">
          <h2 className="font-serif text-[20px] text-text-bright mb-4">2. What&apos;s your channel goal for this video?</h2>
          <div className="space-y-2">
            {[
              { goal: 'Discovery (reach new viewers)', types: 'Tutorial or Listicle', reason: 'highest search volume' },
              { goal: 'Authority (establish expertise)', types: 'Explainer or Commentary', reason: '' },
              { goal: 'Engagement (deepen relationship)', types: 'Story or Commentary', reason: '' },
              { goal: 'Conversion (viewer to subscriber)', types: 'Explainer or Story', reason: '' },
            ].map((item) => (
              <div key={item.goal} className="flex items-center gap-3 px-4 py-3 rounded-lg bg-bg-elevated">
                <svg className="w-4 h-4 text-amber shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-[14px] text-text-primary flex-1">{item.goal}</span>
                <span className="text-[13px] text-amber font-medium">{item.types}</span>
                {item.reason && <span className="text-[12px] text-text-muted">({item.reason})</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Question 3 */}
        <div className="bg-bg-card border border-border rounded-xl p-6">
          <h2 className="font-serif text-[20px] text-text-bright mb-4">3. Is there a narrative event?</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-bg-elevated">
              <div className="w-6 h-6 rounded-full bg-green/10 text-green text-[13px] font-bold flex items-center justify-center shrink-0 mt-0.5">Y</div>
              <div>
                <div className="text-[14px] text-text-bright font-medium">Yes — something happened, there&apos;s a timeline</div>
                <div className="text-[13px] text-text-dim mt-1">Use <span className="text-amber">Story / Documentary</span></div>
              </div>
            </div>
            <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-bg-elevated">
              <div className="w-6 h-6 rounded-full bg-amber/10 text-amber text-[13px] font-bold flex items-center justify-center shrink-0 mt-0.5">N</div>
              <div>
                <div className="text-[14px] text-text-bright font-medium">No — it&apos;s ideas, principles, or options</div>
                <div className="text-[13px] text-text-dim mt-1">Use <span className="text-amber">Explainer, Tutorial, Commentary, or Listicle</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-bg-elevated border border-amber/20 rounded-xl p-5 text-center">
          <p className="text-[14px] text-text-dim">
            Once you&apos;ve identified your video type, go to the{' '}
            <a href="/app/structure/templates" className="text-amber hover:text-amber-bright transition-colors">Structure Templates</a>
            {' '}page to get the full beat map for that type.
          </p>
        </div>
      </div>
    </div>
  );
}
