'use client';

import { useState, useRef } from 'react';
import { useProject } from '@/lib/project-context';
import { useProjectData, SaveIndicator } from '@/lib/use-project-data';
import { useRegisterPageContext } from '@/contexts/PageContextProvider';
import { notifyCreditChange } from '@/components/app/CreditHealthBar';
import HookScorer from '@/components/app/HookScorer';

interface HookDraftData {
  draft: string;
  suggestions: string[];
}

const DEFAULTS: HookDraftData = { draft: '', suggestions: [] };

const HOOK_LABELS = ['Contradiction', 'Story', 'Question', 'Data', 'Stakes'];

interface HookWriterProps {
  onDraftChange?: (draft: string) => void;
}

export default function HookWriter({ onDraftChange }: HookWriterProps) {
  const { currentProject } = useProject();
  const { data, setData, saveStatus } = useProjectData<HookDraftData>('hook_draft', DEFAULTS);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function updateDraft(value: string) {
    setData((prev) => ({ ...prev, draft: value }));
    onDraftChange?.(value);
  }

  async function handleSuggest() {
    if (!currentProject?.id || loading) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/ai/suggest-hooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: currentProject.id }),
      });

      const result = await res.json();

      if (result.hooks) {
        setData((prev) => ({ ...prev, suggestions: result.hooks }));
        notifyCreditChange();
      } else if (result.needsUpgrade) {
        setError('No AI credits remaining. Add your API key in Settings.');
      } else {
        setError(result.error || 'Failed to generate hooks.');
      }
    } catch {
      setError('Connection error. Please try again.');
    }

    setLoading(false);
  }

  function selectHook(text: string) {
    setData((prev) => ({ ...prev, draft: text }));
    onDraftChange?.(text);
  }

  const wrapperRef = useRef<HTMLDivElement>(null);
  useRegisterPageContext('hook_draft', 'Hook Writer', () => {
    const draft = (data.draft ?? '').trim();
    const wordCount = draft ? draft.split(/\s+/).length : 0;
    return `Tool: Hook Writer\nHook draft: ${draft || '(empty)'}\nWord count: ${wordCount}`;
  }, wrapperRef);

  return (
    <div ref={wrapperRef} className="space-y-5">
      <div className="flex items-center gap-3">
        <div>
          <h2 className="font-serif text-[24px] text-text-bright">Write Your Hook</h2>
          <p className="text-text-dim text-[13px] mt-1">Your hook is the first 15–30 seconds. Write it here, then score it below.</p>
        </div>
        <SaveIndicator status={saveStatus} />
      </div>

      {/* Suggest button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSuggest}
          disabled={!currentProject?.id || loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-amber text-bg text-[14px] font-medium rounded-xl border-none cursor-pointer transition-all hover:bg-amber-bright hover:text-bg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading && (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {loading ? 'Generating hooks...' : 'Suggest Hooks'} <span className="text-[12px] opacity-70">(1 credit)</span>
        </button>
        {!currentProject && (
          <span className="text-[12px] text-text-muted">Select a project first</span>
        )}
      </div>

      {error && (
        <div className="text-[13px] text-red bg-red/5 border border-red/20 rounded-lg px-4 py-3">{error}</div>
      )}

      {/* Suggestions */}
      {data.suggestions && data.suggestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-[12px] text-text-muted uppercase tracking-wider">5 Suggestions — click &quot;Use this&quot; to start editing</p>
          {data.suggestions.map((hook, i) => (
            <div key={i} className="bg-bg-card border border-border rounded-xl p-4 group hover:border-amber/30 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] text-text-muted">{HOOK_LABELS[i] || `Option ${i + 1}`}</span>
                  <p className="text-[14px] text-text-primary leading-relaxed mt-1">{hook}</p>
                </div>
                <button
                  onClick={() => selectHook(hook)}
                  className="shrink-0 text-[12px] text-amber hover:text-amber-bright transition-colors bg-transparent border-none cursor-pointer opacity-0 group-hover:opacity-100 mt-1"
                >
                  Use this
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Draft textarea */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[14px] text-text-bright">Your Hook</label>
          {data.draft && (
            <span className={`text-[12px] font-mono ${(data.draft.trim().split(/\s+/).length || 0) > 90 ? 'text-red' : 'text-text-muted'}`}>
              {data.draft.trim().split(/\s+/).length} words
            </span>
          )}
        </div>
        <textarea
          value={data.draft ?? ''}
          onChange={(e) => updateDraft(e.target.value)}
          placeholder="Write your hook here — or use one of the suggestions above as a starting point..."
          rows={5}
          className="w-full bg-bg-card border border-border rounded-xl px-5 py-4 text-[15px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber/50 focus:ring-1 focus:ring-amber/20 transition-colors resize-y leading-relaxed"
        />
      </div>

      {/* AI Hook Scorer */}
      <HookScorer hookText={data.draft ?? ''} />
    </div>
  );
}
