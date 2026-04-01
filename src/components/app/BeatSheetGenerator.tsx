'use client';

import { useState, useEffect, useRef } from 'react';
import { useProject } from '@/lib/project-context';
import { loadProjectBundle } from '@/lib/project-bundle';
import { useProjectData, SaveIndicator } from '@/lib/use-project-data';
import { useRegisterPageContext } from '@/contexts/PageContextProvider';
import { notifyCreditChange } from '@/components/app/CreditHealthBar';

interface Beat {
  beat_number: number;
  section_name: string;
  timestamp_start: string;
  timestamp_end: string;
  visual_description: string;
  visual_type: string;
  image_prompt: string;
  slide_note: string;
}

interface BeatData {
  style_anchor: string;
  beats: Beat[];
}

const DEFAULTS: BeatData = { style_anchor: '', beats: [] };

const TYPE_LABELS: Record<string, string> = {
  b_roll_image: 'B-Roll Image',
  title_card: 'Title Card',
  screen_recording: 'Screen Recording',
  data_viz: 'Data Viz',
  talking_head: 'Talking Head',
  split_screen: 'Split Screen',
};

function CopyBtn({ text, label }: { text: string; label?: string }) {
  const [c, setC] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setC(true); setTimeout(() => setC(false), 1500); }}
      className="text-[11px] text-text-muted hover:text-amber bg-transparent border border-border rounded px-2 py-1 cursor-pointer hover:border-amber/30 transition-colors">
      {c ? 'Copied ✓' : label || 'Copy'}
    </button>
  );
}

export default function BeatSheetGenerator() {
  const { currentProject } = useProject();
  const { data, setData, saveStatus } = useProjectData<BeatData>('beat_sheet', DEFAULTS);
  const [scriptText, setScriptText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentProject?.id) return;
    loadProjectBundle(currentProject.id).then((bundle) => {
      const ws = bundle.write as { script_draft?: string } | undefined;
      if (ws?.script_draft) setScriptText(ws.script_draft);
    }).catch(() => {});
  }, [currentProject?.id]);

  async function handleGenerate() {
    if (!scriptText.trim() || loading) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/ai/generate-beats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script: scriptText, wpm: 140, total_minutes: 12 }),
      });
      const result = await res.json();
      if (result.beats) {
        setData({ style_anchor: result.style_anchor || '', beats: result.beats });
        notifyCreditChange();
      } else {
        setError(result.error || 'Generation failed.');
      }
    } catch { setError('Connection error.'); }
    setLoading(false);
  }

  function getAllPrompts(): string {
    return data.beats.map((b, i) => `${i + 1}. ${b.section_name}\n${b.image_prompt}`).join('\n\n');
  }

  function getGammaMarkdown(): string {
    return `# Video Beat Sheet\n\nStyle: ${data.style_anchor}\n\n` +
      data.beats.map((b) => `## ${b.section_name} (${b.timestamp_start} - ${b.timestamp_end})\n\n- **Visual:** ${b.visual_description}\n- **Type:** ${TYPE_LABELS[b.visual_type] || b.visual_type}\n- **Image Prompt:** ${b.image_prompt}\n- **Note:** ${b.slide_note}`).join('\n\n');
  }

  function handleDownload() {
    const md = getGammaMarkdown();
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'beat-sheet.md';
    a.click();
    URL.revokeObjectURL(url);
  }

  const wrapperRef = useRef<HTMLDivElement>(null);
  useRegisterPageContext('beat_sheet', 'Beat Sheet Generator', () => {
    return `Tool: Beat Sheet Generator\nBeats: ${data.beats.length}\nStyle: ${data.style_anchor || 'Not generated'}`;
  }, wrapperRef);

  return (
    <div ref={wrapperRef} className="space-y-5">
      <div className="flex items-center gap-3">
        <div>
          <h2 className="font-serif text-[22px] text-text-bright">Video Beat Sheet</h2>
          <p className="text-text-dim text-[13px] mt-1">AI generates a visual production beat sheet with image prompts for each section.</p>
        </div>
        <SaveIndicator status={saveStatus} />
      </div>

      <button onClick={handleGenerate} disabled={!scriptText.trim() || loading} className="flex items-center gap-2 px-5 py-2.5 bg-amber text-bg text-[14px] font-medium rounded-xl border-none cursor-pointer transition-all hover:bg-amber-bright hover:text-bg disabled:opacity-50 disabled:cursor-not-allowed">
        {loading ? 'Generating...' : 'Generate Beat Sheet'} <span className="text-[12px] opacity-70">(1 credit)</span>
      </button>

      {error && <div className="text-[13px] text-red bg-red/5 border border-red/20 rounded-lg px-4 py-3">{error}</div>}

      {data.beats.length > 0 && (
        <div className="space-y-4">
          {data.style_anchor && (
            <div className="text-[12px] text-text-muted">Style anchor: <span className="text-text-dim">{data.style_anchor}</span></div>
          )}

          {data.beats.map((beat) => (
            <div key={beat.beat_number} className="bg-bg-card border border-border rounded-xl p-5 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[14px] text-text-bright font-medium">Beat {beat.beat_number} — {beat.section_name}</span>
                  <span className="text-[12px] text-text-muted ml-2">({beat.timestamp_start} - {beat.timestamp_end})</span>
                </div>
                <span className="text-[11px] text-amber bg-amber/10 px-2 py-0.5 rounded">{TYPE_LABELS[beat.visual_type] || beat.visual_type}</span>
              </div>
              <p className="text-[13px] text-text-dim leading-relaxed">{beat.visual_description}</p>
              <div className="bg-bg-elevated border border-border/50 rounded-lg px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-text-muted uppercase tracking-wider">Image Prompt</span>
                  <CopyBtn text={beat.image_prompt} label="Copy Prompt" />
                </div>
                <p className="text-[12px] text-text-primary font-mono leading-relaxed">{beat.image_prompt}</p>
              </div>
              <div className="text-[12px] text-text-muted"><span className="text-text-dim">Slide note:</span> {beat.slide_note}</div>
            </div>
          ))}

          {/* Export buttons */}
          <div className="flex flex-wrap gap-2">
            <CopyBtn text={getAllPrompts()} label="Copy All Prompts" />
            <button onClick={handleDownload} className="text-[11px] text-text-muted hover:text-text-dim bg-transparent border border-border rounded px-2 py-1 cursor-pointer hover:border-border-light">Download .md</button>
            <CopyBtn text={getGammaMarkdown()} label="Copy for Gamma AI" />
          </div>
        </div>
      )}
    </div>
  );
}
