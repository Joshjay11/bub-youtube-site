import Link from "next/link";
import MarketingLayout from "@/components/marketing/MarketingLayout";
import RevealOnScroll from "@/components/marketing/RevealOnScroll";

export default function HomePage() {
  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="min-h-screen flex items-center relative overflow-hidden">
        <div className="absolute -top-[200px] -right-[100px] w-[700px] h-[700px] rounded-full bg-[radial-gradient(circle,rgba(212,163,66,0.06),transparent_70%)] pointer-events-none" />
        <div className="max-w-[1120px] mx-auto px-8">
          <div className="pt-40 pb-24 max-w-[720px] relative z-[1]">
            <RevealOnScroll>
              <p className="font-sans font-semibold text-xs text-amber tracking-[0.18em] uppercase mb-7">
                Research-Driven YouTube Scripts
              </p>
            </RevealOnScroll>
            <RevealOnScroll delay={1}>
              <h1 className="font-serif font-normal text-text-bright leading-[1.08] tracking-[-0.02em]" style={{ fontSize: "clamp(42px, 5.5vw, 68px)" }}>
                Scripts that sound<br />
                like <em className="text-amber italic">you</em>. Backed by<br />
                <em className="text-amber italic">nine AI models</em> of research
              </h1>
            </RevealOnScroll>
            <RevealOnScroll delay={2}>
              <p className="font-sans text-lg text-text-dim max-w-[520px] mt-8 leading-[1.75]">
                Retention-engineered voiceover scripts with fact-check reports, strategic briefs, and broadcast-quality AI voiceovers. From research packs to full creative packages.
              </p>
            </RevealOnScroll>
            <RevealOnScroll delay={3}>
              <div className="flex gap-4 mt-11 flex-wrap">
                <Link
                  href="/start"
                  className="inline-flex items-center gap-2 bg-amber text-bg px-8 py-3.5 rounded-md font-bold text-[15px] no-underline transition-all hover:bg-amber-bright hover:text-bg hover:-translate-y-px"
                >
                  Start Your Project →
                </Link>
                <Link
                  href="/process"
                  className="inline-flex items-center gap-2 bg-transparent text-amber px-8 py-3.5 rounded-md font-semibold text-[15px] no-underline border border-[rgba(212,163,66,0.3)] transition-all hover:border-amber hover:bg-amber-glow"
                >
                  See the Process
                </Link>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* Problem / Solution */}
      <section className="max-w-[1120px] mx-auto px-8 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <RevealOnScroll>
            <div className="bg-bg-card rounded-xl p-10 border border-border relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red to-[#f87171] to-transparent" />
              <p className="font-sans font-semibold text-[13px] text-[#f87171] tracking-[0.12em] uppercase mb-5">The Problem</p>
              <p className="font-sans text-base text-text-primary leading-[1.7]">
                You spend 20+ hours per video on research. AI tools get you 80% of the way. But that last 20% is where videos succeed or fail. Generic scripts. Thin research. Voice mismatch. One wrong fact triggers Community Notes and kills your engagement by 46%.
              </p>
            </div>
          </RevealOnScroll>
          <RevealOnScroll delay={1}>
            <div className="bg-bg-card rounded-xl p-10 border border-[rgba(212,163,66,0.2)] relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber to-amber-bright to-transparent" />
              <p className="font-sans font-semibold text-[13px] text-amber tracking-[0.12em] uppercase mb-5">What We Do</p>
              <p className="font-sans text-base text-text-primary leading-[1.7]">
                Nine AI models research your topic from every angle. A human writes the script in your voice. You get a fact-check report, strategic brief, and a retention-engineered script. Add a broadcast-quality voiceover and your editor has everything they need.
              </p>
            </div>
          </RevealOnScroll>
        </div>

        <hr className="rule" />

        {/* Features */}
        <RevealOnScroll>
          <h2 className="font-serif text-text-bright leading-[1.15] mb-14" style={{ fontSize: "clamp(28px, 3.5vw, 40px)" }}>
            What makes this <em className="text-amber italic">different</em>
          </h2>
        </RevealOnScroll>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
          {[
            { num: "01", title: "9-Model Research", desc: "Claude, GPT, Gemini, Mistral, Qwen, Perplexity, Kimi, DeepSeek, and Grok. Every claim cross-referenced across nine models. No single-model bias. No hallucination loops." },
            { num: "02", title: "Fact-Check Report", desc: "Every claim inventoried, categorized as Consensus, Contested, or Opinion, and traced to primary sources. Your insurance against Community Notes." },
            { num: "03", title: "Retention Engineering", desc: "Hook formulas, pattern interrupts every 20-30 seconds, the 35% pivot, open loops, session hooks. Structurally engineered for the 2026 algorithm." },
            { num: "04", title: "Voice DNA Matching", desc: "We study your videos, capture your voice patterns, and build an anti-brand document before writing a word. The script sounds like you." },
            { num: "05", title: "Argument Analysis", desc: "Cross-disciplinary synthesis finds the original angle. Counter-arguments pre-addressed. Model consensus vs. disagreement mapped." },
            { num: "06", title: "Voiceover Engineering", desc: "Broadcast-quality AI voiceovers via ElevenLabs. Custom voice selection, natural pacing, emotional variation. Drop the audio into your editor and go." },
          ].map((f, i) => (
            <RevealOnScroll key={f.num} delay={(i % 3) as 0 | 1 | 2}>
              <div className="bg-bg-card p-9 relative min-h-[200px] transition-colors hover:bg-bg-card-hover cursor-default">
                <span className="font-serif font-extrabold text-[72px] leading-none text-amber opacity-[0.12] absolute -top-2 -left-1 select-none pointer-events-none">
                  {f.num}
                </span>
                <h4 className="font-sans font-bold text-base text-text-bright mb-3 relative">
                  {f.title}
                </h4>
                <p className="font-sans text-sm text-text-dim leading-relaxed relative">
                  {f.desc}
                </p>
              </div>
            </RevealOnScroll>
          ))}
        </div>

        <hr className="rule" />

        {/* Pricing Preview */}
        <RevealOnScroll>
          <div className="flex items-baseline justify-between flex-wrap gap-4 mb-12">
            <h2 className="font-serif text-text-bright leading-[1.15]" style={{ fontSize: "clamp(28px, 3.5vw, 40px)" }}>
              Choose your <em className="text-amber italic">depth</em>
            </h2>
            <p className="text-sm text-text-muted">From DIY tools to done-for-you scripts and voiceovers.</p>
          </div>
        </RevealOnScroll>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { price: "$19", sub: "/month", name: "BUB Writer", desc: "Full 6-stage workflow. AI scripting, research, retention tools, beat sheets, voiceover export.", href: "/pricing" },
            { price: "$225", sub: "per project", name: "Research Pack", desc: "9-model synthesis, fact-check report, argument analysis, angle recommendations.", href: "/pricing" },
            { price: "$500", sub: "per project", name: "The Script", desc: "Voice-matched, retention-engineered script + research + strategic brief. 2 revisions.", href: "/pricing", featured: true },
            { price: "$750", sub: "per project", name: "Script + Voice", desc: "Everything in The Script plus broadcast-quality ElevenLabs voiceover + music cues.", href: "/pricing" },
            { price: "$1,200", sub: "per project", name: "Creative Package", desc: "Script, voiceover, beat sheet, B-roll list, image prompts, thumbnail concepts.", href: "/pricing" },
            { price: "$1,800", sub: "per month", name: "Retainer", desc: "4 scripts + voiceovers/month. Channel strategy. Niche exclusivity. 47% savings.", href: "/pricing" },
          ].map((tier, i) => (
            <RevealOnScroll key={tier.name} delay={Math.min(i, 4) as 0 | 1 | 2 | 3 | 4}>
              <Link
                href={tier.href}
                className={`block rounded-[10px] p-6 h-full transition-all hover:-translate-y-0.5 no-underline ${
                  tier.featured
                    ? "bg-amber-glow-strong border border-[rgba(212,163,66,0.25)] hover:border-amber"
                    : "bg-bg-card border border-border hover:border-amber"
                } relative`}
              >
                {tier.featured && (
                  <span className="absolute -top-2.5 right-4 bg-amber text-bg font-bold text-[10px] px-3 py-1 rounded tracking-[0.08em] uppercase">
                    Popular
                  </span>
                )}
                <div className="font-serif font-bold text-[28px] text-text-bright">{tier.price}</div>
                <div className="text-[11px] text-text-muted mt-1">{tier.sub}</div>
                <div className="font-sans font-bold text-[15px] text-text-bright mt-4 mb-2">{tier.name}</div>
                <p className="font-sans text-[13px] text-text-dim leading-relaxed">{tier.desc}</p>
              </Link>
            </RevealOnScroll>
          ))}
        </div>

        <hr className="rule" />

        {/* Bottom CTA */}
        <RevealOnScroll>
          <div className="text-center pb-16">
            <h2 className="font-serif text-text-bright leading-[1.2] mb-4" style={{ fontSize: "clamp(28px, 3.5vw, 38px)" }}>
              Kurzgesagt-grade research rigor.<br />
              <em className="text-amber italic">Without the 6-person editorial team.</em>
            </h2>
            <p className="text-base text-text-dim mb-9">
              Your script comes with a fact-check report and argument analysis. Not just words.
            </p>
            <Link
              href="/start"
              className="inline-flex items-center gap-2 bg-amber text-bg px-10 py-4 rounded-md font-bold text-base no-underline transition-all hover:bg-amber-bright hover:text-bg hover:-translate-y-px"
            >
              Start Your Project →
            </Link>
          </div>
        </RevealOnScroll>
      </section>
    </MarketingLayout>
  );
}
