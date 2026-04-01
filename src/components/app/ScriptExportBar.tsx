'use client';

import { useState, useEffect } from 'react';
import { useProject } from '@/lib/project-context';
import { loadProjectBundle } from '@/lib/project-bundle';

export default function ScriptExportBar() {
  const { currentProject } = useProject();
  const [script, setScript] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!currentProject?.id) return;
    loadProjectBundle(currentProject.id).then((bundle) => {
      const ws = bundle.write as { script_draft?: string } | undefined;
      if (ws?.script_draft) setScript(ws.script_draft);
    }).catch(() => {});
  }, [currentProject?.id]);

  if (!script) return null;

  const wordCount = script.trim().split(/\s+/).length;
  const projectName = currentProject?.title || 'script-draft';

  function handleCopy() {
    navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const blob = new Blob([script], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName.replace(/\s+/g, '-').toLowerCase()}-script.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex items-center gap-4 bg-bg-elevated border border-border/50 rounded-lg px-4 py-2.5 mb-6">
      <span className="text-[12px] text-text-muted font-mono">{wordCount.toLocaleString()} words</span>
      <div className="w-px h-4 bg-border" />
      <button
        onClick={handleCopy}
        className="flex items-center gap-1.5 text-[12px] text-text-muted hover:text-text-dim transition-colors bg-transparent border-none cursor-pointer"
      >
        {copied ? (
          <><svg className="w-3.5 h-3.5 text-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> Copied</>
        ) : (
          <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> Copy Script</>
        )}
      </button>
      <button
        onClick={handleDownload}
        className="flex items-center gap-1.5 text-[12px] text-text-muted hover:text-text-dim transition-colors bg-transparent border-none cursor-pointer"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
        Download .md
      </button>
    </div>
  );
}
