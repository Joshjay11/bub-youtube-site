import Link from "next/link";
import MarketingLayout from "@/components/marketing/MarketingLayout";
import RevealOnScroll from "@/components/marketing/RevealOnScroll";

const processItems = [
  { label: "Multi-Model Research", desc: "7 AI models queried with tailored prompts. Each surfaces different angles and connections. Synthesized into consensus claims, contested claims, and original angles no single source would find." },
  { label: "Retention-Engineered Structure", desc: "Scripts built on a beat map — hooks, micro-acts, pattern interrupts, the 35% pivot, session hooks. Not generic structure. Engineered for the 2026 satisfaction algorithm." },
  { label: "Fact-Check Report", desc: "Every claim categorized as Consensus, Contested, or Opinion. Sources verified against primary research. High-risk claims flagged. Your insurance against Community Notes." },
  { label: "Voice Consistency", desc: "A canon document ensures every script matches your identity. The anti-brand defines what you never say. A dedicated voice pass catches generic language before delivery." },
  { label: "Three-Pass Editorial", desc: "Hemingway editing strips adverbs. Asimov pass clarifies logic. Bukowski pass kills anything that doesn't sound human. More quality gates than most published books." },
];

export default function WorkPage() {
  return (
    <MarketingLayout>
      <section className="max-w-[800px] mx-auto px-8 pt-40 pb-24">
        <RevealOnScroll>
          <p className="font-sans font-semibold text-xs text-amber tracking-[0.18em] uppercase mb-5">
            Our Work
          </p>
          <h1 className="font-serif text-text-bright leading-[1.1] mb-5" style={{ fontSize: "clamp(34px, 4.5vw, 48px)" }}>
            The <em className="text-amber italic">BUB Show</em> is our<br />living portfolio
          </h1>
          <p className="text-[17px] text-text-dim max-w-[560px] mb-12 leading-[1.75]">
            Every video on the BUB channel is produced using the same pipeline we use for client work. The research methodology, retention engineering, fact-checking, and voice consistency — it&apos;s all the same process.
          </p>
        </RevealOnScroll>

        <RevealOnScroll delay={1}>
          <div className="bg-amber-glow-strong border border-[rgba(212,163,66,0.2)] rounded-[14px] p-12 text-center">
            <h3 className="font-sans font-bold text-[22px] text-text-bright mb-3">The BUB Show</h3>
            <p className="font-sans text-[15px] text-text-primary max-w-[480px] mx-auto mb-7 leading-relaxed">
              Consciousness, AI, esoteric research — all produced with multi-model synthesis and retention-engineered scripting. What you&apos;d get as a client, demonstrated on our own channel.
            </p>
            <a
              href="https://www.youtube.com/@bubai4reallife"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-amber text-bg px-8 py-3.5 rounded-md font-bold text-[15px] no-underline transition-all hover:bg-amber-bright hover:-translate-y-px"
            >
              Watch on YouTube →
            </a>
          </div>
        </RevealOnScroll>

        <hr className="rule" />

        <RevealOnScroll>
          <h2 className="font-serif text-[32px] text-text-bright leading-[1.15] mb-10">
            What the process <em className="text-amber italic">produces</em>
          </h2>
        </RevealOnScroll>

        {processItems.map((item) => (
          <RevealOnScroll key={item.label}>
            <div className="border-b border-border py-6">
              <h4 className="font-sans font-semibold text-sm text-amber tracking-[0.04em] mb-2.5">
                {item.label}
              </h4>
              <p className="font-sans text-[15px] text-text-primary leading-relaxed">
                {item.desc}
              </p>
            </div>
          </RevealOnScroll>
        ))}

        <hr className="rule" />

        <RevealOnScroll>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { num: "7", label: "AI Models" },
              { num: "5", label: "Quality Gates" },
              { num: "3", label: "Editorial Passes" },
              { num: "11", label: "Production Stages" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-bg-card border border-border rounded-[10px] p-7 text-center"
              >
                <div className="font-serif font-bold text-4xl text-amber">{stat.num}</div>
                <div className="font-sans font-medium text-xs text-text-dim mt-2">{stat.label}</div>
              </div>
            ))}
          </div>
        </RevealOnScroll>

        <div className="text-center mt-16">
          <RevealOnScroll>
            <Link
              href="/start"
              className="inline-flex items-center gap-2 bg-amber text-bg px-10 py-4 rounded-md font-bold text-base no-underline transition-all hover:bg-amber-bright hover:-translate-y-px"
            >
              Start Your Project →
            </Link>
          </RevealOnScroll>
        </div>
      </section>
    </MarketingLayout>
  );
}
