'use client';

import { useRef } from 'react';
import { useProjectData, SaveIndicator } from '@/lib/use-project-data';
import { useRegisterPageContext } from '@/contexts/PageContextProvider';

interface ChecklistData {
  items: Record<string, boolean>;
}

const DEFAULTS: ChecklistData = { items: {} };

const SECTIONS = [
  {
    title: 'Before Recording',
    items: [
      { key: 'script_exported', label: 'Script exported for voiceover (ElevenLabs or manual recording)' },
      { key: 'beat_sheet_reviewed', label: 'Beat sheet reviewed and visual assets gathered' },
    ],
  },
  {
    title: 'Before Upload',
    items: [
      { key: 'voiceover_finalized', label: 'Voiceover audio finalized' },
      { key: 'thumbnail_designed', label: 'Thumbnail designed and exported (1280x720)' },
      { key: 'title_finalized', label: 'Title finalized (under 60 characters)' },
      { key: 'description_written', label: 'Description written' },
    ],
  },
];

const ALL_ITEMS = SECTIONS.flatMap((s) => s.items);
const TOTAL = ALL_ITEMS.length;

export default function UploadChecklist() {
  const { data, setData, saveStatus } = useProjectData<ChecklistData>('upload_checklist', DEFAULTS);

  const checked = ALL_ITEMS.filter((item) => data.items?.[item.key]).length;
  const allDone = checked === TOTAL;

  function toggle(key: string) {
    setData((prev) => ({ items: { ...prev.items, [key]: !prev.items?.[key] } }));
  }

  const wrapperRef = useRef<HTMLDivElement>(null);
  useRegisterPageContext('upload_checklist', 'Upload Checklist', () => {
    return `Tool: Upload Checklist\nProgress: ${checked}/${TOTAL}\nReady: ${allDone ? 'Yes' : 'No'}`;
  }, wrapperRef);

  return (
    <div ref={wrapperRef} className="space-y-5">
      <div className="flex items-center gap-3">
        <div>
          <h2 className="font-serif text-[22px] text-text-bright">Upload Checklist</h2>
          <p className="text-text-dim text-[13px] mt-1">Don&apos;t publish until everything&apos;s checked.</p>
        </div>
        <SaveIndicator status={saveStatus} />
        <span className="text-[12px] text-text-muted ml-auto">{checked} / {TOTAL}</span>
      </div>

      {allDone && (
        <div className="bg-green/5 border border-green/20 rounded-xl px-5 py-3 text-center text-[14px] text-green font-medium">
          Ready to publish!
        </div>
      )}

      {SECTIONS.map((section) => (
        <div key={section.title} className="bg-bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border/50">
            <h3 className="text-[14px] font-medium text-text-bright">{section.title}</h3>
          </div>
          <div className="divide-y divide-border/30">
            {section.items.map((item) => (
              <label key={item.key} className="flex items-center gap-4 px-5 py-3 cursor-pointer hover:bg-bg-card-hover/50 transition-colors">
                <div className="relative shrink-0">
                  <input type="checkbox" checked={!!data.items?.[item.key]} onChange={() => toggle(item.key)} className="sr-only" />
                  <div className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${
                    data.items?.[item.key] ? 'bg-green border-green' : 'border-border-light bg-bg-elevated'
                  }`}>
                    {data.items?.[item.key] && (
                      <svg className="w-3.5 h-3.5 text-bg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className={`text-[13px] ${data.items?.[item.key] ? 'text-text-dim line-through' : 'text-text-primary'}`}>{item.label}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
