'use client';

import { useState, useRef } from 'react';
import { useProject } from '@/lib/project-context';
import { useProjectData, SaveIndicator } from '@/lib/use-project-data';
import { useRegisterPageContext } from '@/contexts/PageContextProvider';
import { notifyCreditChange } from '@/components/app/CreditHealthBar';
import SendToTastemakerButton from '@/components/app/SendToTastemakerButton';

interface WriterData {
  script_draft: string;
  selected_model: string;
  word_count: number;
  draft_a_output: string;
  draft_b_output: string;
  draft_c_output: string | null;
}

const DEFAULTS: WriterData = { script_draft: '', selected_model: '', word_count: 0, draft_a_output: '', draft_b_output: '', draft_c_output: null };

const MODEL_KEYS = ['sonnet', 'minimax', 'grok'] as const;
const WRITER_LABELS = ['Writer A', 'Writer B', 'Writer C'];
const WRITER_SUBTITLES = [
  'More expansive - detailed, thorough drafts',
  'Tighter and punchier - leaner drafts',
  'Compressed and fast - high-energy delivery',
];

function CopyBtn({ text }: { text: string }) {
  const [c, setC] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setC(true); setTimeout(() => setC(false), 2000); }}
      className="p-1.5 text-text-muted hover:text-text-dim transition-colors bg-transparent border-none cursor-pointer"
      title="Copy to clipboard"
    >
      {c ? (
        <svg className="w-4 h-4 text-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
      )}
    </button>
  );
}

interface DualModelWriterProps {
  targetMinutes?: number;
  paceLabel?: string;
  wpm?: number;
  videoStyle?: string;
}

