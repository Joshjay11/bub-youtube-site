'use client';

import { useEffect, useState } from 'react';
import ElevenLabsExport from '@/components/app/ElevenLabsExport';
import BeatSheetGenerator from '@/components/app/BeatSheetGenerator';
import UploadChecklist from '@/components/app/UploadChecklist';
import UpstreamContext from '@/components/app/UpstreamContext';
import RunningBrief from '@/components/app/RunningBrief';
import ScriptExportBar from '@/components/app/ScriptExportBar';
import ResetSectionButton from '@/components/app/ResetSectionButton';
import SendToTastemakerButton from '@/components/app/SendToTastemakerButton';
import { useProject } from '@/lib/project-context';
import { loadProjectBundle } from '@/lib/project-bundle';

interface Beat {
  beat_number: number;
  script_excerpt: string;
  visual_description: string;
  image_prompt: string;
  slide_note: string;
}

function serializeBeats(beats: Beat[]): string {
  if (!beats.length) return '';
  return beats
    .map((b) => {
      const parts = [`Beat ${b.beat_number}`];
      if (b.slide_note) parts.push(b.slide_note);
      if (b.visual_description) parts.push(`Visual: ${b.visual_description}`);
      if (b.script_excerpt) parts.push(`Excerpt: ${b.script_excerpt}`);
      if (b.image_prompt) parts.push(`Prompt: ${b.image_prompt}`);
      return parts.join('\n');
    })
    .join('\n\n');
}

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

export default function PostProductionPage() {
  const { currentProject } = useProject();
  const [scriptDraft, setScriptDraft] = useState('');
  const [beatSheetText, setBeatSheetText] = useState('');

  useEffect(() => {
    if (!currentProject?.id) {
      setScriptDraft('');
      setBeatSheetText('');
      return;
    }
    loadProjectBundle(currentProject.id)
      .then((bundle) => {
        const write = bundle.write as { script_draft?: string } | undefined;
        setScriptDraft(write?.script_draft ?? '');
        const beat = bundle.beat_sheet as { beats?: Beat[] } | undefined;
        setBeatSheetText(serializeBeats(beat?.beats ?? []));
      })
      .catch(() => {
        setScriptDraft('');
        setBeatSheetText('');
      });
  }, [currentProject?.id]);

  const projectTitle = currentProject?.title ?? 'Untitled';
  const scriptWordCount = countWords(scriptDraft);
  const beatSheetWordCount = countWords(beatSheetText);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-serif text-[32px] text-text-bright">Post-Production</h1>
        <ResetSectionButton toolKeys={['post_production', 'beat_sheet', 'upload_checklist']} />
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

        <div className="bg-bg-card border border-border rounded-xl p-5 space-y-3">
          <div>
            <h3 className="text-[14px] font-medium text-text-bright">Send to Tastemaker</h3>
            <p className="text-[12px] text-text-dim mt-0.5">
              Feed this project&apos;s script or beat sheet into the Tastemaker as a voice sample.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SendToTastemakerButton
              content={scriptDraft}
              title={`${projectTitle} - Script`}
              sourceLabel="Script"
              disabled={scriptWordCount < 200}
            />
            <SendToTastemakerButton
              content={beatSheetText}
              title={`${projectTitle} - Beat Sheet`}
              sourceLabel="Beat Sheet"
              disabled={beatSheetWordCount < 200}
            />
          </div>
        </div>

        <hr className="rule" style={{ margin: '0' }} />
        <UploadChecklist />
        <hr className="rule" style={{ margin: '0' }} />
        <RunningBrief />
      </div>
    </div>
  );
}
