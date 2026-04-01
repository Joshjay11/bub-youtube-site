'use client';

import { useEffect, useRef, useState } from 'react';
import PacingCalculator from '@/components/app/PacingCalculator';
import ScriptCanvas from '@/components/app/ScriptCanvas';
import DualModelWriter from '@/components/app/DualModelWriter';
import UpstreamContext from '@/components/app/UpstreamContext';
import RunningBrief from '@/components/app/RunningBrief';
import { useProject } from '@/lib/project-context';
import { loadProjectBundle } from '@/lib/project-bundle';
import ResetSectionButton from '@/components/app/ResetSectionButton';

const STYLES = [
  { value: 'tutorial', label: 'Tutorial', desc: 'Step-by-step how-to' },
  { value: 'explainer', label: 'Explainer', desc: 'Breaking down a concept' },
  { value: 'story', label: 'Story', desc: 'Narrative-driven' },
  { value: 'commentary', label: 'Commentary', desc: 'Thesis with evidence' },
  { value: 'listicle', label: 'Listicle', desc: 'Numbered items' },
] as const;

export default function WritePage() {
  const { currentProject } = useProject();
  const [pacingSettings, setPacingSettings] = useState({ targetMinutes: 12, paceLabel: 'conversational', wpm: 140 });
  const [videoStyle, setVideoStyle] = useState('commentary');
  const [styleLoaded, setStyleLoaded] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setStyleLoaded(false);

    if (!currentProject?.id) {
      setVideoStyle('commentary');
      return;
    }

    loadProjectBundle(currentProject.id)
      .then((bundle) => {
        const write = bundle.write as { video_style?: string } | undefined;
        const savedStyle = write?.video_style;
        const isValid = STYLES.some((s) => s.value === savedStyle);
        setVideoStyle(isValid ? (savedStyle as string) : 'commentary');
      })
      .catch(() => {
        setVideoStyle('commentary');
      })
      .finally(() => {
        setStyleLoaded(true);
      });
  }, [currentProject?.id]);

  useEffect(() => {
    if (!currentProject?.id || !styleLoaded) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        const getRes = await fetch(`/api/projects/data?projectId=${currentProject.id}&toolKey=write`);
        const getJson = await getRes.json();
        const currentWriteData = (getJson?.data && typeof getJson.data === 'object') ? getJson.data : {};

        await fetch('/api/projects/data', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: currentProject.id,
            toolKey: 'write',
            data: {
              ...currentWriteData,
              video_style: videoStyle,
            },
          }),
        });
      } catch {
        // Non-blocking save; style still stays selected in UI.
      }
    }, 1000);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [currentProject?.id, styleLoaded, videoStyle]);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-serif text-[32px] text-text-bright">Write</h1>
        <ResetSectionButton toolKeys={['write']} />
      </div>
      <p className="text-text-dim text-[15px] mb-8">
        Set your constraints, pick your video style, generate your script from AI writers, then edit.
      </p>

      <UpstreamContext section="write" />

      <div className="space-y-12">
        <RunningBrief />
        <hr className="rule" style={{ margin: '0' }} />
        <PacingCalculator onSettingsChange={setPacingSettings} />

        {/* Video Style selector */}
        <div className="bg-bg-card border border-border rounded-xl p-4">
          <label className="block text-[13px] text-text-dim mb-2">Video Style</label>
          <div className="flex flex-wrap gap-2">
            {STYLES.map((s) => (
              <button
                key={s.value}
                onClick={() => setVideoStyle(s.value)}
                className={`px-3 py-2 rounded-lg text-[14px] font-medium transition-all ${
                  videoStyle === s.value
                    ? 'bg-amber text-bg'
                    : 'bg-bg-elevated text-text-muted hover:text-text-dim hover:bg-bg-card-hover'
                }`}
                title={s.desc}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <hr className="rule" style={{ margin: '0' }} />
        <ScriptCanvas />
        <hr className="rule" style={{ margin: '0' }} />
        <DualModelWriter
          targetMinutes={pacingSettings.targetMinutes}
          paceLabel={pacingSettings.paceLabel}
          wpm={pacingSettings.wpm}
          videoStyle={videoStyle}
        />
      </div>
    </div>
  );
}
