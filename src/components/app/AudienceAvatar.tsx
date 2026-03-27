'use client';

import { useRef } from 'react';
import { useProjectData, SaveIndicator } from '@/lib/use-project-data';
import { useRegisterPageContext } from '@/contexts/PageContextProvider';

interface AvatarData {
  idealViewer: string;
  problem: string;
  comingFrom: string;
  skillLevel: string;
  subscribeReason: string;
}

const DEFAULTS: AvatarData = {
  idealViewer: '',
  problem: '',
  comingFrom: '',
  skillLevel: '',
  subscribeReason: '',
};

const FIELDS: { key: keyof AvatarData; label: string; placeholder: string }[] = [
  { key: 'idealViewer', label: 'Who is your ideal viewer for this video?', placeholder: 'e.g. Mid-career professional who uses ChatGPT but only for basic tasks' },
  { key: 'problem', label: 'What problem are they trying to solve RIGHT NOW?', placeholder: "e.g. They got a confusing email from their boss and don't know how to respond" },
  { key: 'comingFrom', label: 'Where are they coming from? (What did they search or what video did they just watch?)', placeholder: "e.g. Searched 'how to respond to passive aggressive email' or came from a productivity tips video" },
  { key: 'skillLevel', label: 'What\'s their skill level with this topic?', placeholder: "e.g. Uses ChatGPT for writing but hasn't thought of using it for understanding other people's writing" },
  { key: 'subscribeReason', label: 'What would make them subscribe after watching?', placeholder: "e.g. Realizing this channel shows practical AI uses they haven't seen elsewhere" },
];

export default function AudienceAvatar() {
  const { data, setData, saveStatus } = useProjectData<AvatarData>('audience_avatar', DEFAULTS);

  function update(key: keyof AvatarData, value: string) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  const filled = FIELDS.filter((f) => (data[f.key] ?? '').trim().length > 0).length;

  const wrapperRef = useRef<HTMLDivElement>(null);
  useRegisterPageContext('audience_avatar', 'Audience Avatar', () => {
    const lines = ['Tool: Audience Avatar'];
    for (const f of FIELDS) {
      const v = (data[f.key] ?? '').trim();
      lines.push(`  ${f.label.split('?')[0]}: ${v || '(empty)'}`);
    }
    return lines.join('\n');
  }, wrapperRef);

  return (
    <div ref={wrapperRef} className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="font-serif text-[24px] text-text-bright">Audience Avatar</h2>
            <p className="text-text-dim text-[13px] mt-1">Who is watching THIS video? Not your channel avatar — this video specifically.</p>
          </div>
          <SaveIndicator status={saveStatus} />
        </div>
        <span className="text-[12px] text-text-muted">{filled}/{FIELDS.length} filled</span>
      </div>

      <div className="bg-bg-card border border-border rounded-xl p-6">
        <div className="space-y-4">
          {FIELDS.map((field) => (
            <div key={field.key}>
              <label className="block text-[14px] text-text-bright mb-2">{field.label}</label>
              <textarea
                value={data[field.key] ?? ''}
                onChange={(e) => update(field.key, e.target.value)}
                placeholder={field.placeholder}
                rows={2}
                className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-3 text-[14px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber/50 focus:ring-1 focus:ring-amber/20 transition-colors resize-y"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
