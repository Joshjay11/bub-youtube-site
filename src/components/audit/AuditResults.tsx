"use client";

import { useState } from "react";
import CategoryCard from "./CategoryCard";

interface Category {
  name: string;
  score: number;
  explanation: string;
  fix: string | null;
}

interface PriorityFix {
  rank: number;
  category: string;
  fix: string;
}

interface AuditData {
  categories: Category[];
  total_score: number;
  verdict: string;
  priority_fixes: PriorityFix[];
}

interface AuditResultsProps {
  audit: AuditData;
  wordCount: number;
  estimatedMinutes: number;
}

function verdictColor(verdict: string): string {
  switch (verdict) {
    case "Strong":
      return "bg-green/15 text-green border-green/30";
    case "Has Potential":
      return "bg-amber/15 text-amber border-amber/30";
    case "Needs Work":
      return "bg-[#f97316]/15 text-[#f97316] border-[#f97316]/30";
    case "Critical":
      return "bg-red/15 text-red border-red/30";
    default:
      return "bg-amber/15 text-amber border-amber/30";
  }
}

function buildCopyText(audit: AuditData, wordCount: number, estimatedMinutes: number): string {
  let text = `SCRIPT AUDIT RESULTS -- BUB YouTube Writer\nScore: ${audit.total_score}/45 -- ${audit.verdict}\n\n`;

  for (const cat of audit.categories) {
    text += `${cat.name.toUpperCase()}: ${cat.score}/5\n${cat.explanation}\n`;
    if (cat.fix && cat.score <= 3) {
      text += `Fix: ${cat.fix}\n`;
    }
    text += "\n";
  }

  text += "TOP 3 PRIORITY FIXES:\n";
  for (const pf of audit.priority_fixes) {
    text += `${pf.rank}. [${pf.category}] ${pf.fix}\n`;
  }

  text += `\nWord count: ${wordCount.toLocaleString()} | ~${estimatedMinutes} min at 150 WPM\n`;
  text += "\n---\nAudit powered by BUB YouTube Writer\nFix what this found: youtube.bubwriter.com/pricing\n";

  return text;
}

export default function AuditResults({ audit, wordCount, estimatedMinutes }: AuditResultsProps) {
  const [copied, setCopied] = useState(false);

  const lowCategories = audit.categories.filter((c) => c.score <= 3).length;

  const handleCopy = async () => {
    const text = buildCopyText(audit, wordCount, estimatedMinutes);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      {/* Verdict */}
      <div className="text-center mb-10">
        <p className="font-sans font-semibold text-xs text-amber tracking-[0.18em] uppercase mb-5">
          Your Audit Results
        </p>

        <div
          className={`inline-block px-6 py-3 rounded-xl border text-xl font-serif font-bold mb-4 ${verdictColor(audit.verdict)}`}
        >
          {audit.verdict}
        </div>

        <p className="font-serif text-3xl text-text-bright mb-2">
          {audit.total_score}
          <span className="text-text-muted">/45</span>
        </p>

        <p className="text-sm text-text-dim">
          {wordCount.toLocaleString()} words &middot; ~{estimatedMinutes} min at 150 WPM
        </p>
      </div>

      {/* Category Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {audit.categories.map((cat) => (
          <CategoryCard
            key={cat.name}
            name={cat.name}
            score={cat.score}
            explanation={cat.explanation}
            fix={cat.fix}
          />
        ))}
      </div>

      {/* Priority Fixes */}
      <div className="bg-bg-card border border-border rounded-xl p-6 mb-8">
        <h3 className="font-serif text-xl text-text-bright mb-4">Top 3 Priority Fixes</h3>
        <ol className="space-y-4">
          {audit.priority_fixes.map((pf) => (
            <li key={pf.rank} className="flex gap-3">
              <span className="font-mono text-amber font-bold text-sm mt-0.5">{pf.rank}.</span>
              <div>
                <span className="font-semibold text-text-bright text-sm">{pf.category}: </span>
                <span className="text-sm text-text-primary leading-relaxed">{pf.fix}</span>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Copy Results */}
      <div className="flex justify-center mb-10">
        <button
          onClick={handleCopy}
          className="px-6 py-3 border border-border rounded-lg text-sm text-text-primary hover:border-amber hover:text-amber transition-colors cursor-pointer bg-transparent"
        >
          {copied ? "Copied!" : "Copy Results"}
        </button>
      </div>

      {/* CTA */}
      <div className="bg-bg-card border border-amber-glow-strong rounded-xl p-8 text-center">
        <p className="text-text-primary text-base mb-2 leading-relaxed">
          Your audit found{" "}
          <span className="text-amber font-semibold">{lowCategories} categor{lowCategories === 1 ? "y" : "ies"}</span>{" "}
          scoring 3 or below.
        </p>
        <p className="text-text-dim text-sm mb-1 leading-relaxed">
          The Script Studio doesn&apos;t just find the problems. It fixes them.
        </p>
        <p className="text-text-dim text-sm mb-6 leading-relaxed">
          AI-powered hook generation, retention engineering, and a full pre-production pipeline. Starting at $29/mo.
        </p>

        <a
          href="/pricing"
          className="inline-block bg-amber text-bg px-8 py-3.5 rounded-md font-bold text-base transition-all hover:bg-amber-bright no-underline"
        >
          Fix My Scripts &rarr;
        </a>

        <p className="text-sm text-text-muted mt-4">
          Or{" "}
          <a href="/start" className="text-amber hover:text-amber-bright underline">
            let us write it for you
          </a>
        </p>
      </div>
    </div>
  );
}
