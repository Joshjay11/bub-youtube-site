'use client';

import ElevenLabsExport from '@/components/app/ElevenLabsExport';
import BeatSheetGenerator from '@/components/app/BeatSheetGenerator';
import UpstreamContext from '@/components/app/UpstreamContext';
import RunningBrief from '@/components/app/RunningBrief';
import ScriptExportBar from '@/components/app/ScriptExportBar';
import ResetSectionButton from '@/components/app/ResetSectionButton';

export default function PostProductionPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-serif text-[32px] text-text-bright">Post-Production</h1>
        <ResetSectionButton toolKeys={['post_production', 'beat_sheet']} />
      </div>
      <p className="text-text-dim text-[15px] mb-8">
        Export your script for voiceover and generate your video beat sheet with image prompts.
      </p>

      <UpstreamContext section="write" />
      <ScriptExportBar />

      <div className="space-y-12">
        <ElevenLabsExport />
        <hr className="rule" style={{ margin: '0' }} />
        <BeatSheetGenerator />
        <hr className="rule" style={{ margin: '0' }} />
        <RunningBrief />
      </div>
    </div>
  );
}
