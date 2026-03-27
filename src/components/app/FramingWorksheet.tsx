'use client';

import { useEffect, useCallback } from 'react';
import { useProjectData, SaveIndicator } from '@/lib/use-project-data';
import { usePageContext } from '@/contexts/PageContextProvider';

interface FramingData {
  oneSentence: string;
  rememberOneWeek: string;
  contrarianAngle: string;
  emotionalHook: string;
  thirtySeconds: string;
}

const DEFAULTS: FramingData = {
  oneSentence: '',
  rememberOneWeek: '',
  contrarianAngle: '',
  emotionalHook: '',
  thirtySeconds: '',
};

const FIELDS: { key: keyof FramingData; label: string; placeholder: string }[] = [
  { key: 'oneSentence', label: 'What is this video about in ONE sentence?', placeholder: "e.g. Most people use AI to generate content, but its real superpower is helping you understand what other people are saying." },
  { key: 'rememberOneWeek', label: 'What\'s the one thing the viewer should remember a week later?', placeholder: "e.g. AI can decode the subtext in any message — emails, texts, conversations" },
  { key: 'contrarianAngle', label: 'What\'s the contrarian or surprising angle?', placeholder: "e.g. Everyone uses AI to write. Almost nobody uses it to READ." },
  { key: 'emotionalHook', label: 'What\'s the emotional hook?', placeholder: "e.g. The feeling of reading a message 10 times and still not knowing what they meant" },
  { key: 'thirtySeconds', label: 'If the viewer could only watch 30 seconds, what would you say?', placeholder: "This is your hook — write it as if you're saying it out loud to one person" },
];

export default function FramingWorksheet() {
  const { data, setData, saveStatus } = useProjectData<FramingData>('framing_worksheet', DEFAULTS);

  function update(key: keyof FramingData, value: string) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  const filled = FIELDS.filter((f) => (data[f.key] ?? '').trim().length > 0).length;

  const { registerPageContext, unregisterPageContext } = usePageContext();
  const buildCtx = useCallback(() => {
    if (filled === 0) return null;
    const lines = ['Tool: Framing Worksheet'];
    for (const f of FIELDS) {
      const v = (data[f.key] ?? '').trim();
      if (v) lines.push(`  ${f.label.split('?')[0]}: ${v}`);
    }
    return lines.join('\n');
  }, [data, filled]);
  useEffect(() => {
    registerPageContext('framing_worksheet', buildCtx);
    return () => unregisterPageContext('framing_worksheet');
  }, [buildCtx, registerPageContext, unregisterPageContext]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="font-serif text-[24px] text-text-bright">Framing Worksheet</h2>
            <p className="text-text-dim text-[13px] mt-1">Nail your angle before you write a word.</p>
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
                rows={field.key === 'thirtySeconds' ? 4 : 2}
                className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-3 text-[14px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber/50 focus:ring-1 focus:ring-amber/20 transition-colors resize-y"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
