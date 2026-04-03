'use client';

import { useState } from "react";
import Link from "next/link";
import MarketingLayout from "@/components/marketing/MarketingLayout";
import RevealOnScroll from "@/components/marketing/RevealOnScroll";

function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="text-sm text-text-primary leading-[2.2] pl-5 relative">
      <span className="absolute left-0 text-amber">&#10003;</span>
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

const SUBSCRIPTION_FEATURES = [
  'Full 6-stage guided workflow',
  'AI-powered idea scoring with gap analysis',
  'Automated 5-angle topic research',
  'Hook generation + 10-criteria AI scorer',
  '6 specialized AI prompt templates',
  'Dual-model script generation',
  'Slop Scanner + Editor\u2019s Table + Quality Score',
  'AI retention audit with fix suggestions',
  'ElevenLabs voiceover export',
  'Cinematic beat sheet generator',
  'Thinking Partner on every page',
  'Tastemaker creative profile (unlocks at 7 projects)',
  'AI credits included',
  'BYOK option',
];

export default function PricingPage() {
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  const handleSubscribe = async (tier: 'founding' | 'pro' | 'annual') => {
    setLoadingTier(tier);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.error) {
        alert(data.error);
        setLoadingTier(null);
      }
    } catch {
      alert('Connection error. Please try again.');
      setLoadingTier(null);
    }
  };

  return (
    <MarketingLayout>
      <section className="max-w-[1120px] mx-auto px-8 pt-40 pb-24">
        {/* Header */}
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

        {/* Subscription Cards */}
        <RevealOnScroll>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
            {/* Founding Member */}
            <div className="bg-bg-card border border-border rounded-[14px] p-8 flex flex-col relative">
              <span className="absolute -top-3 left-8 bg-amber text-bg font-bold text-[11px] px-4 py-1.5 rounded tracking-[0.08em] uppercase">
                Founding Member
              </span>
              <div className="mb-6">
                <div className="font-serif font-bold text-4xl text-amber">$19</div>
                <div className="text-xs text-text-muted mt-1">/month</div>
                <p className="text-sm text-text-dim mt-3 leading-relaxed">Lock in this rate forever</p>
                <p className="text-xs text-amber/80 mt-1">Limited to first 50 subscribers</p>
              </div>
              <ul className="list-none p-0 flex-1">
                {SUBSCRIPTION_FEATURES.map((f) => <CheckItem key={f}>{f}</CheckItem>)}
              </ul>
              <button
                onClick={() => handleSubscribe('founding')}
                disabled={loadingTier !== null}
                className="mt-6 w-full bg-amber text-bg px-6 py-3.5 rounded-md font-bold text-[15px] border-none cursor-pointer transition-all hover:bg-amber-bright hover:text-bg hover:-translate-y-px disabled:opacity-60"
              >
                {loadingTier === 'founding' ? 'Redirecting...' : 'Join as Founding Member'}
              </button>
            </div>

            {/* Pro — Most Popular */}
            <div className="bg-bg-card border border-amber/30 rounded-[14px] p-8 flex flex-col relative ring-1 ring-amber/10">
              <span className="absolute -top-3 left-8 bg-amber text-bg font-bold text-[11px] px-4 py-1.5 rounded tracking-[0.08em] uppercase">
                Most Popular
              </span>
              <div className="mb-6">
                <div className="font-serif font-bold text-4xl text-amber">$29</div>
                <div className="text-xs text-text-muted mt-1">/month</div>
                <p className="text-sm text-text-dim mt-3 leading-relaxed">Full access to the complete workflow</p>
              </div>
              <ul className="list-none p-0 flex-1">
                {SUBSCRIPTION_FEATURES.map((f) => <CheckItem key={f}>{f}</CheckItem>)}
              </ul>
              <button
                onClick={() => handleSubscribe('pro')}
                disabled={loadingTier !== null}
                className="mt-6 w-full bg-amber text-bg px-6 py-4 rounded-md font-bold text-base border-none cursor-pointer transition-all hover:bg-amber-bright hover:text-bg hover:-translate-y-px disabled:opacity-60"
              >
                {loadingTier === 'pro' ? 'Redirecting...' : 'Start Writing Better Scripts'}
              </button>
            </div>

            {/* Annual — Best Value */}
            <div className="bg-bg-card border border-border rounded-[14px] p-8 flex flex-col relative">
              <span className="absolute -top-3 left-8 bg-green text-bg font-bold text-[11px] px-4 py-1.5 rounded tracking-[0.08em] uppercase">
                Best Value
              </span>
              <div className="mb-6">
                <div className="font-serif font-bold text-4xl text-amber">$249</div>
                <div className="text-xs text-text-muted mt-1">/year</div>
                <p className="text-sm text-text-dim mt-3 leading-relaxed">Save $99/year</p>
                <p className="text-xs text-text-muted mt-1">$20.75/month</p>
              </div>
              <ul className="list-none p-0 flex-1">
                {SUBSCRIPTION_FEATURES.map((f) => <CheckItem key={f}>{f}</CheckItem>)}
              </ul>
              <button
                onClick={() => handleSubscribe('annual')}
                disabled={loadingTier !== null}
                className="mt-6 w-full bg-amber text-bg px-6 py-3.5 rounded-md font-bold text-[15px] border-none cursor-pointer transition-all hover:bg-amber-bright hover:text-bg hover:-translate-y-px disabled:opacity-60"
              >
                {loadingTier === 'annual' ? 'Redirecting...' : 'Save with Annual'}
              </button>
            </div>
          </div>
        </RevealOnScroll>

        {/* Money-back guarantee */}
        <RevealOnScroll>
          <p className="text-center text-sm text-text-dim mb-16">
            <Link href="/refund" className="text-amber hover:text-amber-bright no-underline">30-day money-back guarantee</Link>. No questions asked.
          </p>
        </RevealOnScroll>

        {/* Email Capture Placeholder */}
        <RevealOnScroll>
          <div className="bg-bg-card border border-border rounded-[14px] p-10 text-center mb-16 max-w-[640px] mx-auto">
            <h3 className="font-sans font-bold text-[18px] text-text-bright mb-2">Free Download: The YouTube Hook Scorecard</h3>
            <p className="text-sm text-text-dim mb-6 leading-relaxed">
              The same 10-point framework BUB uses to evaluate YouTube hooks. Includes 3 graded examples.
            </p>
            {/* TODO: Wire email capture to Resend or Loops — see infrastructure doc */}
            <div className="flex gap-3 max-w-[420px] mx-auto">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 bg-bg-elevated border border-border rounded-md px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber/50"
              />
              <button className="bg-amber text-bg px-6 py-3 rounded-md font-bold text-sm border-none cursor-pointer transition-all hover:bg-amber-bright hover:text-bg whitespace-nowrap">
                Send It &rarr;
              </button>
            </div>
            <p className="text-xs text-text-muted mt-3">No spam. Just the scorecard. Unsubscribe anytime.</p>
          </div>
        </RevealOnScroll>

        <hr className="rule" />

        {/* Done-For-You Services */}
        <RevealOnScroll>
          <div className="max-w-[720px] mb-12">
            <p className="font-sans font-semibold text-xs text-amber tracking-[0.18em] uppercase mb-5">
              Done-For-You Services
            </p>
            <h2 className="font-serif text-[32px] text-text-bright leading-[1.15] mb-3">
              Want us to write it <em className="text-amber italic">for you?</em>
            </h2>
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
                <div className="font-serif font-bold text-4xl text-amber">$225</div>
                <div className="text-xs text-text-muted mt-1">per project</div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-sans font-semibold text-[13px] text-amber tracking-[0.1em] uppercase mb-4">Included</h4>
                <ul className="list-none p-0">
                  <CheckItem>9-model research sweep</CheckItem>
                  <CheckItem>NotebookLM synthesis</CheckItem>
                  <CheckItem>Fact-check report (Consensus / Contested / Opinion)</CheckItem>
                  <CheckItem>Argument analysis + counter-arguments</CheckItem>
                  <CheckItem>3-5 angle recommendations (ranked)</CheckItem>
                  <CheckItem>5 title options + 3 thumbnail concepts</CheckItem>
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
                Start with Research &rarr;
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
                Start Your Script &rarr;
              </Link>
            </div>
          </div>
        </RevealOnScroll>

        {/* Monthly Retainer */}
        <RevealOnScroll delay={2}>
          <div className="bg-bg-card border border-border rounded-[14px] p-10 mb-5">
            <div className="flex justify-between items-baseline flex-wrap gap-4 mb-6">
              <div>
                <h3 className="font-sans font-bold text-[22px] text-text-bright mb-1">Monthly Retainer</h3>
                <p className="text-sm text-text-dim">4 scripts/month. Your channel on autopilot.</p>
              </div>
              <div className="text-right">
                <div className="font-serif font-bold text-4xl text-amber">$1,800</div>
                <div className="text-xs text-text-muted mt-1">per month · 10% discount</div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-sans font-semibold text-[13px] text-amber tracking-[0.1em] uppercase mb-4">Included</h4>
                <ul className="list-none p-0">
                  <CheckItem>4x Script packages per month</CheckItem>
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
                  Scripts get better every month because we track your channel, your audience, and your voice evolution. By month 3, we know your voice better than you do.
                </p>
              </div>
            </div>
            <div className="mt-7 pt-6 border-t border-border">
              <Link href="/start" className="inline-flex items-center gap-2 bg-transparent text-amber px-8 py-3.5 rounded-md font-semibold text-[15px] no-underline border border-[rgba(212,163,66,0.3)] transition-all hover:border-amber hover:bg-amber-glow">
                Start a Retainer &rarr;
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
            { title: "Production Blueprint", price: "$250", desc: "Cinematic beat sheet + 10-15 curated AI images styled to your channel. Delivered as files with a visual timing document. For creators who have the script and need the production roadmap." },
            { title: "Additional Revisions", price: "$100/round", desc: "Beyond the 2 included rounds. Additional voiceover renders at $50 each for different pacing or tone." },
            { title: "Shorts Script Pack", price: "$100", desc: "3-5 short-form scripts extracted from your long-form video. Hooks, cuts, and CTAs optimized for Shorts, TikTok, and Reels." },
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
              "9-model research methodology",
              "Fact-check report with source log",
              "Loom walkthrough of key decisions",
              "Branded delivery folder",
              "24-hour response time",
              "Post-delivery follow-up sequence",
            ].map((item) => (
              <div key={item} className="bg-bg-card border border-border rounded-lg px-5 py-5">
                <span className="text-amber mr-2">&#10003;</span>
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
              Start a Conversation &rarr;
            </Link>
          </RevealOnScroll>
        </div>
      </section>
    </MarketingLayout>
  );
}
