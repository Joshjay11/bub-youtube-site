'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useProject } from '@/lib/project-context';
import { loadProjectBundle } from '@/lib/project-bundle';
import EditorsTable from '@/components/app/EditorsTable';
import QualityScore from '@/components/app/QualityScore';
import UpstreamContext from '@/components/app/UpstreamContext';
import RunningBrief from '@/components/app/RunningBrief';
import ResetSectionButton from '@/components/app/ResetSectionButton';
import ScriptExportBar from '@/components/app/ScriptExportBar';

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
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-serif text-[32px] text-text-bright">Refine</h1>
        <ResetSectionButton toolKeys={['editors_table', 'quality_score']} />
      </div>
      <p className="text-text-dim text-[15px] mb-8">
        Polish your script before recording. Run it through editorial analysis and quality scoring.
      </p>

      <UpstreamContext section="write" />
      <ScriptExportBar />

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
          <QualityScore />
          <hr className="rule" style={{ margin: '0' }} />
          <RunningBrief />
        </div>
      )}
    </div>
  );
}
