'use client';

import { useState, useEffect } from 'react';
import { useProject } from '@/lib/project-context';
import { type ProjectBundle, loadProjectBundle, compileBrief } from '@/lib/project-bundle';

export default function RunningBrief() {
  const { currentProject } = useProject();
  const [bundle, setBundle] = useState<ProjectBundle | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!currentProject?.id) {
      setBundle(null);
      return;
    }
    loadProjectBundle(currentProject.id).then(setBundle).catch(() => {});
  }, [currentProject?.id]);

  if (!bundle || !currentProject) return null;

  const brief = compileBrief(bundle);
  if (!brief) return null;

  function handleCopy() {
    navigator.clipboard.writeText(brief);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-3 text-left bg-transparent border-none cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <svg
            className={`w-3.5 h-3.5 text-amber transition-transform shrink-0 ${expanded ? 'rotate-90' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-[13px] text-amber font-medium">Running Brief</span>
          <span className="text-[12px] text-text-muted">— compiled from all upstream sections</span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border/50">
          <div className="flex justify-end px-5 pt-3">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-[12px] text-text-muted hover:text-text-dim transition-colors bg-transparent border-none cursor-pointer"
            >
              {copied ? (
                <><svg className="w-3.5 h-3.5 text-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> Copied</>
              ) : (
                <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> Copy Brief</>
              )}
            </button>
          </div>
          <pre className="px-5 pb-5 pt-2 text-[13px] text-text-dim font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto">
            {brief}
          </pre>
        </div>
      )}
    </div>
  );
}
