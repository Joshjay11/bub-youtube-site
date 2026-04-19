'use client';

import { useRef, useState } from 'react';
import { useEscapeKey } from '@/lib/use-escape-key';

interface CreatedSample {
  id: string;
  title: string;
  notes: string;
  source_type: 'upload_md' | 'upload_txt' | 'upload_docx' | 'paste';
  word_count: number;
  included_in_tastemaker: boolean;
  created_at: string;
  updated_at: string;
}

interface AddVoiceSampleModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (sample: CreatedSample) => void;
}

const MAX_FILE_BYTES = 500 * 1024;
const MAX_NOTES_CHARS = 200;
const MAX_TITLE_CHARS = 100;
const ACCEPT_EXT = '.md,.txt,.docx';

type Tab = 'upload' | 'paste';

export default function AddVoiceSampleModal({ open, onClose, onCreated }: AddVoiceSampleModalProps) {
  const [tab, setTab] = useState<Tab>('upload');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadNotes, setUploadNotes] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const [pasteContent, setPasteContent] = useState('');
  const [pasteTitle, setPasteTitle] = useState('');
  const [pasteNotes, setPasteNotes] = useState('');

  useEscapeKey(() => { reset(); onClose(); }, open);

  if (!open) return null;

  function reset() {
    setFile(null);
    setUploadTitle('');
    setUploadNotes('');
    setPasteContent('');
    setPasteTitle('');
    setPasteNotes('');
    setError('');
    setSubmitting(false);
    setTab('upload');
  }

  function handleClose() {
    reset();
    onClose();
  }

  function acceptFile(picked: File | null) {
    setError('');
    if (!picked) {
      setFile(null);
      return;
    }
    const name = picked.name.toLowerCase();
    const mime = (picked.type || '').toLowerCase();
    if (name.endsWith('.pdf') || mime === 'application/pdf') {
      setError("PDFs aren't supported because text extraction is unreliable. Export as .docx or .txt, or paste the text directly.");
      setFile(null);
      return;
    }
    if (name.endsWith('.doc')) {
      setError("Older .doc files aren't supported. Please save as .docx.");
      setFile(null);
      return;
    }
    if (mime.startsWith('image/')) {
      setError("Images aren't supported. Please paste the text or upload as a document.");
      setFile(null);
      return;
    }
    const supported = name.endsWith('.md') || name.endsWith('.txt') || name.endsWith('.docx');
    if (!supported) {
      setError('Unsupported file type. Accepted: .md, .txt, .docx.');
      setFile(null);
      return;
    }
    if (picked.size > MAX_FILE_BYTES) {
      setError(`File exceeds the ${Math.round(MAX_FILE_BYTES / 1024)}KB limit.`);
      setFile(null);
      return;
    }
    setFile(picked);
    if (!uploadTitle) {
      setUploadTitle(picked.name.replace(/\.[^.]+$/, '').slice(0, MAX_TITLE_CHARS));
    }
  }

  async function submitUpload() {
    if (!file || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      if (uploadTitle.trim()) form.append('title', uploadTitle.trim());
      if (uploadNotes.trim()) form.append('notes', uploadNotes.trim());
      const res = await fetch('/api/tastemaker/voice-samples', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Upload failed.');
      } else {
        onCreated(data.sample as CreatedSample);
        handleClose();
      }
    } catch {
      setError('Connection error.');
    } finally {
      setSubmitting(false);
    }
  }

  async function submitPaste() {
    if (submitting) return;
    const title = pasteTitle.trim();
    const content = pasteContent.trim();
    if (!title) {
      setError('Title is required.');
      return;
    }
    if (!content) {
      setError('Content is required.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/tastemaker/voice-samples', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, notes: pasteNotes.trim(), content }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Save failed.');
      } else {
        onCreated(data.sample as CreatedSample);
        handleClose();
      }
    } catch {
      setError('Connection error.');
    } finally {
      setSubmitting(false);
    }
  }

  const pasteWordCount = pasteContent.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div
        className="bg-bg-card border border-border rounded-xl max-w-xl w-full max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between">
          <h3 className="text-[16px] font-medium text-text-bright">Add Voice Sample</h3>
          <button
            onClick={handleClose}
            className="text-text-muted hover:text-text-bright bg-transparent border-none cursor-pointer text-[20px] leading-none p-1"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <div className="px-5 pt-4 flex gap-1">
          {(['upload', 'paste'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(''); }}
              className={`text-[12px] px-3 py-1.5 rounded-t-lg border-b-2 transition-colors bg-transparent cursor-pointer ${tab === t ? 'text-amber border-amber' : 'text-text-muted border-transparent hover:text-text-bright'}`}
            >
              {t === 'upload' ? 'Upload a File' : 'Paste Text'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {tab === 'upload' ? (
            <>
              <div
                className={`border-2 border-dashed rounded-xl px-6 py-8 text-center transition-colors ${dragOver ? 'border-amber/60 bg-amber/5' : 'border-border bg-bg-elevated'}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  acceptFile(e.dataTransfer.files?.[0] ?? null);
                }}
              >
                <p className="text-[13px] text-text-dim mb-2">
                  Drag a file here, or{' '}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-amber hover:text-amber-bright underline bg-transparent border-none cursor-pointer p-0 font-inherit text-inherit"
                  >
                    browse
                  </button>
                </p>
                <p className="text-[11px] text-text-muted">Accepts .md, .txt, .docx &middot; max 500KB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPT_EXT}
                  className="hidden"
                  onChange={(e) => acceptFile(e.target.files?.[0] ?? null)}
                />
                {file && (
                  <div className="mt-4 text-[12px] text-text-bright">
                    <span className="text-text-muted">Selected:</span> {file.name} ({Math.round(file.size / 1024)}KB)
                  </div>
                )}
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wider text-text-muted mb-1 block">Title</label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  maxLength={MAX_TITLE_CHARS}
                  className="w-full bg-bg-elevated border border-border rounded px-3 py-2 text-[13px] text-text-bright focus:outline-none focus:border-amber/50"
                />
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wider text-text-muted mb-1 block">
                  Notes <span className="text-text-muted/60 normal-case">(optional)</span>
                </label>
                <textarea
                  value={uploadNotes}
                  onChange={(e) => setUploadNotes(e.target.value)}
                  maxLength={MAX_NOTES_CHARS}
                  rows={2}
                  className="w-full bg-bg-elevated border border-border rounded px-3 py-2 text-[13px] text-text-bright focus:outline-none focus:border-amber/50 resize-none"
                />
                <p className="text-[11px] text-text-muted mt-1 text-right">{uploadNotes.length}/{MAX_NOTES_CHARS}</p>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="text-[11px] uppercase tracking-wider text-text-muted mb-1 block">Title</label>
                <input
                  type="text"
                  value={pasteTitle}
                  onChange={(e) => setPasteTitle(e.target.value)}
                  maxLength={MAX_TITLE_CHARS}
                  placeholder="e.g. Old blog post"
                  className="w-full bg-bg-elevated border border-border rounded px-3 py-2 text-[13px] text-text-bright focus:outline-none focus:border-amber/50"
                />
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wider text-text-muted mb-1 block">Content</label>
                <textarea
                  value={pasteContent}
                  onChange={(e) => setPasteContent(e.target.value)}
                  rows={10}
                  placeholder="Paste your text here..."
                  className="w-full bg-bg-elevated border border-border rounded px-3 py-2 text-[13px] text-text-bright focus:outline-none focus:border-amber/50 resize-none font-sans"
                />
                <p className="text-[11px] text-text-muted mt-1 text-right">{pasteWordCount.toLocaleString()} words</p>
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wider text-text-muted mb-1 block">
                  Notes <span className="text-text-muted/60 normal-case">(optional)</span>
                </label>
                <textarea
                  value={pasteNotes}
                  onChange={(e) => setPasteNotes(e.target.value)}
                  maxLength={MAX_NOTES_CHARS}
                  rows={2}
                  className="w-full bg-bg-elevated border border-border rounded px-3 py-2 text-[13px] text-text-bright focus:outline-none focus:border-amber/50 resize-none"
                />
                <p className="text-[11px] text-text-muted mt-1 text-right">{pasteNotes.length}/{MAX_NOTES_CHARS}</p>
              </div>
            </>
          )}

          {error && (
            <p className="text-[12px] text-red bg-red/5 border border-red/20 rounded px-3 py-2">{error}</p>
          )}
        </div>

        <div className="px-5 py-3 border-t border-border/50 flex items-center justify-end gap-2">
          <button
            onClick={handleClose}
            className="text-[12px] text-text-dim hover:text-text-bright bg-transparent border border-border rounded px-3 py-1.5 cursor-pointer hover:border-amber/30 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={tab === 'upload' ? submitUpload : submitPaste}
            disabled={submitting || (tab === 'upload' ? !file : !pasteTitle.trim() || !pasteContent.trim())}
            className="text-[12px] text-bg bg-amber hover:bg-amber-bright rounded px-4 py-1.5 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {submitting ? 'Saving...' : tab === 'upload' ? 'Upload' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
