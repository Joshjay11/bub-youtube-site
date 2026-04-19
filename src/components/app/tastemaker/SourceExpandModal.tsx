'use client';

import { useEffect, useState } from 'react';
import { SOURCE_BADGE_LABELS, type Source } from './types';

interface SourceExpandModalProps {
  source: Source | null;
  onClose: () => void;
  onSaveTitle?: (id: string, title: string) => Promise<void> | void;
  onSaveNotes?: (id: string, notes: string) => Promise<void> | void;
  onDelete?: (id: string) => void;
  onOpenProject?: (id: string) => void;
}

export default function SourceExpandModal({
  source,
  onClose,
  onSaveTitle,
  onSaveNotes,
  onDelete,
  onOpenProject,
}: SourceExpandModalProps) {
  const [titleDraft, setTitleDraft] = useState('');
  const [notesDraft, setNotesDraft] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);

  useEffect(() => {
    if (source) {
      setTitleDraft(source.title);
      setNotesDraft(source.notes ?? '');
      setEditingTitle(false);
      setEditingNotes(false);
    }
  }, [source]);

  if (!source) return null;

  const isVoiceSample = source.kind === 'voice_sample';
  const badge = SOURCE_BADGE_LABELS[source.sourceType];

  async function commitTitle() {
    if (!source || !onSaveTitle) return;
    const trimmed = titleDraft.trim();
    if (trimmed && trimmed !== source.title) {
      await onSaveTitle(source.id, trimmed);
    } else {
      setTitleDraft(source.title);
    }
    setEditingTitle(false);
  }

  async function commitNotes() {
    if (!source || !onSaveNotes) return;
    if (notesDraft !== (source.notes ?? '')) {
      await onSaveNotes(source.id, notesDraft);
    }
    setEditingNotes(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-bg-card border border-border rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-border/50 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[9px] font-bold tracking-wider text-text-muted bg-bg-elevated border border-border/50 rounded px-2 py-0.5">
                {badge}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-text-muted">
                {isVoiceSample ? 'Voice Sample' : 'Project'}
              </span>
            </div>
            {isVoiceSample && editingTitle ? (
              <input
                type="text"
                autoFocus
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={commitTitle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitTitle();
                  if (e.key === 'Escape') {
                    setTitleDraft(source.title);
                    setEditingTitle(false);
                  }
                }}
                maxLength={100}
                className="w-full bg-bg-elevated border border-border rounded px-2 py-1 text-[16px] text-text-bright focus:outline-none focus:border-amber/50"
              />
            ) : (
              <h3
                className={`text-[16px] font-medium text-text-bright leading-snug ${isVoiceSample ? 'cursor-text hover:bg-bg-elevated rounded px-1 -mx-1' : ''}`}
                onClick={() => isVoiceSample && setEditingTitle(true)}
              >
                {source.title}
              </h3>
            )}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 text-text-muted hover:text-text-bright bg-transparent border-none cursor-pointer text-[20px] leading-none p-1"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <div className="px-5 py-3 flex items-center gap-4 text-[11px] text-text-muted border-b border-border/30">
          <span>{source.wordCount.toLocaleString()} words</span>
          <span>Added {new Date(source.createdAt).toLocaleDateString()}</span>
          <span>{source.included ? 'Included' : 'Excluded'}</span>
        </div>

        {isVoiceSample && (
          <div className="px-5 py-3 border-b border-border/30">
            <label className="text-[11px] uppercase tracking-wider text-text-muted mb-1 block">Notes</label>
            {editingNotes ? (
              <textarea
                autoFocus
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                onBlur={commitNotes}
                maxLength={200}
                rows={2}
                className="w-full bg-bg-elevated border border-border rounded px-2 py-1 text-[13px] text-text-bright focus:outline-none focus:border-amber/50 resize-none"
              />
            ) : (
              <p
                className="text-[13px] text-text-dim cursor-text hover:bg-bg-elevated rounded px-1 -mx-1 min-h-[1.5em]"
                onClick={() => setEditingNotes(true)}
              >
                {source.notes || <span className="text-text-muted italic">Add a note...</span>}
              </p>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {source.content ? (
            <pre className="text-[13px] text-text-dim whitespace-pre-wrap font-sans leading-relaxed">
              {source.content}
            </pre>
          ) : isVoiceSample ? (
            <p className="text-[13px] text-text-muted italic">Loading content...</p>
          ) : (
            <p className="text-[13px] text-text-muted italic">
              The full content lives in the Script Studio. Use &ldquo;Open in Script Studio&rdquo; to view or edit this project.
            </p>
          )}
        </div>

        <div className="px-5 py-3 border-t border-border/50 flex items-center justify-between gap-3">
          <div>
            {isVoiceSample && onDelete && (
              <button
                onClick={() => onDelete(source.id)}
                className="text-[12px] text-red hover:text-red/80 bg-transparent border border-red/30 rounded px-3 py-1.5 cursor-pointer hover:border-red/50 transition-colors"
              >
                Delete sample
              </button>
            )}
            {!isVoiceSample && onOpenProject && (
              <button
                onClick={() => onOpenProject(source.id)}
                className="text-[12px] text-amber hover:text-amber-bright bg-transparent border border-amber/30 rounded px-3 py-1.5 cursor-pointer hover:border-amber/50 transition-colors"
              >
                Open in Script Studio
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-[12px] text-text-dim hover:text-text-bright bg-transparent border border-border rounded px-3 py-1.5 cursor-pointer hover:border-amber/30 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
