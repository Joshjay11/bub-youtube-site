'use client';

import { useRef } from 'react';
import AudienceAvatar from '@/components/app/AudienceAvatar';
import TopicResearch from '@/components/app/TopicResearch';
import ResearchKeeper from '@/components/app/ResearchKeeper';
import FramingWorksheet from '@/components/app/FramingWorksheet';
import UpstreamContext from '@/components/app/UpstreamContext';
import RunningBrief from '@/components/app/RunningBrief';
import ResetSectionButton from '@/components/app/ResetSectionButton';

export default function ResearchPage() {
  const appendToKeeperRef = useRef<((text: string) => void) | null>(null);

  function handleKeep(text: string) {
    appendToKeeperRef.current?.(text);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-serif text-[32px] text-text-bright">Research & Pre-Production</h1>
        <ResetSectionButton toolKeys={['audience_avatar', 'competitive_scan', 'framing_worksheet', 'topic_research', 'research_keeper']} />
      </div>
      <p className="text-text-dim text-[15px] mb-8">
        Structured thinking before you write. Fill these out for THIS video — not your channel in general.
      </p>

      <UpstreamContext section="research" />

      <div className="space-y-12">
        <AudienceAvatar />
        <hr className="rule" style={{ margin: '0' }} />
        <TopicResearch onKeep={handleKeep} />
        <ResearchKeeper appendRef={appendToKeeperRef} />
        <hr className="rule" style={{ margin: '0' }} />
        <FramingWorksheet />
        <hr className="rule" style={{ margin: '0' }} />
        <RunningBrief />
      </div>
    </div>
  );
}
