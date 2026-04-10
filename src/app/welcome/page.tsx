'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import MarketingLayout from '@/components/marketing/MarketingLayout';

function WelcomeForm() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [prefilling, setPrefilling] = useState(!!sessionId);

  // Pre-fill email from Stripe session
  useEffect(() => {
    if (!sessionId) return;
    fetch(`/api/stripe/session?session_id=${sessionId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.email) setEmail(data.email);
      })
      .catch(() => {})
      .finally(() => setPrefilling(false));
  }, [sessionId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || loading) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (data.success) {
        setSent(true);
      } else {
        setError(data.error || 'Failed to send magic link');
      }
    } catch {
      setError('Connection error. Please try again.');
    }

    setLoading(false);
  }

  if (sent) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-green/10 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="font-serif text-[28px] text-text-bright mb-3">Check your email</h2>
        <p className="text-[16px] text-text-dim max-w-[400px] mx-auto leading-relaxed">
          We sent a magic link to <span className="text-text-bright font-medium">{email}</span>.
          Click it to access the Script System.
        </p>
        <p className="text-[13px] text-text-muted mt-6">
          Didn&apos;t get it? Check your spam folder, or{' '}
          <button onClick={() => setSent(false)} className="text-amber hover:text-amber-bright transition-colors underline bg-transparent border-none cursor-pointer font-inherit text-inherit">
            try again
          </button>.
        </p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="w-16 h-16 rounded-full bg-amber/10 flex items-center justify-center mx-auto mb-6">
        <svg className="w-8 h-8 text-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="font-serif text-[32px] text-text-bright mb-3">Payment confirmed!</h1>
      <p className="text-[16px] text-text-dim max-w-[440px] mx-auto mb-8 leading-relaxed">
        Enter the email you used at checkout to get your access link. We&apos;ll send a magic link. No password needed.
      </p>

      <form onSubmit={handleSubmit} className="max-w-[400px] mx-auto">
        <div className="flex gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={prefilling ? 'Loading...' : 'your@email.com'}
            disabled={prefilling}
            required
            className="flex-1 bg-bg-card border border-border rounded-lg px-4 py-3 text-[15px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber/50 focus:ring-1 focus:ring-amber/20 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="px-6 py-3 bg-amber text-bg font-bold text-[15px] rounded-lg border-none cursor-pointer transition-all hover:bg-amber-bright hover:text-bg disabled:opacity-50 shrink-0"
          >
            {loading ? 'Sending...' : 'Send Link'}
          </button>
        </div>
        {error && (
          <p className="text-red text-[13px] mt-3 text-left">{error}</p>
        )}
      </form>

      <p className="text-[12px] text-text-muted mt-8">
        Use the same email you paid with so we can match your purchase.
      </p>
    </div>
  );
}

export default function WelcomePage() {
  return (
    <MarketingLayout>
      <section className="max-w-[600px] mx-auto px-8 pt-40 pb-24">
        <Suspense fallback={
          <div className="text-center text-text-muted">Loading...</div>
        }>
          <WelcomeForm />
        </Suspense>
      </section>
    </MarketingLayout>
  );
}
