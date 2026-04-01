'use client';

import { useState, useEffect } from 'react';
import { useProject } from '@/lib/project-context';
import { loadProjectBundle } from '@/lib/project-bundle';
import { scanForSlop, type SlopScanResult } from '@/lib/slop-scanner';

export default function SlopScanner() {
  const { currentProject } = useProject();
  const [result, setResult] = useState<SlopScanResult | null>(null);

  useEffect(() => {
    if (!currentProject?.id) return;
    loadProjectBundle(currentProject.id).then((bundle) => {
      const ws = bundle.write as { script_draft?: string } | undefined;
      if (ws?.script_draft?.trim()) {
        setResult(scanForSlop(ws.script_draft));
      }
    }).catch(() => {});
  }, [currentProject?.id]);

  if (!result) return null;

  const badgeColor = result.verdict === 'clean' ? 'bg-green/10 text-green border-green/20' : result.verdict === 'minor' ? 'bg-amber/10 text-amber border-amber/20' : 'bg-red/10 text-red border-red/20';
  const badgeText = result.verdict === 'clean' ? '✓ Clean' : result.verdict === 'minor' ? 'Minor Issues' : 'Needs Work';

  return (
    <div className="bg-bg-card border border-border rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <h3 className="text-[14px] text-text-bright font-medium">Slop Scanner</h3>
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${badgeColor}`}>{badgeText}</span>
        </div>
        <span className="text-[11px] text-text-muted">Instant • No credit</span>
      </div>

      {result.violations.length === 0 ? (
        <p className="text-[13px] text-green">No AI tells detected. Script looks clean.</p>
      ) : (
        <div className="space-y-1 mt-2">
          {result.violations.map((v, i) => (
            <div key={i} className="flex items-start gap-2 text-[12px]">
              <span className="text-red shrink-0 mt-0.5">•</span>
              <span className="text-text-dim">{v.description} {v.count > 1 && <span className="text-text-muted">(×{v.count})</span>}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
