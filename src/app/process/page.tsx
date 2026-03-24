import Link from "next/link";
import MarketingLayout from "@/components/marketing/MarketingLayout";
import RevealOnScroll from "@/components/marketing/RevealOnScroll";

const steps = [
  { num: "01", title: "Multi-Model Research", time: "Day 1–2", desc: "Your topic runs through 7 AI models — Claude, GPT, Gemini, Mistral, Qwen, Perplexity, and Kimi. Each surfaces different angles, data, and cross-disciplinary connections. Everything synthesized into a single research document with consensus claims, contested claims, and original angles." },
  { num: "02", title: "Fact-Check & Logic Audit", time: "Day 2–3", desc: "Every claim gets inventoried and categorized: Consensus, Contested, or Opinion. Sources verified against primary research journals, official documents, original data. Arguments checked for logical fallacies. High-risk claims in health, finance, or legal get extra scrutiny." },
  { num: "03", title: "Script Draft", time: "Day 3–4", desc: "A voiceover script written in your voice — matched to your channel's tone, humor, pacing, and audience relationship. Two-column format with visual cues alongside dialogue. Retention annotations at 25%, 50%, and 75% marks. Hooks, pattern interrupts, the 35% pivot — all baked in." },
  { num: "04", title: "Canon & Voice Pass", time: "Day 4", desc: "The script runs through a voice guardian that protects your brand identity. Catches anything generic or AI-sounding. Strips language that doesn't match your ethos. Ensures every word sounds like you, not a freelancer." },
  { num: "05", title: "Final Polish & Delivery", time: "Day 5", desc: "A three-pass editorial sweep strips adverbs, tightens sentences, and kills anything that smells like a machine wrote it. You receive the finished script, the fact-check report, and the argument analysis." },
];

const deliverables = [
  { title: "Two-Column Script", desc: "Professional format — dialogue and visual/audio cues side by side. Tone markers throughout. Retention annotations at key timestamps." },
  { title: "Fact-Check Report", desc: "Timestamped source log for every claim. Contested data flagged. Anti-brand compliance verified. Your reputation insurance." },
  { title: "Argument Analysis", desc: "Original angle with cross-disciplinary synthesis. Model consensus mapped. Counter-arguments identified and pre-addressed." },
];

const faqs = [
  { q: "What's the turnaround?", a: "5 business days standard. Rush delivery at $650–$750 (25-50% premium)." },
  { q: "How many revisions?", a: "2 rounds included. Additional rounds at $75–$100/hour or $100–$150 flat." },
  { q: "What do you need from me?", a: "Your video idea, target length, audience info, and 3-5 past videos for voice matching. We handle everything else." },
  { q: "Do you use AI to write?", a: "AI powers our research — 7 models cross-referencing every angle. The writing, voice matching, and editorial judgment are human. That's the point." },
  { q: "What if it doesn't sound like me?", a: "Our Voice DNA onboarding studies your videos before we write a word. We deliver a 90-second voice sample for approval before the full script." },
  { q: "Can you do the voiceover?", a: "Yes. Our Script + Voiceover tier ($750) includes a broadcast-quality ElevenLabs voiceover with custom voice selection, WAV + MP3 delivery, and music cue sheets. Or add a standalone voiceover to any project for $150." },
];

export default function ProcessPage() {
  return (
    <MarketingLayout>
      <section className="max-w-[800px] mx-auto px-8 pt-40 pb-24">
        <RevealOnScroll>
          <p className="font-sans font-semibold text-xs text-amber tracking-[0.18em] uppercase mb-5">
            How It Works
          </p>
          <h1 className="font-serif text-text-bright leading-[1.1] mb-5" style={{ fontSize: "clamp(34px, 4.5vw, 52px)" }}>
            Idea to <em className="text-amber italic">ready-to-shoot</em><br />in five days
          </h1>
          <p className="text-[17px] text-text-dim max-w-[560px] mb-16 leading-[1.75]">
            Every script passes through five quality gates. Research, verification, writing, voice matching, and editorial polish — in that order.
          </p>
        </RevealOnScroll>

        {/* Steps */}
        {steps.map((step) => (
          <RevealOnScroll key={step.num}>
            <div className="flex gap-8 py-9 border-t border-border max-md:flex-col max-md:gap-3">
              <div className="shrink-0 w-12 font-sans font-extrabold text-sm text-amber tracking-[0.05em]">
                {step.num}
              </div>
              <div>
                <div className="flex justify-between items-baseline flex-wrap gap-2 mb-3">
                  <h3 className="font-sans font-bold text-xl text-text-bright leading-tight">
                    {step.title}
                  </h3>
                  <span className="font-sans font-medium text-xs text-text-muted">
                    {step.time}
                  </span>
                </div>
                <p className="font-sans text-[15px] text-text-primary leading-[1.7]">
                  {step.desc}
                </p>
              </div>
            </div>
          </RevealOnScroll>
        ))}
        <div className="border-t border-border" />

        <hr className="rule" />

        {/* Deliverables */}
        <RevealOnScroll>
          <h2 className="font-serif text-[32px] text-text-bright leading-[1.15]">
            What you <em className="text-amber italic">receive</em>
          </h2>
        </RevealOnScroll>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-9">
          {deliverables.map((d, i) => (
            <RevealOnScroll key={d.title} delay={i as 0 | 1 | 2}>
              <div className="bg-bg-card border border-border rounded-[10px] p-7">
                <h4 className="font-sans font-bold text-sm text-amber mb-3">{d.title}</h4>
                <p className="font-sans text-sm text-text-dim leading-relaxed">{d.desc}</p>
              </div>
            </RevealOnScroll>
          ))}
        </div>

        <hr className="rule" />

        {/* FAQ */}
        <RevealOnScroll>
          <h2 className="font-serif text-[32px] text-text-bright leading-[1.15]">
            Common <em className="text-amber italic">questions</em>
          </h2>
        </RevealOnScroll>
        <div className="mt-2">
          {faqs.map((faq) => (
            <RevealOnScroll key={faq.q}>
              <div className="border-b border-border py-6">
                <h4 className="font-sans font-semibold text-base text-text-bright mb-2">{faq.q}</h4>
                <p className="font-sans text-sm text-text-dim leading-relaxed">{faq.a}</p>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </section>
    </MarketingLayout>
  );
}
