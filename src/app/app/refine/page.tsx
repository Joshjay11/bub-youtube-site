'use client';

import EditorsTable from '@/components/app/EditorsTable';
import UpstreamContext from '@/components/app/UpstreamContext';
import RunningBrief from '@/components/app/RunningBrief';

export default function RefinePage() {
  return (
    <div>
      <h1 className="font-serif text-[32px] text-text-bright mb-2">Refine</h1>
      <p className="text-text-dim text-[15px] mb-8">
        Polish your script before recording. Run it through the Editor&apos;s Table to cut bloat, fix structure, and remove AI tells.
      </p>

      <UpstreamContext section="write" />

      <div className="space-y-12">
        <EditorsTable />
        <hr className="rule" style={{ margin: '0' }} />
        <RunningBrief />
      </div>
    </div>
  );
}
