import Link from "next/link";
import MarketingLayout from "@/components/marketing/MarketingLayout";
import RevealOnScroll from "@/components/marketing/RevealOnScroll";
import CheckoutButton from "@/components/marketing/CheckoutButton";

function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="text-sm text-text-primary leading-[2.2] pl-5 relative">
      <span className="absolute left-0 text-amber">✓</span>
      {children}
    </li>
  );
}

function ExcludeItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="text-sm text-text-muted leading-[2.2] pl-5 relative">
      <span className="absolute left-0">-</span>
      {children}
    </li>
  );
}

export default function PricingPage() {
  return (
    <MarketingLayout>
      <section className="max-w-[1120px] mx-auto px-8 pt-40 pb-24">
        <RevealOnScroll>
          <div className="max-w-[720px]">
            <p className="font-sans font-semibold text-xs text-amber tracking-[0.18em] uppercase mb-5">
              Pricing
            </p>
            <h1 className="font-serif text-text-bright leading-[1.1] mb-5" style={{ fontSize: "clamp(34px, 4.5vw, 52px)" }}>
              Transparent pricing.<br /><em className="text-amber italic">No surprises.</em>
            </h1>
            <p className="text-[17px] text-text-dim max-w-[560px] mb-16 leading-[1.75]">
              Everything before you hit &quot;record&quot; is ours. Scripts, research, voiceovers, creative assets. You choose how deep.
            </p>
          </div>
        </RevealOnScroll>

        {/* Script System — DIY */}
        <RevealOnScroll>
          <div className="bg-bg-card border border-amber/20 rounded-[14px] p-8 md:p-10 mb-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <p className="font-sans font-semibold text-xs text-amber tracking-[0.14em] uppercase mb-2">Do it yourself</p>
                <h3 className="font-sans font-bold text-[22px] text-text-bright mb-1">BUB Script System</h3>
                <p className="text-sm text-text-dim max-w-[480px] leading-relaxed mb-5">
                  Start with the system behind our $500 scripts. Interactive scorecards, pacing calculators, AI prompts, and the full retention framework — in a web app you keep forever.
                </p>
                <CheckoutButton className="inline-flex items-center gap-2 bg-amber text-bg px-8 py-3.5 rounded-md font-bold text-[15px] border-none cursor-pointer transition-all hover:bg-amber-bright hover:text-bg hover:-translate-y-px disabled:opacity-60">
                  Get the Script System — $79
                </CheckoutButton>
              </div>
              <div className="shrink-0 text-left md:text-right">
                <div className="font-serif font-bold text-4xl text-amber">$79</div>
                <div className="text-xs text-text-muted mt-1">one-time</div>
              </div>
            </div>
          </div>
        </RevealOnScroll>

        {/* Research Pack */}
        <RevealOnScroll>
          <div className="bg-bg-card border border-border rounded-[14px] p-10 mb-5">
            <div className="flex justify-between items-baseline flex-wrap gap-4 mb-6">
              <div>
                <h3 className="font-sans font-bold text-[22px] text-text-bright mb-1">Research Pack</h3>
                <p className="text-sm text-text-dim">Strategic intelligence, not raw AI output.</p>
              </div>
              <div className="text-right">
                <div className="font-serif font-bold text-4xl text-amber">$149</div>
                <div className="text-xs text-text-muted mt-1">per project</div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-sans font-semibold text-[13px] text-amber tracking-[0.1em] uppercase mb-4">Included</h4>
                <ul className="list-none p-0">
                  <CheckItem>7-model research sweep</CheckItem>
                  <CheckItem>NotebookLM synthesis</CheckItem>
                  <CheckItem>Fact-check report (Consensus / Contested / Opinion)</CheckItem>
                  <CheckItem>Argument analysis + counter-arguments</CheckItem>
                  <CheckItem>3-5 angle recommendations (ranked)</CheckItem>
                  <CheckItem>5-minute Loom walkthrough</CheckItem>
                </ul>
              </div>
              <div>
                <h4 className="font-sans font-semibold text-[13px] text-text-muted tracking-[0.1em] uppercase mb-4">Not included</h4>
                <ul className="list-none p-0">
                  <ExcludeItem>Script writing</ExcludeItem>
                  <ExcludeItem>Voice matching</ExcludeItem>
                  <ExcludeItem>Voiceover production</ExcludeItem>
                </ul>
                <p className="text-[13px] text-text-muted mt-4 leading-relaxed">2-3 business day turnaround</p>
              </div>
            </div>
            <div className="mt-7 pt-6 border-t border-border">
              <Link href="/start" className="inline-flex items-center gap-2 bg-transparent text-amber px-8 py-3.5 rounded-md font-semibold text-[15px] no-underline border border-[rgba(212,163,66,0.3)] transition-all hover:border-amber hover:bg-amber-glow">
                Start with Research →
              </Link>
            </div>
          </div>
        </RevealOnScroll>

        {/* The Script (Featured) */}
        <RevealOnScroll delay={1}>
          <div className="bg-amber-glow-strong border border-[rgba(212,163,66,0.3)] rounded-[14px] p-10 mb-5 relative">
            <span className="absolute -top-3 left-9 bg-amber text-bg font-bold text-[11px] px-4 py-1.5 rounded tracking-[0.08em] uppercase">
              Most Popular
            </span>
            <div className="flex justify-between items-baseline flex-wrap gap-4 mb-6">
              <div>
                <h3 className="font-sans font-bold text-[22px] text-text-bright mb-1">The Script</h3>
                <p className="text-sm text-text-dim">Research, writing, voice matching, and strategic brief.</p>
              </div>
              <div className="text-right">
                <div className="font-serif font-bold text-4xl text-amber">$500</div>
                <div className="text-xs text-text-muted mt-1">per project</div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-sans font-semibold text-[13px] text-amber tracking-[0.1em] uppercase mb-4">Included</h4>
                <ul className="list-none p-0">
                  <CheckItem>Everything in Research Pack</CheckItem>
                  <CheckItem>Voice DNA onboarding + 90-second approval</CheckItem>
                  <CheckItem>Full two-column voiceover script</CheckItem>
                  <CheckItem>Retention engineering (hooks, pivots, loops)</CheckItem>
                  <CheckItem>Strategic brief (angles, titles, thumbnails, risk notes)</CheckItem>
                  <CheckItem>Three-pass editorial + Loom walkthrough</CheckItem>
                  <CheckItem>2 revision rounds + 3-week follow-up</CheckItem>
                </ul>
              </div>
              <div>
                <h4 className="font-sans font-semibold text-[13px] text-text-muted tracking-[0.1em] uppercase mb-4">Not included</h4>
                <ul className="list-none p-0">
                  <ExcludeItem>Voiceover production</ExcludeItem>
                  <ExcludeItem>Production assets</ExcludeItem>
                </ul>
                <p className="text-[13px] text-text-muted mt-4 leading-relaxed">5 business days. Rush at $650 (3 days).</p>
              </div>
            </div>
            <div className="mt-7 pt-6 border-t border-[rgba(212,163,66,0.2)]">
              <Link href="/start" className="inline-flex items-center gap-2 bg-amber text-bg px-8 py-3.5 rounded-md font-bold text-[15px] no-underline transition-all hover:bg-amber-bright hover:text-bg hover:-translate-y-px">
                Start Your Script →
              </Link>
            </div>
          </div>
        </RevealOnScroll>

        {/* Script + Voiceover */}
        <RevealOnScroll delay={2}>
          <div className="bg-bg-card border border-border rounded-[14px] p-10 mb-5">
            <div className="flex justify-between items-baseline flex-wrap gap-4 mb-6">
              <div>
                <h3 className="font-sans font-bold text-[22px] text-text-bright mb-1">Script + Voiceover</h3>
                <p className="text-sm text-text-dim">Drop the audio straight into your editor. Ready to cut.</p>
              </div>
              <div className="text-right">
                <div className="font-serif font-bold text-4xl text-amber">$750</div>
                <div className="text-xs text-text-muted mt-1">per project</div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-sans font-semibold text-[13px] text-amber tracking-[0.1em] uppercase mb-4">Included</h4>
                <ul className="list-none p-0">
                  <CheckItem>Everything in The Script</CheckItem>
                  <CheckItem>Broadcast-quality AI voiceover (ElevenLabs)</CheckItem>
                  <CheckItem>Custom voice selection or cloning consult</CheckItem>
                  <CheckItem>WAV + MP3 delivery</CheckItem>
                  <CheckItem>Music and SFX cue sheet with specific tracks</CheckItem>
                  <CheckItem>2 voiceover revision renders</CheckItem>
                </ul>
              </div>
              <div>
                <h4 className="font-sans font-semibold text-[13px] text-text-muted tracking-[0.1em] uppercase mb-4">Not included</h4>
                <ul className="list-none p-0">
                  <ExcludeItem>Beat sheet / visual timing</ExcludeItem>
                  <ExcludeItem>B-roll / image assets</ExcludeItem>
                  <ExcludeItem>Thumbnail concepts</ExcludeItem>
                </ul>
                <p className="text-[13px] text-text-muted mt-4 leading-relaxed">6 business days. Rush at $950 (4 days).</p>
              </div>
            </div>
            <div className="mt-7 pt-6 border-t border-border">
              <Link href="/start" className="inline-flex items-center gap-2 bg-transparent text-amber px-8 py-3.5 rounded-md font-semibold text-[15px] no-underline border border-[rgba(212,163,66,0.3)] transition-all hover:border-amber hover:bg-amber-glow">
                Start with Voiceover →
              </Link>
            </div>
          </div>
        </RevealOnScroll>

        {/* Full Creative Package */}
        <RevealOnScroll delay={3}>
          <div className="bg-bg-card border border-border rounded-[14px] p-10 mb-5">
            <div className="flex justify-between items-baseline flex-wrap gap-4 mb-6">
              <div>
                <h3 className="font-sans font-bold text-[22px] text-text-bright mb-1">Full Creative Package</h3>
                <p className="text-sm text-text-dim">Everything your editor needs. Zero creative guesswork.</p>
              </div>
              <div className="text-right">
                <div className="font-serif font-bold text-4xl text-amber">$1,200</div>
                <div className="text-xs text-text-muted mt-1">per project</div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-sans font-semibold text-[13px] text-amber tracking-[0.1em] uppercase mb-4">Included</h4>
                <ul className="list-none p-0">
                  <CheckItem>Everything in Script + Voiceover</CheckItem>
                  <CheckItem>Beat sheet (visual timing synced to voiceover)</CheckItem>
                  <CheckItem>B-roll shopping list with links and licensing</CheckItem>
                  <CheckItem>AI image prompts (Leonardo AI, tested and refined)</CheckItem>
                  <CheckItem>3 thumbnail concepts with visual briefs</CheckItem>
                  <CheckItem>Short-form extraction notes (3 clips for Shorts/Reels)</CheckItem>
                </ul>
              </div>
              <div>
                <h4 className="font-sans font-semibold text-[13px] text-text-muted tracking-[0.1em] uppercase mb-4">What you handle</h4>
                <ul className="list-none p-0">
                  <li className="text-sm text-text-muted leading-[2.2] pl-5 relative">
                    <span className="absolute left-0">→</span>Video editing and assembly
                  </li>
                  <li className="text-sm text-text-muted leading-[2.2] pl-5 relative">
                    <span className="absolute left-0">→</span>Final thumbnail design
                  </li>
                  <li className="text-sm text-text-muted leading-[2.2] pl-5 relative">
                    <span className="absolute left-0">→</span>Upload and publishing
                  </li>
                </ul>
                <p className="text-[13px] text-text-muted mt-4 leading-relaxed">7 business days. Rush at $1,500 (5 days).</p>
              </div>
            </div>
            <div className="mt-7 pt-6 border-t border-border">
              <Link href="/start" className="inline-flex items-center gap-2 bg-transparent text-amber px-8 py-3.5 rounded-md font-semibold text-[15px] no-underline border border-[rgba(212,163,66,0.3)] transition-all hover:border-amber hover:bg-amber-glow">
                Start the Full Package →
              </Link>
            </div>
          </div>
        </RevealOnScroll>

        {/* Retainer */}
        <RevealOnScroll delay={4}>
          <div className="bg-bg-card border border-border rounded-[14px] p-10 mb-5">
            <div className="flex justify-between items-baseline flex-wrap gap-4 mb-6">
              <div>
                <h3 className="font-sans font-bold text-[22px] text-text-bright mb-1">Monthly Retainer</h3>
                <p className="text-sm text-text-dim">4 scripts + voiceovers per month. Your channel on autopilot.</p>
              </div>
              <div className="text-right">
                <div className="font-serif font-bold text-4xl text-amber">$1,600</div>
                <div className="text-xs text-text-muted mt-1">per month</div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-sans font-semibold text-[13px] text-amber tracking-[0.1em] uppercase mb-4">Included</h4>
                <ul className="list-none p-0">
                  <CheckItem>4x Script + Voiceover packages (47% savings)</CheckItem>
                  <CheckItem>Priority 3-day turnaround (no rush fee)</CheckItem>
                  <CheckItem>Channel memory + mythology log</CheckItem>
                  <CheckItem>Monthly content roadmap</CheckItem>
                  <CheckItem>Performance debrief after each upload</CheckItem>
                  <CheckItem>Quarterly channel roadmap (next 12 videos)</CheckItem>
                  <CheckItem>1 emergency script slot/month (48hr)</CheckItem>
                  <CheckItem>Niche exclusivity</CheckItem>
                </ul>
              </div>
              <div>
                <h4 className="font-sans font-semibold text-[13px] text-text-muted tracking-[0.1em] uppercase mb-4">Why retainer</h4>
                <p className="text-sm text-text-dim leading-relaxed">
                  Scripts get better every month because we track your channel, your audience, and your voice evolution. By month 3, we know your voice better than you do. Switching means starting over.
                </p>
              </div>
            </div>
            <div className="mt-7 pt-6 border-t border-border">
              <Link href="/start" className="inline-flex items-center gap-2 bg-transparent text-amber px-8 py-3.5 rounded-md font-semibold text-[15px] no-underline border border-[rgba(212,163,66,0.3)] transition-all hover:border-amber hover:bg-amber-glow">
                Start a Retainer →
              </Link>
            </div>
          </div>
        </RevealOnScroll>

        <hr className="rule" />

        {/* Add-ons */}
        <RevealOnScroll>
          <h2 className="font-serif text-[32px] text-text-bright leading-[1.15] mb-9">
            A la carte <em className="text-amber italic">add-ons</em>
          </h2>
        </RevealOnScroll>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { title: "Rush Delivery", price: "25-30% premium", desc: "Shave 2 days off any tier. Script rush: $650. Voiceover rush: $950. Full package rush: $1,500." },
            { title: "Standalone Voiceover", price: "$150", desc: "Bring your own script. Get the ElevenLabs voice treatment. Custom voice, natural pacing, emotional variation. WAV + MP3." },
            { title: "Image Generation Pack", price: "$150", desc: "10-15 Leonardo AI images, tested and refined. Delivered as files, not just prompts. Styled to your channel." },
            { title: "Additional Revisions", price: "$100/round", desc: "Beyond the 2 included rounds. Additional voiceover renders at $50 each for different pacing or tone." },
            { title: "Beat Sheet Only", price: "$200", desc: "Visual timing document synced to your voiceover. For creators who have the script and voice but need the production blueprint." },
            { title: "Title + Thumbnail Strategy", price: "$100", desc: "5 title options, 3 thumbnail concepts, alignment analysis. Standalone packaging strategy without a full script." },
          ].map((addon, i) => (
            <RevealOnScroll key={addon.title} delay={(i % 3) as 0 | 1 | 2}>
              <div className="bg-bg-card border border-border rounded-[10px] p-7">
                <h4 className="font-sans font-bold text-sm text-amber mb-3">{addon.title}</h4>
                <div className="font-serif font-bold text-xl text-text-bright mb-2">{addon.price}</div>
                <p className="text-sm text-text-dim leading-relaxed">{addon.desc}</p>
              </div>
            </RevealOnScroll>
          ))}
        </div>

        <hr className="rule" />

        {/* Included with every project */}
        <RevealOnScroll>
          <h2 className="font-serif text-[32px] text-text-bright leading-[1.15] mb-9">
            Included with <em className="text-amber italic">every</em> project
          </h2>
        </RevealOnScroll>

        <RevealOnScroll>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              "7-model research methodology",
              "Fact-check report with source log",
              "Loom walkthrough of key decisions",
              "Branded delivery folder",
              "24-hour response time",
              "Post-delivery follow-up sequence",
            ].map((item) => (
              <div key={item} className="bg-bg-card border border-border rounded-lg px-5 py-5">
                <span className="text-amber mr-2">✓</span>
                <span className="font-sans font-medium text-sm text-text-primary">{item}</span>
              </div>
            ))}
          </div>
        </RevealOnScroll>

        <div className="text-center mt-16">
          <RevealOnScroll>
            <p className="text-base text-text-dim mb-6">Not sure which tier? Tell us what you need and we&apos;ll recommend the right one.</p>
            <Link
              href="/start"
              className="inline-flex items-center gap-2 bg-amber text-bg px-10 py-4 rounded-md font-bold text-base no-underline transition-all hover:bg-amber-bright hover:text-bg hover:-translate-y-px"
            >
              Start a Conversation →
            </Link>
          </RevealOnScroll>
        </div>
      </section>
    </MarketingLayout>
  );
}
