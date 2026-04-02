'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSubscription } from '@/contexts/SubscriptionContext';

const TIER_LABELS: Record<string, string> = {
  founding: 'Founding Member — $19/month',
  pro: 'Pro — $29/month',
  annual: 'Annual — $249/year',
};

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('');
  const [savedKey, setSavedKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [credits, setCredits] = useState<{ remaining: number; monthly: number; subscriptionActive: boolean } | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const { status: subStatus, tier, currentPeriodEnd } = useSubscription();

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        if (data.hasApiKey) setSavedKey('••••••••••••');
        if (data.credits) setCredits(data.credits);
      })
      .catch(() => {});
  }, []);

  async function handleSaveKey(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ anthropic_api_key: apiKey }),
      });
      const data = await res.json();
      if (data.success) {
        setSavedKey('••••••••••••');
        setApiKey('');
        setMessage('API key saved.');
      } else {
        setMessage(data.error || 'Failed to save.');
      }
    } catch {
      setMessage('Connection error.');
    }
    setSaving(false);
  }

  async function handleRemoveKey() {
    setSaving(true);
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ anthropic_api_key: '' }),
      });
      setSavedKey('');
      setMessage('API key removed.');
    } catch {
      setMessage('Connection error.');
    }
    setSaving(false);
  }

  async function handleManageSubscription() {
    setPortalLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      // Non-blocking
    }
    setPortalLoading(false);
  }

  const endDate = currentPeriodEnd
    ? new Date(currentPeriodEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-[32px] text-text-bright mb-2">Settings</h1>
      <p className="text-text-dim text-[15px] mb-8">Manage your subscription, API key, and AI credits.</p>

      {/* Subscription */}
      <div className="bg-bg-card border border-border rounded-xl p-6 mb-6">
        <h2 className="font-serif text-[20px] text-text-bright mb-4">Subscription</h2>

        {subStatus === 'loading' ? (
          <p className="text-text-muted text-[14px]">Loading subscription...</p>
        ) : subStatus === 'active' || subStatus === 'past_due' || subStatus === 'canceled' ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className={`inline-block w-2 h-2 rounded-full ${subStatus === 'active' ? 'bg-green' : subStatus === 'past_due' ? 'bg-amber' : 'bg-text-muted'}`} />
              <span className="text-[14px] text-text-bright">
                {subStatus === 'active' ? 'Active' : subStatus === 'past_due' ? 'Past Due' : 'Canceled'}
                {tier && ` (${TIER_LABELS[tier] || tier})`}
              </span>
            </div>
            {endDate && (
              <p className="text-[13px] text-text-dim">
                {subStatus === 'canceled' ? 'Access until' : 'Next billing date'}:{' '}
                <span className="text-text-bright">{endDate}</span>
              </p>
            )}
            <button
              onClick={handleManageSubscription}
              disabled={portalLoading}
              className="px-5 py-2.5 text-[13px] text-amber border border-amber/30 rounded-lg hover:bg-amber/5 transition-colors bg-transparent cursor-pointer disabled:opacity-50"
            >
              {portalLoading ? 'Opening...' : 'Manage Subscription \u2192'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-[14px] text-text-dim">No active subscription</p>
            <Link
              href="/pricing"
              className="inline-block px-5 py-2.5 text-[13px] text-bg bg-amber rounded-lg font-medium no-underline hover:bg-amber-bright transition-colors"
            >
              Subscribe &rarr;
            </Link>
          </div>
        )}
      </div>

      {/* AI Credits */}
      <div className="bg-bg-card border border-border rounded-xl p-6 mb-6">
        <h2 className="font-serif text-[20px] text-text-bright mb-4">AI Credits</h2>
        {credits ? (
          <div className="space-y-4">
            <div className="flex items-center gap-8">
              <div>
                <div className="text-[28px] font-mono font-bold text-amber">{credits.remaining}</div>
                <div className="text-[12px] text-text-muted">credits remaining</div>
              </div>
            </div>
            <p className="text-[13px] text-text-dim">
              Each AI-powered action uses 1-2 credits. Bring your own API key below for unlimited use.
            </p>
          </div>
        ) : (
          <p className="text-text-muted text-[14px]">Loading credits...</p>
        )}
      </div>

      {/* BYOK */}
      <div className="bg-bg-card border border-border rounded-xl p-6 mb-6">
        <h2 className="font-serif text-[20px] text-text-bright mb-1">Bring Your Own Key</h2>
        <p className="text-[13px] text-text-dim mb-5">
          Paste your Anthropic API key to use unlimited AI prompts without credits. Your key is encrypted at rest and never exposed client-side.
        </p>

        {savedKey ? (
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-bg-elevated border border-border rounded-lg px-4 py-3 text-[14px] text-text-muted font-mono">
              {savedKey}
            </div>
            <button
              onClick={handleRemoveKey}
              disabled={saving}
              className="px-4 py-2.5 text-[13px] text-red border border-red/20 rounded-lg hover:bg-red/10 transition-colors bg-transparent cursor-pointer disabled:opacity-50"
            >
              Remove
            </button>
          </div>
        ) : (
          <form onSubmit={handleSaveKey} className="flex gap-3">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-ant-api03-..."
              className="flex-1 bg-bg-elevated border border-border rounded-lg px-4 py-3 text-[14px] text-text-primary font-mono placeholder:text-text-muted focus:outline-none focus:border-amber/50 focus:ring-1 focus:ring-amber/20"
            />
            <button
              type="submit"
              disabled={saving || !apiKey.trim()}
              className="px-5 py-3 bg-amber text-bg text-[14px] font-medium rounded-lg border-none cursor-pointer transition-all hover:bg-amber-bright hover:text-bg disabled:opacity-50 shrink-0"
            >
              {saving ? 'Saving...' : 'Save Key'}
            </button>
          </form>
        )}

        {message && (
          <p className={`text-[13px] mt-3 ${message.includes('error') || message.includes('Failed') ? 'text-red' : 'text-green'}`}>
            {message}
          </p>
        )}
      </div>

      {/* How it works */}
      <div className="bg-bg-elevated border border-border rounded-xl p-5">
        <h3 className="text-[14px] text-text-bright font-medium mb-3">How AI prompts work</h3>
        <ol className="space-y-2 text-[13px] text-text-dim list-decimal list-inside">
          <li>If you have a BYOK key saved, prompts use your key directly (unlimited, no credits consumed)</li>
          <li>Otherwise, prompts use your included credits (1-2 credits per run)</li>
          <li>When credits run out, you can add a key or your subscription credits refresh next billing cycle</li>
        </ol>
      </div>
    </div>
  );
}
