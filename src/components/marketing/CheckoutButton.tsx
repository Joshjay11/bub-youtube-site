'use client';

import { useState } from 'react';

export default function CheckoutButton({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Something went wrong. Please try again.');
        setLoading(false);
      }
    } catch {
      alert('Connection error. Please try again.');
      setLoading(false);
    }
  }

  return (
    <button onClick={handleClick} disabled={loading} className={className}>
      {loading ? 'Redirecting to checkout...' : children}
    </button>
  );
}
