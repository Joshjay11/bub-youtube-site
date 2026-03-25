'use client';

import { useState } from 'react';

interface CalendarEntry {
  id: string;
  title: string;
  publishDate: string;
  status: string;
  contentPillar: string;
  videoType: string;
  targetAudience: string;
  ideaScore: number | null;
}

const STATUSES = ['idea', 'researching', 'scripting', 'filming', 'editing', 'scheduled', 'published'];
const VIDEO_TYPES = ['Tutorial', 'Explainer', 'Story', 'Commentary', 'Listicle'];

const STATUS_COLORS: Record<string, string> = {
  idea: 'bg-text-muted/20 text-text-muted',
  researching: 'bg-amber/10 text-amber-dim',
  scripting: 'bg-amber/20 text-amber',
  filming: 'bg-blue-500/10 text-blue-400',
  editing: 'bg-purple-500/10 text-purple-400',
  scheduled: 'bg-green/10 text-green',
  published: 'bg-green/20 text-green',
};

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

const EMPTY_ENTRY: Omit<CalendarEntry, 'id'> = {
  title: '',
  publishDate: '',
  status: 'idea',
  contentPillar: '',
  videoType: '',
  targetAudience: '',
  ideaScore: null,
};

export default function ContentCalendar() {
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [editing, setEditing] = useState<CalendarEntry | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState<Omit<CalendarEntry, 'id'>>(EMPTY_ENTRY);

  function handleSave() {
    if (!draft.title.trim()) return;
    if (editing) {
      setEntries((prev) => prev.map((e) => (e.id === editing.id ? { ...draft, id: editing.id } : e)));
      setEditing(null);
    } else {
      setEntries((prev) => [...prev, { ...draft, id: genId() }]);
    }
    setDraft(EMPTY_ENTRY);
    setIsAdding(false);
  }

  function handleEdit(entry: CalendarEntry) {
    setEditing(entry);
    setDraft(entry);
    setIsAdding(true);
  }

  function handleDelete(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    if (editing?.id === id) {
      setEditing(null);
      setDraft(EMPTY_ENTRY);
      setIsAdding(false);
    }
  }

  function handleCancel() {
    setEditing(null);
    setDraft(EMPTY_ENTRY);
    setIsAdding(false);
  }

  // Sort by publish date (empty dates last), then by creation order
  const sorted = [...entries].sort((a, b) => {
    if (a.publishDate && b.publishDate) return a.publishDate.localeCompare(b.publishDate);
    if (a.publishDate) return -1;
    if (b.publishDate) return 1;
    return 0;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-text-dim text-[13px]">{entries.length} video{entries.length !== 1 ? 's' : ''} planned</p>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber hover:bg-amber-bright hover:text-bg text-bg text-[14px] font-medium rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Video
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {isAdding && (
        <div className="bg-bg-card border border-amber/20 rounded-xl p-5 space-y-4">
          <h3 className="text-[15px] font-medium text-text-bright">{editing ? 'Edit Video' : 'New Video'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-[13px] text-text-dim mb-1">Title</label>
              <input
                type="text"
                value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                placeholder="Video title or working title"
                className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-2.5 text-[14px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber/50"
              />
            </div>
            <div>
              <label className="block text-[13px] text-text-dim mb-1">Publish Date</label>
              <input
                type="date"
                value={draft.publishDate}
                onChange={(e) => setDraft((d) => ({ ...d, publishDate: e.target.value }))}
                className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-2.5 text-[14px] text-text-primary focus:outline-none focus:border-amber/50"
              />
            </div>
            <div>
              <label className="block text-[13px] text-text-dim mb-1">Status</label>
              <select
                value={draft.status}
                onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}
                className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-2.5 text-[14px] text-text-primary focus:outline-none focus:border-amber/50"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[13px] text-text-dim mb-1">Content Pillar</label>
              <input
                type="text"
                value={draft.contentPillar}
                onChange={(e) => setDraft((d) => ({ ...d, contentPillar: e.target.value }))}
                placeholder="e.g. 'Productivity', 'Deep Dives'"
                className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-2.5 text-[14px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber/50"
              />
            </div>
            <div>
              <label className="block text-[13px] text-text-dim mb-1">Video Type</label>
              <select
                value={draft.videoType}
                onChange={(e) => setDraft((d) => ({ ...d, videoType: e.target.value }))}
                className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-2.5 text-[14px] text-text-primary focus:outline-none focus:border-amber/50"
              >
                <option value="">Select type</option>
                {VIDEO_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[13px] text-text-dim mb-1">Target Audience</label>
              <input
                type="text"
                value={draft.targetAudience}
                onChange={(e) => setDraft((d) => ({ ...d, targetAudience: e.target.value }))}
                placeholder="Who is this video for?"
                className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-2.5 text-[14px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber/50"
              />
            </div>
            <div>
              <label className="block text-[13px] text-text-dim mb-1">Idea Score (from Scorecard)</label>
              <input
                type="number"
                min={9}
                max={45}
                value={draft.ideaScore ?? ''}
                onChange={(e) => setDraft((d) => ({ ...d, ideaScore: e.target.value ? Number(e.target.value) : null }))}
                placeholder="9-45"
                className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-2.5 text-[14px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber/50"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleSave} className="px-5 py-2 bg-amber hover:bg-amber-bright hover:text-bg text-bg text-[14px] font-medium rounded-lg transition-colors">
              {editing ? 'Save Changes' : 'Add to Calendar'}
            </button>
            <button onClick={handleCancel} className="px-4 py-2 text-[14px] text-text-muted hover:text-text-dim transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Calendar entries */}
      {sorted.length > 0 ? (
        <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-[12px] text-text-muted font-medium px-5 py-3 uppercase tracking-wider">Title</th>
                <th className="text-left text-[12px] text-text-muted font-medium px-5 py-3 uppercase tracking-wider">Date</th>
                <th className="text-left text-[12px] text-text-muted font-medium px-5 py-3 uppercase tracking-wider">Status</th>
                <th className="text-left text-[12px] text-text-muted font-medium px-5 py-3 uppercase tracking-wider">Type</th>
                <th className="text-right text-[12px] text-text-muted font-medium px-5 py-3 uppercase tracking-wider">Score</th>
                <th className="text-right text-[12px] text-text-muted font-medium px-5 py-3 uppercase tracking-wider w-24"></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((entry) => (
                <tr key={entry.id} className="border-b border-border/50 last:border-0 hover:bg-bg-card-hover/50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="text-[14px] text-text-bright">{entry.title}</div>
                    {entry.contentPillar && <div className="text-[12px] text-text-muted">{entry.contentPillar}</div>}
                  </td>
                  <td className="px-5 py-3 text-[13px] text-text-dim font-mono">
                    {entry.publishDate || '—'}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-block text-[12px] font-medium px-2 py-0.5 rounded capitalize ${STATUS_COLORS[entry.status] || 'bg-bg-elevated text-text-muted'}`}>
                      {entry.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[13px] text-text-dim">{entry.videoType || '—'}</td>
                  <td className="px-5 py-3 text-right">
                    {entry.ideaScore !== null ? (
                      <span className={`text-[14px] font-medium ${
                        entry.ideaScore >= 40 ? 'text-green' : entry.ideaScore >= 30 ? 'text-amber' : 'text-red'
                      }`}>
                        {entry.ideaScore}
                      </span>
                    ) : (
                      <span className="text-text-muted text-[13px]">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEdit(entry)} className="text-[12px] text-text-muted hover:text-amber transition-colors">Edit</button>
                      <button onClick={() => handleDelete(entry.id)} className="text-[12px] text-text-muted hover:text-red transition-colors">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !isAdding && (
          <div className="bg-bg-card border border-border rounded-xl p-10 text-center">
            <p className="text-text-muted text-[14px] mb-3">No videos in your calendar yet.</p>
            <button
              onClick={() => setIsAdding(true)}
              className="text-amber text-[14px] hover:text-amber-bright transition-colors"
            >
              Add your first video
            </button>
          </div>
        )
      )}
    </div>
  );
}
