'use client';

import PacingCalculator from '@/components/app/PacingCalculator';
import ScriptCanvas from '@/components/app/ScriptCanvas';
import DualModelWriter from '@/components/app/DualModelWriter';
import UpstreamContext from '@/components/app/UpstreamContext';
import RunningBrief from '@/components/app/RunningBrief';

export default function WritePage() {
  return (
    <div>
      <h1 className="font-serif text-[32px] text-text-bright mb-2">Write</h1>
      <p className="text-text-dim text-[15px] mb-8">
        Set your constraints, generate your script from two AI writers, then edit in the canvas.
      </p>

      <UpstreamContext section="write" />

      <div className="space-y-12">
        <RunningBrief />
        <hr className="rule" style={{ margin: '0' }} />
        <PacingCalculator />
        <hr className="rule" style={{ margin: '0' }} />
        <ScriptCanvas />
        <hr className="rule" style={{ margin: '0' }} />
        <DualModelWriter />
      </div>
    </div>
  );
}
