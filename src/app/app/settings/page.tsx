'use client';

import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('');
  const [savedKey, setSavedKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [credits, setCredits] = useState<{ remaining: number; monthly: number; subscriptionActive: boolean } | null>(null);

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

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-[32px] text-text-bright mb-2">Settings</h1>
      <p className="text-text-dim text-[15px] mb-8">Manage your API key and AI credits.</p>

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
              {credits.subscriptionActive && (
                <>
                  <div className="w-px h-10 bg-border" />
                  <div>
                    <div className="text-[18px] font-mono font-bold text-green">{credits.monthly}</div>
                    <div className="text-[12px] text-text-muted">monthly credits</div>
                  </div>
                </>
              )}
            </div>
            <p className="text-[13px] text-text-dim">
              Your $79 purchase includes 100 free AI credits. Each prompt run uses 1 credit.
            </p>
            {!credits.subscriptionActive && credits.remaining < 10 && (
              <div className="bg-amber/5 border border-amber/20 rounded-lg p-4">
                <div className="text-[14px] text-text-bright font-medium mb-1">Need more credits?</div>
                <p className="text-[13px] text-text-dim mb-3">
                  Subscribe for $5/month to get 100 AI credits per month, or bring your own Anthropic API key below.
                </p>
                <button className="px-4 py-2 bg-amber text-bg text-[13px] font-medium rounded-lg border-none cursor-pointer transition-all hover:bg-amber-bright hover:text-bg disabled:opacity-50 opacity-60" disabled>
                  Subscribe — $5/month (coming soon)
                </button>
              </div>
            )}
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
          <li>Otherwise, prompts use your included credits (1 credit per run)</li>
          <li>When credits run out, you can add a key or subscribe for more</li>
        </ol>
      </div>
    </div>
  );
}
