'use client';

import { useState, useEffect, useRef } from 'react';
import { useProject } from '@/lib/project-context';
import { loadProjectBundle } from '@/lib/project-bundle';
import { useProjectData, SaveIndicator } from '@/lib/use-project-data';
import { useRegisterPageContext } from '@/contexts/PageContextProvider';

interface ResearchAngle {
  angle: string;
  findings: string;
}

interface TopicResearchData {
  topic: string;
  results: ResearchAngle[];
}

const DEFAULTS: TopicResearchData = { topic: '', results: [] };

interface TopicResearchProps {
  onKeep: (text: string) => void;
}

export default function TopicResearch({ onKeep }: TopicResearchProps) {
  const { currentProject } = useProject();
  const { data, setData, saveStatus } = useProjectData<TopicResearchData>('topic_research', DEFAULTS);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ideaText, setIdeaText] = useState('');
  const [copied, setCopied] = useState(false);

  // Load idea from upstream
  useEffect(() => {
    if (!currentProject?.id) return;
    loadProjectBundle(currentProject.id).then((bundle) => {
      const idea = bundle.idea_entry?.currentIdea;
      if (idea) setIdeaText(idea);
    }).catch(() => {});
  }, [currentProject?.id]);

  async function handleResearch() {
    const topic = ideaText.trim();
    if (!topic || loading) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/ai/topic-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      });

      const result = await res.json();

      if (result.research) {
        setData({ topic, results: result.research });
      } else if (result.needsUpgrade) {
        setError('No AI credits remaining. Add your API key in Settings.');
      } else {
        setError(result.error || 'Research failed.');
      }
    } catch {
      setError('Connection error. Please try again.');
    }

    setLoading(false);
  }

  function handleCopyAll() {
    const text = data.results
      .map((r) => `## ${r.angle}\n\n${r.findings}`)
      .join('\n\n---\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownloadMd() {
    const text = `# Topic Research: ${data.topic}\n\n` +
      data.results.map((r) => `## ${r.angle}\n\n${r.findings}`).join('\n\n---\n\n');
    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `research-${data.topic.slice(0, 30).replace(/\s+/g, '-').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const wrapperRef = useRef<HTMLDivElement>(null);
  useRegisterPageContext('topic_research', 'Topic Research', () => {
    if (data.results.length === 0) return 'Tool: Topic Research\nStatus: No research run yet';
    const lines = [`Tool: Topic Research`, `Topic: ${data.topic}`, `Angles researched: ${data.results.length}`];
    for (const r of data.results) {
      lines.push(`\n${r.angle}:`);
      // First 150 chars as preview
      lines.push(`  ${r.findings.slice(0, 150)}${r.findings.length > 150 ? '...' : ''}`);
    }
    return lines.join('\n');
  }, wrapperRef);

  return (
    <div ref={wrapperRef} className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="font-serif text-[24px] text-text-bright">Topic Research</h2>
            <p className="text-text-dim text-[13px] mt-1">AI-powered research across 5 angles. Uses 1 credit.</p>
          </div>
          <SaveIndicator status={saveStatus} />
        </div>
      </div>

      {/* Idea display + research button */}
      <div className="bg-bg-card border border-border rounded-xl p-5">
        {ideaText ? (
          <div className="mb-4">
            <div className="text-[12px] text-text-muted uppercase tracking-wider mb-1">Researching</div>
            <div className="text-[15px] text-text-bright">{ideaText}</div>
          </div>
        ) : (
          <p className="text-[13px] text-text-muted mb-4">
            Set an idea in the Idea Validator first — that&apos;s what gets researched here.
          </p>
        )}

        <button
          onClick={handleResearch}
          disabled={!ideaText.trim() || loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-amber text-bg text-[14px] font-medium rounded-xl border-none cursor-pointer transition-all hover:bg-amber-bright hover:text-bg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading && (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {loading ? 'Researching (5 angles)...' : 'Research This Topic'}
        </button>
      </div>

      {error && (
        <div className="text-[13px] text-red bg-red/5 border border-red/20 rounded-lg px-4 py-3">{error}</div>
      )}

      {/* Results */}
      {data.results.length > 0 && (
        <>
          {/* Export buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadMd}
              className="flex items-center gap-1.5 text-[12px] text-text-muted hover:text-text-dim transition-colors bg-transparent border border-border rounded-lg px-3 py-1.5 cursor-pointer hover:border-border-light"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
              Download as Markdown
            </button>
            <button
              onClick={handleCopyAll}
              className="flex items-center gap-1.5 text-[12px] text-text-muted hover:text-text-dim transition-colors bg-transparent border border-border rounded-lg px-3 py-1.5 cursor-pointer hover:border-border-light"
            >
              {copied ? (
                <><svg className="w-3.5 h-3.5 text-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> Copied</>
              ) : (
                <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> Copy as Plain Text</>
              )}
            </button>
          </div>

          {/* Research angles */}
          <div className="space-y-4">
            {data.results.map((r, i) => (
              <div key={i} className="bg-bg-card border border-border rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-border/50 flex items-center justify-between">
                  <h3 className="text-[15px] font-medium text-text-bright">{r.angle}</h3>
                  <button
                    onClick={() => onKeep(`## ${r.angle}\n\n${r.findings}`)}
                    className="text-[11px] text-amber hover:text-amber-bright transition-colors bg-transparent border-none cursor-pointer whitespace-nowrap"
                  >
                    Keep card
                  </button>
                </div>
                <div className="px-5 py-4">
                  {r.findings.split('\n\n').map((paragraph, pi) => (
                    <div key={pi} className="group relative mb-3 last:mb-0">
                      <p className="text-[14px] text-text-primary leading-relaxed pr-8">{paragraph}</p>
                      <button
                        onClick={() => onKeep(paragraph)}
                        className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 text-[11px] text-amber hover:text-amber-bright transition-all bg-transparent border-none cursor-pointer whitespace-nowrap"
                        title="Save to Research Keeper"
                      >
                        Keep this
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
