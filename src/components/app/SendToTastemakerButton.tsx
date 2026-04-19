'use client';

import { useState } from 'react';

interface SendToTastemakerButtonProps {
  content: string;
  title: string;
  sourceLabel?: string;
  disabled?: boolean;
}

type Status = 'idle' | 'sending' | 'sent' | 'error';

export default function SendToTastemakerButton({
  content,
  title,
  sourceLabel = 'Script',
  disabled = false,
}: SendToTastemakerButtonProps) {
  const [status, setStatus] = useState<Status>('idle');

  async function handleSend() {
    if (!content.trim() || status === 'sending' || status === 'sent') return;

    setStatus('sending');

    try {
      const res = await fetch('/api/tastemaker/voice-samples', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.slice(0, 100),
          notes: `Sent from ${sourceLabel} page`,
          content,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error('Send to Tastemaker failed:', data.error);
        setStatus('error');
        setTimeout(() => setStatus('idle'), 3000);
        return;
      }

      setStatus('sent');
    } catch (err) {
      console.error('Send to Tastemaker error:', err);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  }

  const isDisabled = disabled || !content.trim() || status === 'sending' || status === 'sent';

  const label = {
    idle: `Send ${sourceLabel} to Tastemaker`,
    sending: 'Sending...',
    sent: 'Sent to Tastemaker',
    error: 'Failed. Try again.',
  }[status];

  const className =
    status === 'sent'
      ? 'text-[13px] px-4 py-2 rounded-md bg-green/20 text-green cursor-default border border-green/30'
      : status === 'error'
        ? 'text-[13px] px-4 py-2 rounded-md bg-red/20 text-red border border-red/30 cursor-pointer'
        : isDisabled
          ? 'text-[13px] px-4 py-2 rounded-md bg-bg-card text-text-dim border border-border cursor-not-allowed opacity-50'
          : 'text-[13px] px-4 py-2 rounded-md bg-bg-card text-amber hover:bg-amber/10 cursor-pointer border border-border transition-colors';

  return (
    <button onClick={handleSend} disabled={isDisabled} className={className}>
      {label}
    </button>
  );
}
