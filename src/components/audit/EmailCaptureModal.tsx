"use client";

import { useState } from "react";

interface EmailCaptureModalProps {
  onSubmit: (name: string, email: string) => void;
  onClose: () => void;
}

export default function EmailCaptureModal({ onSubmit, onClose }: EmailCaptureModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  const inputClass =
    "w-full bg-bg-elevated border border-border rounded-lg px-4 py-3.5 text-text-bright text-[15px] outline-none transition-colors focus:border-amber";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setSending(true);
    onSubmit(name.trim(), email.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-bg-elevated border border-border rounded-2xl p-8 w-full max-w-md">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-muted hover:text-text-bright transition-colors text-xl leading-none bg-transparent border-none cursor-pointer"
          aria-label="Close"
        >
          &times;
        </button>

        <h2 className="font-serif text-2xl text-text-bright mb-2">
          Before we run your audit...
        </h2>
        <p className="text-sm text-text-dim mb-6 leading-relaxed">
          We&apos;ll send your results to your inbox so you can reference them later.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block font-sans font-semibold text-[13px] text-text-primary mb-2">
              First name
            </label>
            <input
              className={inputClass}
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label className="block font-sans font-semibold text-[13px] text-text-primary mb-2">
              Email
            </label>
            <input
              type="email"
              className={inputClass}
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={sending || !name.trim() || !email.trim()}
            className="w-full bg-amber text-bg py-4 rounded-md font-bold text-base cursor-pointer transition-all hover:bg-amber-bright hover:text-bg border-none disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {sending ? "Starting..." : "Run My Audit \u2192"}
          </button>

          <p className="text-[12px] text-text-muted text-center mt-4">
            No spam. Unsubscribe anytime.
          </p>
        </form>
      </div>
    </div>
  );
}
