import Link from "next/link";
import MarketingLayout from "@/components/marketing/MarketingLayout";
import RevealOnScroll from "@/components/marketing/RevealOnScroll";
import CheckoutButton from "@/components/marketing/CheckoutButton";

const modules = [
  { num: "01", title: "Research & Pre-Production Module", desc: "Audience avatar quick-build, competitive video analysis framework, idea generation templates, title/thumbnail brainstorm matrix, and framing worksheet. Stop researching in circles." },
  { num: "02", title: "Script Structure Framework", desc: "Templates for tutorials, listicles, case studies, and story-driven videos. Pre-built frameworks (Setup-Tension-Payoff, AIDA, PAS). Hook formula bank with 15 fill-in-the-blank formulas." },
  { num: "03", title: "AI Prompt Templates", desc: "Brainstorming prompts, outline generators, hook variant prompts, and retention analysis prompts. Designed for Claude, GPT, and Gemini. AI-assisted, human-finished." },
  { num: "04", title: "Retention Optimization Checklist", desc: 'Self-audit for hooks, curiosity gaps, pattern interrupts, pacing, payoffs, and CTAs. The "Retention Heatmap" reveals exactly where your scripts lose viewers — and how to fix it.' },
  { num: "05", title: "Workflow Process Guide", desc: '"First script in under 2 hours" quick-start path plus a deep-dive optimization path for when you want to go further. Step-by-step, not theory.' },
];

export default function TemplatePage() {
  return (
    <MarketingLayout>
      <section className="max-w-[900px] mx-auto px-8 pt-40 pb-24">
        {/* Hero */}
        <RevealOnScroll>
          <div className="text-center mb-16">
            <p className="font-sans font-semibold text-xs text-amber tracking-[0.18em] uppercase mb-5">
              Script System
            </p>
            <h1 className="font-serif text-text-bright leading-[1.1] mb-5" style={{ fontSize: "clamp(34px, 4.5vw, 52px)" }}>
              The system behind our <em className="text-amber italic">$500 scripts</em> —<br />for $79
            </h1>
            <p className="text-[17px] text-text-dim max-w-[560px] mx-auto mb-9 leading-[1.75]">
              An interactive web app with research frameworks, hook formulas, AI-powered prompts, retention tools, a pacing calculator, and the script canvas we use on every client project.
            </p>
            <div className="flex gap-4 justify-center items-center flex-wrap">
              <CheckoutButton className="bg-amber text-bg px-9 py-4 rounded-md font-bold text-base border-none cursor-pointer transition-all hover:bg-amber-bright hover:text-bg hover:-translate-y-px disabled:opacity-60">
                Get the Script System — $79
              </CheckoutButton>
              <span className="text-[13px] text-text-muted">Instant access. Updates forever.</span>
            </div>
          </div>
        </RevealOnScroll>

        <hr className="rule" style={{ margin: "48px 0" }} />

        {/* Who it's for */}
        <RevealOnScroll>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-16">
            <div className="bg-bg-card border border-border rounded-xl p-8">
              <h3 className="font-sans font-semibold text-[13px] text-amber tracking-[0.1em] uppercase mb-5">This is for you if</h3>
              <ul className="list-none p-0">
                {[
                  "You write your own scripts but want a better system",
                  "You spend too long staring at a blank page",
                  "You use AI tools but the output feels generic",
                  "You want to understand retention engineering",
                  "Your budget is under $500 per video right now",
                ].map((item) => (
                  <li key={item} className="text-sm text-text-primary leading-[2.4] pl-5 relative">
                    <span className="absolute left-0 text-amber">✓</span>{item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-bg-card border border-border rounded-xl p-8">
              <h3 className="font-sans font-semibold text-[13px] text-[#f87171] tracking-[0.1em] uppercase mb-5">Skip this if</h3>
              <ul className="list-none p-0">
                {[
                  "You want someone to write the script for you",
                  "You need niche-specific research done",
                  "You want voice matching and personalized feedback",
                  "You need production-ready video assets",
                ].map((item) => (
                  <li key={item} className="text-sm text-text-dim leading-[2.4] pl-5 relative">
                    <span className="absolute left-0 text-[#f87171]">×</span>{item}
                  </li>
                ))}
                <li className="text-sm text-text-dim leading-[2.4] pl-5 relative">
                  <span className="absolute left-0 text-[#f87171]">×</span>
                  <Link href="/pricing" className="text-amber hover:text-amber-bright">→ Check our done-for-you tiers instead</Link>
                </li>
              </ul>
            </div>
          </div>
        </RevealOnScroll>

        {/* Modules */}
        <RevealOnScroll>
          <h2 className="font-serif text-[32px] text-text-bright leading-[1.15] mb-10">
            What&apos;s <em className="text-amber italic">inside</em>
          </h2>
        </RevealOnScroll>

        <RevealOnScroll>
          <div className="border-t border-border">
            {modules.map((mod) => (
              <div key={mod.num} className="flex gap-8 py-8 border-b border-border">
                <div className="shrink-0">
                  <span className="font-sans font-extrabold text-sm text-amber">{mod.num}</span>
                </div>
                <div>
                  <h4 className="font-sans font-bold text-[17px] text-text-bright mb-2 leading-tight">{mod.title}</h4>
                  <p className="text-sm text-text-dim leading-relaxed">{mod.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </RevealOnScroll>

        <hr className="rule" />

        {/* Upgrade path */}
        <RevealOnScroll>
          <div className="bg-amber-glow-strong border border-[rgba(212,163,66,0.2)] rounded-[14px] p-10 text-center">
            <h3 className="font-sans font-bold text-xl text-text-bright mb-3">Ready for the done-for-you version?</h3>
            <p className="text-[15px] text-text-primary max-w-[480px] mx-auto mb-6 leading-relaxed">
              Template buyers can apply their $79 toward their first Script project. The template shows you what great scripts require — we do the heavy lifting.
            </p>
            <Link
              href="/start"
              className="inline-flex items-center gap-2 bg-amber text-bg px-8 py-3.5 rounded-md font-bold text-[15px] no-underline transition-all hover:bg-amber-bright hover:text-bg hover:-translate-y-px"
            >
              Upgrade to Done-For-You →
            </Link>
          </div>
        </RevealOnScroll>

        <div className="text-center mt-12">
          <RevealOnScroll>
            <button className="bg-amber text-bg px-9 py-4 rounded-md font-bold text-base border-none cursor-pointer transition-all hover:bg-amber-bright hover:text-bg hover:-translate-y-px">
              Get the Script System — $79
            </button>
            <p className="text-[13px] text-text-muted mt-3">Instant access. No subscription. Updates included forever.</p>
          </RevealOnScroll>
        </div>
      </section>
    </MarketingLayout>
  );
}
