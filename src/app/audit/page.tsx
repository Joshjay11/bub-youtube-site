"use client";

import { useState, useRef, useCallback } from "react";
import MarketingLayout from "@/components/marketing/MarketingLayout";
import RevealOnScroll from "@/components/marketing/RevealOnScroll";
import EmailCaptureModal from "@/components/audit/EmailCaptureModal";
import AuditResults from "@/components/audit/AuditResults";

interface AuditResponse {
  audit: {
    categories: { name: string; score: number; explanation: string; fix: string | null }[];
    total_score: number;
    verdict: string;
    priority_fixes: { rank: number; category: string; fix: string }[];
  };
  wordCount: number;
  estimatedMinutes: number;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export default function AuditPage() {
  const [script, setScript] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [results, setResults] = useState<AuditResponse | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const wordCount = countWords(script);
  const canSubmit = wordCount >= 200 && status !== "loading";

  const handleAuditClick = () => {
    if (!canSubmit) return;
    setShowModal(true);
  };

  const runAudit = useCallback(async () => {
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }

      setResults(data);
      setStatus("done");

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch {
      setErrorMsg("Connection error. Please try again.");
      setStatus("error");
    }
  }, [script]);

  const handleEmailSubmit = (name: string, email: string) => {
    setShowModal(false);

    // Fire-and-forget email capture
    fetch("/api/audit/capture", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email }),
    }).catch(() => {});

    runAudit();
  };

  const inputClass =
    "w-full bg-bg-elevated border border-border rounded-xl px-5 py-4 text-text-bright text-[15px] outline-none transition-colors focus:border-amber resize-y min-h-[300px] leading-relaxed font-sans";

  return (
    <MarketingLayout>
      <section className="max-w-[720px] mx-auto px-6 pt-40 pb-24">
        {/* Hero */}
        <RevealOnScroll>
          <p className="font-sans font-semibold text-xs text-amber tracking-[0.18em] uppercase mb-5">
            Script Audit
          </p>
          <h1
            className="font-serif text-text-bright leading-[1.1] mb-4"
            style={{ fontSize: "clamp(32px, 4vw, 48px)" }}
          >
            Find out exactly where your scripts{" "}
            <em className="text-amber italic">lose viewers.</em>
          </h1>
          <p className="text-base text-text-dim mb-10 leading-relaxed max-w-[560px]">
            Paste your script below. Our AI analyzes it across 9 retention categories and tells you
            exactly what to fix.
          </p>
        </RevealOnScroll>

        {/* Textarea */}
        <RevealOnScroll delay={1}>
          <div className="mb-2">
            <textarea
              className={inputClass}
              placeholder="Paste your script here..."
              value={script}
              onChange={(e) => setScript(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between mb-6">
            <p className="text-[13px] text-text-muted">
              Word count:{" "}
              <span className={wordCount >= 200 ? "text-text-primary" : "text-text-muted"}>
                {wordCount.toLocaleString()}
              </span>
              {wordCount > 0 && wordCount < 200 && (
                <span className="text-text-muted"> (minimum 200)</span>
              )}
              {wordCount > 5000 && (
                <span className="text-red"> (maximum 5,000)</span>
              )}
            </p>
          </div>

          {status === "error" && (
            <div className="bg-[#f8717133] border border-[#f87171] rounded-lg px-4 py-3 mb-4 text-sm text-[#f87171]">
              {errorMsg}
            </div>
          )}

          <button
            onClick={handleAuditClick}
            disabled={!canSubmit || wordCount > 5000}
            className="w-full bg-amber text-bg py-4 rounded-md font-bold text-base cursor-pointer transition-all hover:bg-amber-bright hover:text-bg border-none disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Audit My Script &rarr;
          </button>

          <p className="text-[13px] text-text-muted text-center mt-4">
            Free. No account required. 3 audits per day.
          </p>
        </RevealOnScroll>

        {/* Loading */}
        {status === "loading" && (
          <div className="mt-16 text-center">
            <div className="flex justify-center mb-6">
              <span className="audit-pulse inline-block w-3 h-3 rounded-full bg-amber" />
            </div>
            <p className="text-text-primary text-base">
              Analyzing your script across 9 retention categories...
            </p>
            <style>{`
              .audit-pulse {
                animation: auditPulse 1.4s ease-in-out infinite;
              }
              @keyframes auditPulse {
                0%, 100% { opacity: 0.3; transform: scale(1); }
                50% { opacity: 1; transform: scale(1.6); }
              }
            `}</style>
          </div>
        )}

        {/* Results */}
        {status === "done" && results && (
          <div ref={resultsRef} className="mt-16">
            <AuditResults
              audit={results.audit}
              wordCount={results.wordCount}
              estimatedMinutes={results.estimatedMinutes}
            />
          </div>
        )}
      </section>

      {/* Email Modal */}
      {showModal && (
        <EmailCaptureModal
          onSubmit={handleEmailSubmit}
          onClose={() => setShowModal(false)}
        />
      )}
    </MarketingLayout>
  );
}