export default function DualModelWriter({ targetMinutes = 12, paceLabel = 'conversational', wpm = 140, videoStyle = 'commentary' }: DualModelWriterProps) {
  const { currentProject } = useProject();
  const { data, setData, saveStatus } = useProjectData<WriterData>('write', DEFAULTS);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [drafts, setDrafts] = useState<string[]>([data.draft_a_output || '', data.draft_b_output || '', data.draft_c_output ?? '']);
  const [wordCounts, setWordCounts] = useState<number[]>([0, 0, 0]);
  const [copied, setCopied] = useState(false);

  // Conditional Writer C
  const showWriterC = targetMinutes === 5 || (targetMinutes <= 10 && paceLabel === 'energetic');
  const writerCount = showWriterC ? 3 : 2;
  const creditCost = writerCount * 2; // 2 passes per writer
  const targetWords = targetMinutes * wpm;
  const [progress, setProgress] = useState<string[]>(['', '', '']);

  async function consumeSSE(index: number, model: string): Promise<{ script: string; wordCount: number }> {
    const res = await fetch('/api/ai/generate-script', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: currentProject!.id, model, targetWords, style: videoStyle, targetMinutes, wpm }),
    });

    const reader = res.body?.getReader();
    if (!reader) throw new Error('No response stream');

    const decoder = new TextDecoder();
    let buffer = '';
    let result = { script: '', wordCount: 0 };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const event = JSON.parse(line.slice(6));
          if (event.type === 'progress') {
            setProgress((prev) => { const n = [...prev]; n[index] = event.message; return n; });
          } else if (event.type === 'complete') {
            result = { script: event.script, wordCount: event.wordCount };
            setProgress((prev) => { const n = [...prev]; n[index] = `Complete ✓ (${event.wordCount} words)`; return n; });
          } else if (event.type === 'error') {
            throw new Error(event.error);
          }
        } catch (e) {
          if (e instanceof SyntaxError) continue; // skip malformed JSON
          throw e;
        }
      }
    }

    return result;
  }

  async function handleGenerate() {
    if (!currentProject?.id || loading) return;
    setLoading(true);
    setError('');
    setDrafts(['', '', '']);
    setWordCounts([0, 0, 0]);
    setProgress(['Starting...', 'Starting...', showWriterC ? 'Starting...' : '']);

    const models = showWriterC ? MODEL_KEYS : MODEL_KEYS.slice(0, 2);

    try {
      const results = await Promise.allSettled(
        models.map((m, i) => consumeSSE(i, m))
      );

      const newDrafts = ['', '', ''];
      const newWc = [0, 0, 0];
      results.forEach((res, i) => {
        if (res.status === 'fulfilled') {
          newDrafts[i] = res.value.script;
          newWc[i] = res.value.wordCount;
        } else {
          newDrafts[i] = 'Generation failed. ' + (res.reason?.message || res.reason);
        }
      });

      setDrafts(newDrafts);
      setWordCounts(newWc);
      notifyCreditChange();
    } catch {
      setError('Connection error. Please try again.');
    }
    setLoading(false);
  }

  function keepDraft(index: number) {
    const script = drafts[index];
    const model = MODEL_KEYS[index];
    const wc = script.trim().split(/\s+/).length;
    setData({
      script_draft: script,
      selected_model: model,
      word_count: wc,
      draft_a_output: drafts[0],
      draft_b_output: drafts[1],
      draft_c_output: showWriterC ? drafts[2] : null,
    });

    // Log model preference (fire-and-forget)
    if (currentProject?.id) {
      const allModels = showWriterC ? MODEL_KEYS : MODEL_KEYS.slice(0, 2);
      const rejected = allModels.filter((m) => m !== model).join(',');
      fetch('/api/projects/model-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProject.id,
          chosenModel: model,
          rejectedModel: rejected,
        }),
      }).catch(() => {});
    }
  }

  function handleCopyDraft() {
    navigator.clipboard.writeText(data.script_draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const wrapperRef = useRef<HTMLDivElement>(null);
  useRegisterPageContext('dual_model_writer', 'Script Generator', () => {
    if (!data.script_draft) return 'Tool: Script Generator\nStatus: No script generated yet';
    return `Tool: Script Generator\nWord count: ${data.word_count}\nFirst 200 words: ${data.script_draft.slice(0, 800)}`;
  }, wrapperRef);

  const hasDrafts = drafts.some((d) => d.length > 0);

  return (
    <div ref={wrapperRef} className="space-y-6">
      <div className="flex items-center gap-3">
        <div>
          <h2 className="font-serif text-[24px] text-text-bright">Generate Full Script</h2>
          <p className="text-text-dim text-[13px] mt-1">
            Your outline and research generate a full spoken-word script. You&apos;ll get drafts from {writerCount} AI writers — pick the one that sounds more like you.
          </p>
        </div>
        <SaveIndicator status={saveStatus} />
      </div>

      <button
        onClick={handleGenerate}
        disabled={!currentProject?.id || loading}
        className="flex items-center gap-2 px-5 py-2.5 bg-amber text-bg text-[14px] font-medium rounded-xl border-none cursor-pointer transition-all hover:bg-amber-bright hover:text-bg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading && (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {loading ? `Generating from ${writerCount} models...` : 'Generate Script'} <span className="text-[12px] opacity-70">({creditCost} credits)</span>
      </button>

      {/* Progress indicators */}
      {loading && (
        <div className="bg-bg-card border border-border rounded-xl p-4 space-y-2">
          {WRITER_LABELS.slice(0, writerCount).map((label, i) => (
            <div key={i} className="flex items-center gap-3 text-[13px]">
              <span className="text-text-bright font-medium w-16 shrink-0">{label}</span>
              <span className={`${progress[i]?.includes('Complete') ? 'text-green' : 'text-amber'}`}>
                {progress[i] ? (
                  <>
                    {!progress[i].includes('Complete') && <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber animate-pulse mr-1.5" />}
                    {progress[i]}
                  </>
                ) : 'Waiting...'}
              </span>
            </div>
          ))}
        </div>
      )}

      {error && <div className="text-[13px] text-red bg-red/5 border border-red/20 rounded-lg px-4 py-3">{error}</div>}

      {hasDrafts && (
        <div className={`grid grid-cols-1 ${showWriterC ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-4`}>
          {drafts.slice(0, writerCount).map((draft, i) => {
            const isKept = data.selected_model === MODEL_KEYS[i];
            return (
              <div key={i} className={`bg-bg-card border rounded-xl overflow-hidden ${isKept ? 'border-amber/40' : 'border-border'}`}>
                <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                  <div>
                    <div className="text-[14px] text-text-bright font-medium">{WRITER_LABELS[i]}</div>
                    <div className="text-[11px] text-text-muted mt-0.5">{WRITER_SUBTITLES[i]}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {wordCounts[i] > 0 && <span className="text-[12px] text-text-muted font-mono">{wordCounts[i]} words</span>}
                    <button
                      onClick={() => keepDraft(i)}
                      className={`text-[12px] font-medium px-2.5 py-1 rounded transition-all ${
                        isKept
                          ? 'bg-amber/20 text-amber border border-amber/30'
                          : 'text-text-muted hover:text-amber border border-border hover:border-amber/30'
                      }`}
                    >
                      {isKept ? 'Kept ✓' : 'Keep This'}
                    </button>
                  </div>
                </div>
                <div className="px-5 py-4 max-h-[400px] overflow-y-auto">
                  <div className="text-[13px] text-text-primary leading-relaxed whitespace-pre-wrap">{draft}</div>
                </div>
                <div className="px-5 py-2 border-t border-border/50 flex justify-end">
                  <CopyBtn text={draft} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {data.script_draft && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[16px] text-text-bright font-medium">Your Script</h3>
              <span className="text-[12px] text-text-muted">{data.word_count} words (~{Math.round(data.word_count / wpm)} min at {wpm} WPM)</span>
            </div>
            <div className="flex items-center gap-2">
              <SendToTastemakerButton
                content={data.script_draft}
                title={`${currentProject?.title ?? 'Untitled'} - Script`}
                sourceLabel="Script"
                disabled={data.word_count < 200}
              />
              <button onClick={handleCopyDraft} className="flex items-center gap-1.5 text-[12px] text-text-muted hover:text-text-dim transition-colors bg-transparent border border-border rounded-lg px-3 py-1.5 cursor-pointer hover:border-border-light">
                {copied ? 'Copied ✓' : 'Copy Script'}
              </button>
            </div>
          </div>
          <textarea
            value={data.script_draft}
            onChange={(e) => {
              const wc = e.target.value.trim().split(/\s+/).length;
              setData((prev) => ({ ...prev, script_draft: e.target.value, word_count: wc }));
            }}
            rows={20}
            className="w-full bg-bg-card border border-border rounded-xl px-5 py-4 text-[14px] text-text-primary focus:outline-none focus:border-amber/50 focus:ring-1 focus:ring-amber/20 transition-colors resize-y font-mono leading-relaxed"
          />
        </div>
      )}
    </div>
  );
}
