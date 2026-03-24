export default function PivotGuidePage() {
  return (
    <div className="max-w-3xl">
      <h1 className="font-serif text-[32px] text-text-bright mb-2">The 35% Pivot — Explained</h1>
      <p className="text-text-dim text-[15px] mb-8">
        The most important structural beat in any YouTube video. If your retention dips in the middle, this is almost always what&apos;s missing.
      </p>

      <div className="space-y-8">
        {/* What it is */}
        <section className="bg-bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-serif text-[20px] text-text-bright">What it is</h2>
          <p className="text-[14px] text-text-primary leading-relaxed">
            The moment the video shifts from setup to reframe. The viewer thought the video was about X. At the 35% mark, it becomes about X through the lens of Y. This resets the retention clock because the viewer&apos;s curiosity is refreshed with a new question they didn&apos;t know they had.
          </p>
        </section>

        {/* Why 35% */}
        <section className="bg-bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-serif text-[20px] text-text-bright">Why 35%</h2>
          <p className="text-[14px] text-text-primary leading-relaxed">
            Attention naturally dips at the one-third mark. If a viewer has been following one thread for 3–4 minutes, they start feeling like they &ldquo;get it.&rdquo; The pivot says &ldquo;you don&apos;t get it yet&rdquo; without being condescending. It creates a second wave of curiosity inside a video they were about to passively watch.
          </p>
        </section>

        {/* How to find it */}
        <section className="bg-bg-card border border-amber/20 rounded-xl p-6 space-y-4">
          <h2 className="font-serif text-[20px] text-amber">How to find YOUR pivot</h2>
          <p className="text-[14px] text-text-primary leading-relaxed">
            Take your topic. Ask: what&apos;s the adjacent field that explains WHY this topic works the way it does? The pivot is almost always &ldquo;the mechanism behind the surface.&rdquo;
          </p>
        </section>

        {/* 8 Examples */}
        <h2 className="font-serif text-[24px] text-text-bright pt-4">8 Examples</h2>

        {[
          {
            genre: 'Finance',
            setup: 'The video was about compound interest.',
            pivot: "At 35%, it became about compound interest through the lens of behavioral psychology — why KNOWING about compound interest doesn't change anyone's behavior.",
            line: "The math isn't the problem. Your brain is.",
          },
          {
            genre: 'Fitness',
            setup: 'The video was about protein intake.',
            pivot: "At 35%, it became about who funds the studies that set the protein recommendations — and why the supplement industry has a $50B reason to keep the numbers high.",
            line: "The science is real. The dosage isn't.",
          },
          {
            genre: 'Tech',
            setup: 'The video was about iPhone vs Android.',
            pivot: "At 35%, it became about how your phone choice reveals your relationship with control and privacy — and what that says about how tech companies see you.",
            line: "This isn't about specs. It's about what you're willing to give up.",
          },
          {
            genre: 'History',
            setup: 'The video was about the fall of Rome.',
            pivot: "At 35%, it became about the specific economic pattern that Rome, the British Empire, and one modern superpower all share — and whether the pattern is breakable.",
            line: "This isn't ancient history. It's a forecast.",
          },
          {
            genre: 'Cooking',
            setup: 'The video was about making perfect pasta.',
            pivot: "At 35%, it became about the single chemistry principle that explains why restaurant pasta tastes different from yours — and why the internet gets it wrong.",
            line: "It's not the recipe. It's the water.",
          },
          {
            genre: 'Commentary',
            setup: 'The video was about why movies are getting worse.',
            pivot: "At 35%, it became about the financial structure that makes studios optimize for opening weekend, not quality — and why streaming made it worse, not better.",
            line: "The movies aren't the product. The opening weekend number is.",
          },
          {
            genre: 'Tutorial',
            setup: 'The video was about Excel formulas.',
            pivot: "At 35%, it became about the 3 formulas that replace 90% of what people use VLOOKUP for — and why every Excel tutorial teaches the slow way first.",
            line: "Forget everything you just learned. Here's how people who use Excel 8 hours a day actually do it.",
          },
          {
            genre: 'Documentary',
            setup: 'The video was about a missing persons case.',
            pivot: "At 35%, it became about the specific police policy that guarantees cases like this go cold — and the 4 other cases where the same policy produced the same result.",
            line: "The detectives didn't fail. The system did.",
          },
        ].map((example) => (
          <div key={example.genre} className="bg-bg-card border border-border rounded-xl p-5 space-y-3">
            <div className="text-[13px] text-amber font-medium uppercase tracking-wider">{example.genre}</div>
            <p className="text-[14px] text-text-dim">{example.setup}</p>
            <p className="text-[14px] text-text-primary leading-relaxed">{example.pivot}</p>
            <div className="bg-bg-elevated border border-border rounded-lg px-4 py-3">
              <span className="text-[12px] text-text-muted">The pivot line: </span>
              <span className="text-[15px] text-text-bright font-medium italic">&ldquo;{example.line}&rdquo;</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
