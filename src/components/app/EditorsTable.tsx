'use client';

import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { useProject } from '@/lib/project-context';
import { loadProjectBundle } from '@/lib/project-bundle';
import { useProjectData, SaveIndicator } from '@/lib/use-project-data';
import { useRegisterPageContext } from '@/contexts/PageContextProvider';
import { notifyCreditChange } from '@/components/app/CreditHealthBar';

interface Issue {
  type: 'hemingway' | 'asimov' | 'bukowski' | 'ai-tell';
  original: string;
  suggestion: string;
  reason: string;
}

interface EditorResult {
  summary: string;
  issues: Issue[];
  edited_text: string;
  stats: {
    words_original: number;
    words_edited: number;
    words_cut: number;
    cut_percentage: number;
    ai_tells_found: number;
    readability_grade: string;
  };
}

interface EditorsData {
  result: EditorResult | null;
  acceptedEdits: boolean;
}

const DEFAULTS: EditorsData = { result: null, acceptedEdits: false };

const ISSUE_BORDER_COLORS: Record<string, string> = {
  adverb: '#D4A574', passive: '#D4726A', bloat: '#A89080', ai_tell: '#E86A5E',
  pretentious: '#A882C4', redundant: '#D4A574', weak_verb: '#D4726A',
  filler: '#A89080', jargon: '#D4A574', long_sentence: '#6AAF8D',
  hemingway: '#D4A574', asimov: '#6AAF8D', bukowski: '#A89080', 'ai-tell': '#E86A5E',
};

const EDITOR_EMOJI: Record<string, string> = {
  hemingway: '🧊', asimov: '🔬', bukowski: '🔪',
};

const EDITOR_ACTIVE_COLORS: Record<string, string> = {
  all: 'bg-[#D4726A] text-white',
  hemingway: 'bg-[#D4A574] text-bg',
  asimov: 'bg-[#6AAF8D] text-bg',
  bukowski: 'bg-[#A89080] text-bg',
};

