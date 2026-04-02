'use client';

import { useState, useEffect, useRef } from 'react';
import { useProject } from '@/lib/project-context';
import { loadProjectBundle } from '@/lib/project-bundle';
import { useProjectData, SaveIndicator } from '@/lib/use-project-data';
import { useRegisterPageContext } from '@/contexts/PageContextProvider';
import { notifyCreditChange } from '@/components/app/CreditHealthBar';

interface Beat {
  beat_number: number;
  script_excerpt: string;
  word_range: string;
  word_count: number;
  visual_description: string;
  visual_type: string;
  image_prompt: string;
  slide_note: string;
}

interface Metadata {
  total_words: number;
  wpm: number;
  words_per_beat: number;
  beat_count: number;
  estimated_duration: string;
}

interface BeatData {
  style_anchor: string;
  beats: Beat[];
  metadata?: Metadata;
}

const DEFAULTS: BeatData = { style_anchor: '', beats: [] };

const TYPE_LABELS: Record<string, string> = {
  literal_human: 'Literal',
  metaphorical: 'Metaphorical',
  b_roll: 'B-Roll',
  pattern_interrupt: 'Pattern Interrupt',
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
  const [wpm, setWpm] = useState(140);

  useEffect(() => {
    if (!currentProject?.id) return;
    loadProjectBundle(currentProject.id).then((bundle) => {
      const ws = bundle.write as { script_draft?: string; pacing_wpm?: number } | undefined;
      if (ws?.script_draft) setScriptText(ws.script_draft);
      if (ws?.pacing_wpm) setWpm(ws.pacing_wpm);
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
        body: JSON.stringify({ script: scriptText, wpm }),
      });
      const result = await res.json();
      if (result.beats) {
        setData({ style_anchor: result.style_anchor || '', beats: result.beats, metadata: result.metadata });
        notifyCreditChange();
      } else {
        setError(result.error || 'Generation failed.');
      }
    } catch { setError('Connection error.'); }
    setLoading(false);
  }

  function getAllPrompts(): string {
    return data.beats.map((b, i) => `${i + 1}. ${b.slide_note || `Beat ${b.beat_number}`}\n${b.image_prompt}`).join('\n\n');
  }

  function getGammaMarkdown(): string {
    return `# Video Beat Sheet\n\nStyle: ${data.style_anchor}\n\n` +
      data.beats.map((b) =>
        `## Beat ${b.beat_number} — ${b.slide_note || 'Beat'}\n> "${b.script_excerpt}"\n\n- **Type:** ${TYPE_LABELS[b.visual_type] || b.visual_type}\n- **Image Prompt:** ${b.image_prompt}\n- **Note:** ${b.slide_note}`
      ).join('\n\n');
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

  const meta = data.metadata;

  return (
    <div ref={wrapperRef} className="space-y-5">
      <div className="flex items-center gap-3">
        <div>
          <h2 className="font-serif text-[22px] text-text-bright">Video Beat Sheet</h2>
          <p className="text-text-dim text-[13px] mt-1">AI generates a visual production beat sheet with image prompts for each section of your script.</p>
        </div>
        <SaveIndicator status={saveStatus} />
      </div>

      <button onClick={handleGenerate} disabled={!scriptText.trim() || loading} className="flex items-center gap-2 px-5 py-2.5 bg-amber text-bg text-[14px] font-medium rounded-xl border-none cursor-pointer transition-all hover:bg-amber-bright hover:text-bg disabled:opacity-50 disabled:cursor-not-allowed">
        {loading ? 'Generating...' : 'Generate Beat Sheet'} <span className="text-[12px] opacity-70">(2 credits)</span>
      </button>

      {error && <div className="text-[13px] text-red bg-red/5 border border-red/20 rounded-lg px-4 py-3">{error}</div>}

      {data.beats.length > 0 && (
        <div className="space-y-4">
          {/* Metadata summary */}
          {meta && (
            <div className="text-[13px] text-text-dim">
              <span className="text-text-bright font-medium">{meta.beat_count} beats</span>
              {' · '}
              <span>{meta.total_words.toLocaleString()} words</span>
              {' · '}
              <span>~{meta.estimated_duration} at {meta.wpm} WPM</span>
            </div>
          )}

          {data.beats.map((beat) => (
            <div key={beat.beat_number} className="bg-bg-card border border-border rounded-xl p-5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] text-text-bright font-medium">Beat {beat.beat_number}</span>
                  <span className="text-[11px] text-text-muted bg-bg-elevated px-2 py-0.5 rounded">{beat.word_count} words</span>
                </div>
                <span className="text-[11px] text-amber bg-amber/10 px-2 py-0.5 rounded">{TYPE_LABELS[beat.visual_type] || beat.visual_type}</span>
              </div>
              {beat.script_excerpt && (
                <p className="text-[12px] text-text-muted italic leading-relaxed">&ldquo;{beat.script_excerpt}&rdquo;</p>
              )}
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
