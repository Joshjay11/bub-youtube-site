'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const MAX_CREDITS = 100;

export default function CreditHealthBar() {
  const [credits, setCredits] = useState<number | null>(null);
  const [source, setSource] = useState('');

  useEffect(() => {
    fetchCredits();

    // Re-fetch after any AI call completes (custom event)
    function handleCreditChange() { fetchCredits(); }
    window.addEventListener('credits-changed', handleCreditChange);
    return () => window.removeEventListener('credits-changed', handleCreditChange);
  }, []);

  function fetchCredits() {
    fetch('/api/ai/run-prompt')
      .then((r) => r.json())
      .then((data) => {
        setCredits(data.remaining);
        setSource(data.source || '');
      })
      .catch(() => {});
  }

  if (credits === null) return null;

  // BYOK users get unlimited
  if (source === 'byok' || credits === -1) {
    return (
      <div className="px-3 py-2">
        <div className="text-[11px] text-green">Using your API key</div>
      </div>
    );
  }

  const pct = Math.min(100, (credits / MAX_CREDITS) * 100);
  const barColor = credits >= 50 ? 'bg-blue-400' : credits >= 20 ? 'bg-green' : 'bg-red';
  const textColor = credits >= 50 ? 'text-blue-400' : credits >= 20 ? 'text-green' : 'text-red';

  return (
    <div className="px-3 py-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-text-muted uppercase tracking-wider">Credits</span>
        <span className={`text-[11px] font-mono ${textColor}`}>{credits} / {MAX_CREDITS}</span>
      </div>
      <div className="h-1.5 bg-bg-card rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      {credits < 20 && (
        <Link href="/app/settings" className="text-[10px] text-red hover:text-red/80 transition-colors mt-1 block no-underline">
          Get more credits
        </Link>
      )}
    </div>
  );
}

/** Dispatch after any credit-consuming AI call */
export function notifyCreditChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('credits-changed'));
  }
}
