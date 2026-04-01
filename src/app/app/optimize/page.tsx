'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import UpstreamContext from '@/components/app/UpstreamContext';
import { useProject } from '@/lib/project-context';
import { loadProjectBundle } from '@/lib/project-bundle';
import RetentionAudit from '@/components/app/RetentionAudit';
import RunningBrief from '@/components/app/RunningBrief';
import ResetSectionButton from '@/components/app/ResetSectionButton';
import ScriptExportBar from '@/components/app/ScriptExportBar';

export default function OptimizePage() {
  const { currentProject } = useProject();
  const [scriptPreview, setScriptPreview] = useState('');

  useEffect(() => {
    if (!currentProject?.id) return;
    loadProjectBundle(currentProject.id).then((bundle) => {
      const ws = bundle.write as { script_draft?: string } | undefined;
      if (ws?.script_draft) setScriptPreview(ws.script_draft.slice(0, 300));
    }).catch(() => {});
  }, [currentProject?.id]);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-serif text-[32px] text-text-bright">Optimize</h1>
        <ResetSectionButton toolKeys={['optimize']} />
      </div>
      <p className="text-text-dim text-[15px] mb-8">
        AI-powered retention audit. Checks your script against 10 MUST PASS criteria and tells you exactly what to fix.
      </p>

      <UpstreamContext section="optimize" />
      <ScriptExportBar />

      {scriptPreview && (
        <div className="bg-bg-elevated border border-border/50 rounded-lg px-5 py-3 mb-8">
          <div className="text-[11px] text-text-muted uppercase tracking-wider mb-1">Your script (from Write page)</div>
          <div className="text-[13px] text-text-dim whitespace-pre-wrap">{scriptPreview}...</div>
        </div>
      )}

      <div className="space-y-12">
        <RetentionAudit />

        <hr className="rule" style={{ margin: '0' }} />

        <div>
          <h2 className="font-serif text-[22px] text-text-bright mb-4">Reference</h2>
          <Link
            href="/app/optimize/failure-modes"
            className="block bg-bg-card border border-border rounded-xl p-5 hover:border-amber/30 transition-colors group"
          >
            <h3 className="text-[15px] font-medium text-text-bright group-hover:text-amber transition-colors mb-1">
              15 Retention Failure Modes
            </h3>
            <p className="text-[13px] text-text-dim">
              When a video underperforms, diagnose it here. Each failure mode includes what it looks like, why it kills retention, and a specific fix.
            </p>
          </Link>
        </div>

        <hr className="rule" style={{ margin: '0' }} />
        <RunningBrief />
      </div>
    </div>
  );
}
