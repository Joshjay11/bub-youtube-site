'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useProject } from '@/lib/project-context';
import { loadProjectBundle } from '@/lib/project-bundle';
import EditorsTable from '@/components/app/EditorsTable';
import CompressionCheck from '@/components/app/CompressionCheck';
import QualityScorecard from '@/components/app/QualityScorecard';
import UpstreamContext from '@/components/app/UpstreamContext';
import RunningBrief from '@/components/app/RunningBrief';

export default function RefinePage() {
  const { currentProject } = useProject();
  const [hasScript, setHasScript] = useState<boolean | null>(null);

  useEffect(() => {
    if (!currentProject?.id) { setHasScript(false); return; }
    loadProjectBundle(currentProject.id).then((bundle) => {
      const ws = bundle.write as { script_draft?: string } | undefined;
      setHasScript(!!(ws?.script_draft?.trim()));
    }).catch(() => setHasScript(false));
  }, [currentProject?.id]);

  if (hasScript === null) {
    return <div className="pt-20 text-center text-text-muted">Loading...</div>;
  }

  return (
    <div>
      <h1 className="font-serif text-[32px] text-text-bright mb-2">Refine</h1>
      <p className="text-text-dim text-[15px] mb-8">
        Polish your script before recording. Run it through editorial analysis, compression, and quality scoring.
      </p>

      <UpstreamContext section="write" />

      {!hasScript ? (
        <div className="bg-bg-card border border-border rounded-xl p-10 text-center">
          <p className="text-text-muted text-[14px] mb-3">No script draft found.</p>
          <Link href="/app/write" className="text-amber hover:text-amber-bright transition-colors text-[14px]">
            Generate your script on the Write page first →
          </Link>
        </div>
      ) : (
        <div className="space-y-12">
          <EditorsTable />
          <hr className="rule" style={{ margin: '0' }} />
          <CompressionCheck />
          <hr className="rule" style={{ margin: '0' }} />
          <QualityScorecard />
          <hr className="rule" style={{ margin: '0' }} />
          <RunningBrief />
        </div>
      )}
    </div>
  );
}
