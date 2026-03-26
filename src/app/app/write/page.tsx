'use client';

import PacingCalculator from '@/components/app/PacingCalculator';
import ScriptCanvas from '@/components/app/ScriptCanvas';
import UpstreamContext from '@/components/app/UpstreamContext';
import RunningBrief from '@/components/app/RunningBrief';

export default function WritePage() {
  return (
    <div>
      <h1 className="font-serif text-[32px] text-text-bright mb-2">Write</h1>
      <p className="text-text-dim text-[15px] mb-8">
        Set your constraints with the Pacing Calculator, then write section by section in the Script Canvas.
      </p>

      <UpstreamContext section="write" />

      <div className="space-y-12">
        <RunningBrief />
        <hr className="rule" style={{ margin: '0' }} />
        <PacingCalculator />
        <hr className="rule" style={{ margin: '0' }} />
        <ScriptCanvas />
      </div>
    </div>
  );
}
