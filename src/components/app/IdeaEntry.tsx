'use client';

import { useState, useEffect } from 'react';
import { useProjectData, SaveIndicator } from '@/lib/use-project-data';

interface IdeaConcept {
  title: string;
  angle: string;
}

interface IdeaEntryData {
  currentIdea: string;
  activeTab: string;
  input: string;
  brainstormFragment: string;
  brainstormResults: IdeaConcept[];
}

const DEFAULTS: IdeaEntryData = {
  currentIdea: '',
  activeTab: 'have',
  input: '',
  brainstormFragment: '',
  brainstormResults: [],
};

interface IdeaEntryProps {
  onIdeaSet: (idea: string) => void;
  currentIdea: string;
}

export default function IdeaEntry({ onIdeaSet, currentIdea }: IdeaEntryProps) {
  const { data, setData, saveStatus } = useProjectData<IdeaEntryData>('idea_entry', DEFAULTS);

  const [lane, setLane] = useState<'have' | 'find'>(data.activeTab === 'find' ? 'find' : 'have');
  const [input, setInput] = useState(data.input);
  const [fragment, setFragment] = useState(data.brainstormFragment);
  const [ideas, setIdeas] = useState<IdeaConcept[]>(data.brainstormResults);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Sync loaded project data into local state
  useEffect(() => {
    setLane(data.activeTab === 'find' ? 'find' : 'have');
    setInput(data.input);
    setFragment(data.brainstormFragment);
    setIdeas(data.brainstormResults);
    if (data.currentIdea && data.currentIdea !== currentIdea) {
      onIdeaSet(data.currentIdea);
    }
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist changes back to project data
  useEffect(() => {
    setData({
      currentIdea,
      activeTab: lane,
      input,
      brainstormFragment: fragment,
      brainstormResults: ideas,
    });
  }, [currentIdea, lane, input, fragment, ideas, setData]);

  function handleScore() {
    if (!input.trim()) return;
    onIdeaSet(input.trim());
  }

  async function handleGenerate() {
    if (!fragment.trim() || loading) return;
    setLoading(true);
    setError('');
    setIdeas([]);

    try {
      const res = await fetch('/api/ai/brainstorm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fragment: fragment.trim() }),
      });

      const result = await res.json();

      if (result.ideas) {
        setIdeas(result.ideas);
      } else if (result.needsUpgrade) {
        setError('No AI credits remaining. Add your API key in Settings.');
      } else {
        setError(result.error || 'Failed to generate ideas.');
      }
    } catch {
      setError('Connection error. Please try again.');
    }

    setLoading(false);
  }

  function handlePickIdea(idea: IdeaConcept) {
    setInput(idea.title);
    setLane('have');
    onIdeaSet(idea.title);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <h2 className="font-serif text-[24px] text-text-bright">Your Video Idea</h2>
        <SaveIndicator status={saveStatus} />
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setLane('have')}
          className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${
            lane === 'have'
              ? 'bg-amber text-bg'
              : 'bg-bg-card text-text-dim border border-border hover:border-border-light hover:text-text-primary'
          }`}
        >
          I have an idea
        </button>
        <button
          onClick={() => setLane('find')}
          className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${
            lane === 'find'
              ? 'bg-amber text-bg'
              : 'bg-bg-card text-text-dim border border-border hover:border-border-light hover:text-text-primary'
          }`}
        >
          Help me find one
        </button>
      </div>

      {/* Lane 1 */}
      {lane === 'have' && (
        <div className="space-y-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="What's your video idea?"
            rows={3}
            className="w-full bg-bg-card border border-border rounded-xl px-4 py-3 text-[14px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber/50 focus:ring-1 focus:ring-amber/20 transition-colors resize-y"
          />
          <button
            onClick={handleScore}
            disabled={!input.trim()}
            className="px-5 py-2.5 bg-amber text-bg text-[14px] font-medium rounded-xl border-none cursor-pointer transition-all hover:bg-amber-bright hover:text-bg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Score This Idea
          </button>
        </div>
      )}

      {/* Lane 2 */}
      {lane === 'find' && (
        <div className="space-y-4">
          <textarea
            value={fragment}
            onChange={(e) => setFragment(e.target.value)}
            placeholder="Describe whatever's in your head — a topic, a question, a half-formed thought..."
            rows={3}
            className="w-full bg-bg-card border border-border rounded-xl px-4 py-3 text-[14px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber/50 focus:ring-1 focus:ring-amber/20 transition-colors resize-y"
          />
          <button
            onClick={handleGenerate}
            disabled={!fragment.trim() || loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber text-bg text-[14px] font-medium rounded-xl border-none cursor-pointer transition-all hover:bg-amber-bright hover:text-bg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {loading ? 'Generating...' : 'Generate Ideas'}
          </button>

          {error && (
            <div className="text-[13px] text-red bg-red/5 border border-red/20 rounded-lg px-4 py-3">{error}</div>
          )}

          {ideas.length > 0 && (
            <div className="space-y-2">
              <p className="text-[12px] text-text-muted uppercase tracking-wider">Click an idea to score it</p>
              {ideas.map((idea, i) => (
                <button
                  key={i}
                  onClick={() => handlePickIdea(idea)}
                  className="w-full text-left bg-bg-card border border-border rounded-xl p-4 hover:border-amber/40 hover:bg-amber-glow transition-all cursor-pointer group"
                >
                  <div className="text-[15px] text-text-bright font-medium group-hover:text-amber transition-colors mb-1">{idea.title}</div>
                  <div className="text-[13px] text-text-dim">{idea.angle}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pinned idea */}
      {currentIdea && (
        <div className="flex items-center gap-3 bg-amber/5 border border-amber/20 rounded-xl px-5 py-3">
          <div className="flex-1 min-w-0">
            <span className="text-[12px] text-amber font-medium uppercase tracking-wider">Scoring</span>
            <div className="text-[15px] text-text-bright truncate">{currentIdea}</div>
          </div>
          <button
            onClick={() => onIdeaSet('')}
            className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-card-hover transition-colors bg-transparent border-none cursor-pointer"
            title="Clear idea"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
