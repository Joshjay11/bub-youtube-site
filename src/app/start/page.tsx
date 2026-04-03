"use client";

import { useState } from "react";
import MarketingLayout from "@/components/marketing/MarketingLayout";
import RevealOnScroll from "@/components/marketing/RevealOnScroll";

export default function StartPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    channel: '',
    tier: '',
    topic: '',
    length: '',
    deadline: '',
    source: '',
  });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim() || !form.email.trim()) {
      setErrorMsg('Name and email are required.');
      setStatus('error');
      return;
    }

    setStatus('sending');
    setErrorMsg('');

    try {
      const res = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Something went wrong. Please try again.');
        setStatus('error');
        return;
      }

      setStatus('success');
    } catch {
      setErrorMsg('Connection error. Please try again.');
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <MarketingLayout>
        <div className="max-w-[600px] mx-auto px-8 pt-60 pb-24 text-center">
          <div className="font-serif text-5xl text-amber mb-6">&#10003;</div>
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

  const inputClass = "w-full bg-bg-elevated border border-border rounded-lg px-4 py-3.5 text-text-bright text-[15px] outline-none transition-colors focus:border-amber";

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
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block font-sans font-semibold text-[13px] text-text-primary mb-2">Name *</label>
                <input className={inputClass} placeholder="Your name" value={form.name} onChange={set('name')} />
              </div>
              <div>
                <label className="block font-sans font-semibold text-[13px] text-text-primary mb-2">Email *</label>
                <input type="email" className={inputClass} placeholder="you@email.com" value={form.email} onChange={set('email')} />
              </div>
            </div>

            <div className="mb-6">
              <label className="block font-sans font-semibold text-[13px] text-text-primary mb-2">Channel URL</label>
              <input className={inputClass} placeholder="youtube.com/@yourchannel" value={form.channel} onChange={set('channel')} />
            </div>

            <div className="mb-6">
              <label className="block font-sans font-semibold text-[13px] text-text-primary mb-2">What tier interests you?</label>
              <select className={`${inputClass} cursor-pointer`} value={form.tier} onChange={set('tier')}>
                <option value="">Select a tier...</option>
                <option>Research Pack — $225</option>
                <option>The Script — $500</option>
                <option>Monthly Retainer — $1,800/mo</option>
                <option>Not sure yet</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block font-sans font-semibold text-[13px] text-text-primary mb-2">Video idea or topic</label>
              <textarea className={`${inputClass} min-h-[110px] resize-y`} placeholder="What's the video about? Even a rough idea works." value={form.topic} onChange={set('topic')} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block font-sans font-semibold text-[13px] text-text-primary mb-2">Target length</label>
                <select className={`${inputClass} cursor-pointer`} value={form.length} onChange={set('length')}>
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
                <input className={inputClass} placeholder="e.g., April 15" value={form.deadline} onChange={set('deadline')} />
              </div>
            </div>

            <div className="mb-6">
              <label className="block font-sans font-semibold text-[13px] text-text-primary mb-2">How did you find us?</label>
              <select className={`${inputClass} cursor-pointer`} value={form.source} onChange={set('source')}>
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

            {status === 'error' && (
              <div className="bg-[#f8717133] border border-[#f87171] rounded-lg px-4 py-3 mb-4 text-sm text-[#f87171]">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'sending'}
              className="w-full bg-amber text-bg py-4 rounded-md font-bold text-base cursor-pointer transition-all hover:bg-amber-bright hover:text-bg border-none mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {status === 'sending' ? 'Sending...' : 'Submit Project \u2192'}
            </button>
            <p className="text-[13px] text-text-muted text-center mt-4">
              We respond within 24 hours. No commitment required.
            </p>
          </form>
        </RevealOnScroll>
      </section>
    </MarketingLayout>
  );
}