export default function EditorsTable() {
  const { currentProject } = useProject();
  const { data, setData, saveStatus } = useProjectData<EditorsData>('editors_table', DEFAULTS);

  const [scriptText, setScriptText] = useState('');
  const [editor, setEditor] = useState<'all' | 'hemingway' | 'asimov' | 'bukowski'>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [view, setView] = useState<'summary' | 'issues' | 'edited'>('summary');
  const [copied, setCopied] = useState(false);
  const [editedViewMode, setEditedViewMode] = useState<'preview' | 'raw'>('preview');

  // Load script from Write page
  useEffect(() => {
    if (!currentProject?.id) return;
    loadProjectBundle(currentProject.id).then((bundle) => {
      const ws = bundle.write as { script_draft?: string } | undefined;
      if (ws?.script_draft) setScriptText(ws.script_draft);
    }).catch(() => {});
  }, [currentProject?.id]);

  async function handleRun() {
    if (!scriptText.trim() || loading) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/ai/editors-table', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: scriptText.trim(), editor }),
      });

      const result = await res.json();
      if (result.result) {
        setData({ result: result.result, acceptedEdits: false });
        setView('summary');
        notifyCreditChange();
      } else {
        setError(result.error || 'Analysis failed.');
      }
    } catch {
      setError('Connection error.');
    }
    setLoading(false);
  }

  function handleAcceptEdits() {
    if (!data.result?.edited_text || !currentProject?.id) return;
    // Write edited text back to the write project data
    fetch('/api/projects/data', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: currentProject.id,
        toolKey: 'write',
        data: { script_draft: data.result.edited_text, selected_model: 'edited', word_count: data.result.stats.words_edited, draft_a_output: '', draft_b_output: '' },
      }),
    });
    setScriptText(data.result.edited_text);
    setData((prev) => ({ ...prev, acceptedEdits: true }));
  }

  function handleCopyEdited() {
    if (!data.result?.edited_text) return;
    navigator.clipboard.writeText(data.result.edited_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const r = data.result;
  const emDashCount = (scriptText.match(/—/g) || []).length;

  function nukeEmDashes() {
    setScriptText(scriptText.replace(/ — /g, ', ').replace(/—/g, ', '));
  }

  const wrapperRef = useRef<HTMLDivElement>(null);
  useRegisterPageContext('editors_table', "Editor's Table", () => {
    if (!r) return "Tool: Editor's Table\nStatus: Not run yet";
    return `Tool: Editor's Table\nWords cut: ${r.stats.words_cut}\nAI tells found: ${r.stats.ai_tells_found}\nReadability: ${r.stats.readability_grade}\nAccepted edits: ${data.acceptedEdits}`;
  }, wrapperRef);

  return (
    <div ref={wrapperRef} className="space-y-5">
      <div className="flex items-center gap-3">
        <div>
          <h2 className="font-serif text-[24px] text-text-bright">The Editor&apos;s Table</h2>
          <p className="text-text-dim text-[13px] mt-1">Three legendary editors analyze your script for bloat, structural issues, and AI slop.</p>
        </div>
        <SaveIndicator status={saveStatus} />
      </div>

      {!scriptText && (
        <div className="bg-bg-card border border-border rounded-xl p-6 text-center">
          <p className="text-text-muted text-[14px]">No script draft found. <a href="/app/write" className="text-amber hover:text-amber-bright">Generate your script on the Write page first.</a></p>
        </div>
      )}

      {scriptText && (
        <>
          {/* Em Dash Scanner */}
          {emDashCount > 0 && (
            <div className="bg-amber/5 border border-amber/20 rounded-xl px-5 py-3 flex items-center justify-between">
              <span className="text-[13px] text-amber">{emDashCount} em dash{emDashCount !== 1 ? 'es' : ''} detected</span>
              <button onClick={nukeEmDashes} className="text-[12px] text-amber hover:text-amber-bright bg-transparent border border-amber/20 rounded px-3 py-1 cursor-pointer hover:bg-amber/10">
                Nuke All Em Dashes
              </button>
            </div>
          )}

          {/* Editor selector + run */}
          <div className="flex flex-wrap items-center gap-3">
            {(['all', 'hemingway', 'asimov', 'bukowski'] as const).map((e) => (
              <button key={e} onClick={() => setEditor(e)} className={`px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${editor === e ? EDITOR_ACTIVE_COLORS[e] : 'bg-bg-card text-text-dim border border-border hover:border-border-light'}`}>
                {e === 'all' ? 'All Three' : `${EDITOR_EMOJI[e] || ''} ${e.charAt(0).toUpperCase() + e.slice(1)}`}
              </button>
            ))}
            <button
              onClick={handleRun}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 bg-amber text-bg text-[14px] font-medium rounded-xl border-none cursor-pointer transition-all hover:bg-amber-bright hover:text-bg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Analyzing...' : 'Run Analysis'} <span className="text-[12px] opacity-70">(1 credit)</span>
            </button>
          </div>

          {error && <div className="text-[13px] text-red bg-red/5 border border-red/20 rounded-lg px-4 py-3">{error}</div>}

          {/* Results */}
          {r && (
            <div className="space-y-4">
              {/* Stats bar */}
              <div className="bg-bg-card border border-border rounded-xl p-4 flex flex-wrap gap-6">
                <div><div className="text-[18px] font-mono font-bold text-amber">{r.stats.words_cut}</div><div className="text-[11px] text-text-muted">words cut</div></div>
                <div><div className="text-[18px] font-mono font-bold text-red">{r.stats.ai_tells_found}</div><div className="text-[11px] text-text-muted">AI tells</div></div>
                <div><div className="text-[18px] font-mono font-bold text-text-bright">{r.stats.cut_percentage}%</div><div className="text-[11px] text-text-muted">cut</div></div>
                <div><div className="text-[18px] font-mono font-bold text-green">{r.stats.readability_grade}</div><div className="text-[11px] text-text-muted">readability</div></div>
              </div>

              {/* View tabs */}
              <div className="flex gap-2">
                {(['summary', 'issues', 'edited'] as const).map((v) => (
                  <button key={v} onClick={() => setView(v)} className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all ${view === v ? 'bg-amber text-bg' : 'bg-bg-card text-text-dim border border-border'}`}>
                    {v.charAt(0).toUpperCase() + v.slice(1)}
                  </button>
                ))}
              </div>

              {/* Summary */}
              {view === 'summary' && (
                <div className="bg-bg-card border border-border rounded-xl p-5">
                  <p className="text-[14px] text-text-primary leading-relaxed">{r.summary}</p>
                </div>
              )}

              {/* Issues */}
              {view === 'issues' && (
                <div className="space-y-2">
                  {r.issues.map((issue, i) => {
                    const borderColor = ISSUE_BORDER_COLORS[issue.type] || '#4a5168';
                    return (
                      <div key={i} className="bg-bg-card border border-border rounded-xl p-4" style={{ borderLeftWidth: 3, borderLeftColor: borderColor }}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-bg-elevated text-text-dim">
                            {EDITOR_EMOJI[issue.type] || ''} {issue.type.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="text-[13px] text-red/80 line-through mb-1">{issue.original}</div>
                        <div className="text-[13px] text-green mb-1">{issue.suggestion}</div>
                        <div className="text-[12px] text-text-muted">{issue.reason}</div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Edited */}
              {view === 'edited' && r && (() => {
                const editedText = r.edited_text;
                function downloadMd() {
                  const blob = new Blob([editedText], { type: 'text/markdown' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'edited-script.md';
                  a.click();
                  URL.revokeObjectURL(url);
                }

                return (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <button onClick={handleCopyEdited} className="text-[12px] text-text-muted hover:text-text-dim bg-transparent border border-border rounded-lg px-3 py-1.5 cursor-pointer hover:border-border-light">
                        {copied ? 'Copied ✓' : 'Copy Markdown'}
                      </button>
                      <button onClick={downloadMd} className="text-[12px] text-text-muted hover:text-text-dim bg-transparent border border-border rounded-lg px-3 py-1.5 cursor-pointer hover:border-border-light">
                        Download .md
                      </button>
                      {!data.acceptedEdits && (
                        <button onClick={handleAcceptEdits} className="text-[12px] text-amber hover:text-amber-bright bg-transparent border border-amber/20 rounded-lg px-3 py-1.5 cursor-pointer hover:bg-amber/10">
                          Accept Edits → Update Script
                        </button>
                      )}
                      {data.acceptedEdits && (
                        <span className="text-[12px] text-green px-3 py-1.5">Edits accepted ✓</span>
                      )}
                    </div>
                    {/* Preview / Raw toggle */}
                    <div className="flex gap-1">
                      <button onClick={() => setEditedViewMode('preview')} className={`px-3 py-1 rounded text-[12px] font-medium transition-all ${editedViewMode === 'preview' ? 'bg-amber text-bg' : 'bg-bg-card text-text-dim border border-border'}`}>Preview</button>
                      <button onClick={() => setEditedViewMode('raw')} className={`px-3 py-1 rounded text-[12px] font-medium transition-all ${editedViewMode === 'raw' ? 'bg-amber text-bg' : 'bg-bg-card text-text-dim border border-border'}`}>Raw Markdown</button>
                    </div>
                    <div className="bg-bg-card border border-border rounded-xl p-5">
                      {editedViewMode === 'preview' ? (
                        <div className="text-[14px] text-text-primary leading-relaxed prose prose-invert max-w-none">
                          <ReactMarkdown>{editedText}</ReactMarkdown>
                        </div>
                      ) : (
                        <pre className="text-[13px] text-text-primary leading-relaxed whitespace-pre-wrap font-mono">{editedText}</pre>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </>
      )}
    </div>
  );
}
