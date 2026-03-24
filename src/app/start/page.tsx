"use client";

import { useState } from "react";
import MarketingLayout from "@/components/marketing/MarketingLayout";
import RevealOnScroll from "@/components/marketing/RevealOnScroll";

export default function StartPage() {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <MarketingLayout>
        <div className="max-w-[600px] mx-auto px-8 pt-60 pb-24 text-center">
          <div className="font-serif text-5xl text-amber mb-6">✓</div>
          <h1 className="font-serif text-4xl text-text-bright mb-4 leading-[1.2]">
            Project submitted
          </h1>
          <p className="text-base text-text-dim leading-[1.7]">
            We&apos;ll review everything and respond within 24 hours with next steps — including our Voice DNA onboarding questionnaire.
          </p>
        </div>
      </MarketingLayout>
    );
  }

  return (
    <MarketingLayout>
      <section className="max-w-[640px] mx-auto px-8 pt-40 pb-24">
        <RevealOnScroll>
          <p className="font-sans font-semibold text-xs text-amber tracking-[0.18em] uppercase mb-5">
            Start a Project
          </p>
          <h1 className="font-serif text-text-bright leading-[1.1] mb-4" style={{ fontSize: "clamp(32px, 4vw, 44px)" }}>
            Tell us about your <em className="text-amber italic">video</em>
          </h1>
          <p className="text-base text-text-dim mb-12 leading-relaxed">
            Fill out what you can. We&apos;ll follow up within 24 hours.
          </p>
        </RevealOnScroll>

        <RevealOnScroll delay={1}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block font-sans font-semibold text-[13px] text-text-primary mb-2">Name</label>
              <input className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-3.5 text-text-bright text-[15px] outline-none transition-colors focus:border-amber" placeholder="Your name" />
            </div>
            <div>
              <label className="block font-sans font-semibold text-[13px] text-text-primary mb-2">Email</label>
              <input type="email" className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-3.5 text-text-bright text-[15px] outline-none transition-colors focus:border-amber" placeholder="you@email.com" />
            </div>
          </div>

          <div className="mb-6">
            <label className="block font-sans font-semibold text-[13px] text-text-primary mb-2">Channel URL</label>
            <input className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-3.5 text-text-bright text-[15px] outline-none transition-colors focus:border-amber" placeholder="youtube.com/@yourchannel" />
          </div>

          <div className="mb-6">
            <label className="block font-sans font-semibold text-[13px] text-text-primary mb-2">What tier interests you?</label>
            <select className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-3.5 text-text-bright text-[15px] outline-none transition-colors focus:border-amber cursor-pointer">
              <option value="">Select a tier...</option>
              <option>Script System (Web App) - $79</option>
              <option>Research Pack - $149</option>
              <option>The Script - $500</option>
              <option>Script + Voiceover - $750</option>
              <option>Full Creative Package - $1,200</option>
              <option>Monthly Retainer - $1,600/mo</option>
              <option>Standalone Voiceover - $150</option>
              <option>Not sure yet</option>
            </select>
          </div>

          <div className="mb-6">
            <label className="block font-sans font-semibold text-[13px] text-text-primary mb-2">Video idea or topic</label>
            <textarea className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-3.5 text-text-bright text-[15px] outline-none transition-colors focus:border-amber min-h-[110px] resize-y" placeholder="What's the video about? Even a rough idea works." />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block font-sans font-semibold text-[13px] text-text-primary mb-2">Target length</label>
              <select className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-3.5 text-text-bright text-[15px] outline-none transition-colors focus:border-amber cursor-pointer">
                <option value="">Select...</option>
                <option>~5 minutes</option>
                <option>~8 minutes</option>
                <option>~10 minutes</option>
                <option>~12-13 minutes</option>
                <option>~15 minutes</option>
                <option>Not sure</option>
              </select>
            </div>
            <div>
              <label className="block font-sans font-semibold text-[13px] text-text-primary mb-2">Deadline?</label>
              <input className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-3.5 text-text-bright text-[15px] outline-none transition-colors focus:border-amber" placeholder="e.g., April 15" />
            </div>
          </div>

          <div className="mb-6">
            <label className="block font-sans font-semibold text-[13px] text-text-primary mb-2">How did you find us?</label>
            <select className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-3.5 text-text-bright text-[15px] outline-none transition-colors focus:border-amber cursor-pointer">
              <option value="">Select...</option>
              <option>YouTube</option>
              <option>Reddit</option>
              <option>Twitter / X</option>
              <option>LinkedIn</option>
              <option>Fiverr</option>
              <option>Upwork</option>
              <option>Roster / YT Jobs</option>
              <option>Referral</option>
              <option>Other</option>
            </select>
          </div>

          <button
            onClick={() => setSubmitted(true)}
            className="w-full bg-amber text-bg py-4 rounded-md font-bold text-base cursor-pointer transition-all hover:bg-amber-bright border-none mt-2"
          >
            Submit Project →
          </button>
          <p className="text-[13px] text-text-muted text-center mt-4">
            We respond within 24 hours. No commitment required.
          </p>
        </RevealOnScroll>
      </section>
    </MarketingLayout>
  );
}
