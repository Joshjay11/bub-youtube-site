'use client';

import { useState } from 'react';

interface TrackingEntry {
  id: string;
  url: string;
  title: string;
  publishDate: string;
  titleFormula: string;
  hookFormula: string;
  hookScore: number | null;
  ctr7day: number | null;
  avgRetention: number | null;
  views28day: number | null;
  satisfactionScore: number | null;
  notes: string;
}

const TITLE_FORMULAS = ['Contradiction', 'Hidden Story', 'Number', 'Question', 'How-To Promise', 'Revelation', 'Other'];
const HOOK_FORMULAS = ['Contradiction', 'Question', 'Cold Open', 'Data', 'Challenge', 'Stakes'];

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

const EMPTY: Omit<TrackingEntry, 'id'> = {
  url: '',
  title: '',
  publishDate: '',
  titleFormula: '',
  hookFormula: '',
  hookScore: null,
  ctr7day: null,
  avgRetention: null,
  views28day: null,
  satisfactionScore: null,
  notes: '',
};

export default function PerformanceTracker() {
  const [entries, setEntries] = useState<TrackingEntry[]>([]);
  const [editing, setEditing] = useState<TrackingEntry | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState<Omit<TrackingEntry, 'id'>>(EMPTY);

  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [channelName, setChannelName] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  async function fetchVideoInfo(urlToFetch: string) {
    const trimmed = urlToFetch.trim();
    if (!trimmed) {
      setThumbnailUrl(null);
      setChannelName(null);
      setFetchError(null);
      return;
    }
    setIsFetching(true);
    setFetchError(null);
    try {
      const res = await fetch(`/api/tracker/oembed?url=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      if (!res.ok) {
        setFetchError(data.error || 'Could not fetch video info');
        setThumbnailUrl(null);
        setChannelName(null);
        return;
      }
      setDraft((d) => ({
        ...d,
        url: data.canonicalUrl,
        title: data.title || d.title,
      }));
      setThumbnailUrl(data.thumbnailUrl || null);
      setChannelName(data.channelName || null);
    } catch {
      setFetchError('Could not fetch video info');
      setThumbnailUrl(null);
      setChannelName(null);
    } finally {
      setIsFetching(false);
    }
  }

  function resetAutofillState() {
    setThumbnailUrl(null);
    setChannelName(null);
    setFetchError(null);
    setIsFetching(false);
  }

  function handleSave() {
    if (!draft.title.trim()) return;
    if (editing) {
      setEntries((prev) => prev.map((e) => (e.id === editing.id ? { ...draft, id: editing.id } : e)));
      setEditing(null);
    } else {
      setEntries((prev) => [...prev, { ...draft, id: genId() }]);
    }
    setDraft(EMPTY);
    setIsAdding(false);
    resetAutofillState();
  }

  function handleEdit(entry: TrackingEntry) {
    setEditing(entry);
    setDraft(entry);
    setIsAdding(true);
  }

  function handleDelete(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    if (editing?.id === id) {
      setEditing(null);
      setDraft(EMPTY);
      setIsAdding(false);
    }
  }

  function handleCancel() {
    setEditing(null);
    setDraft(EMPTY);
    setIsAdding(false);
    resetAutofillState();
  }

  // Compute averages for insight banner
  const withCtr = entries.filter((e) => e.ctr7day !== null);
  const withRet = entries.filter((e) => e.avgRetention !== null);
  const avgCtr = withCtr.length ? withCtr.reduce((s, e) => s + (e.ctr7day || 0), 0) / withCtr.length : null;
  const avgRet = withRet.length ? withRet.reduce((s, e) => s + (e.avgRetention || 0), 0) / withRet.length : null;

  const sorted = [...entries].sort((a, b) => {
    if (a.publishDate && b.publishDate) return b.publishDate.localeCompare(a.publishDate);
    if (a.publishDate) return -1;
    return 1;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-text-dim text-[13px]">{entries.length} video{entries.length !== 1 ? 's' : ''} tracked</p>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber hover:bg-amber-bright hover:text-bg text-bg text-[14px] font-medium rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Log Video
          </button>
        )}
      </div>

      {/* Averages banner */}
      {entries.length >= 2 && (
        <div className="bg-bg-card border border-border rounded-xl p-4 flex items-center gap-8">
          <div className="text-[12px] text-text-muted uppercase tracking-wider">Averages</div>
          {avgCtr !== null && (
            <div>
              <div className="text-[18px] font-mono font-bold text-amber">{avgCtr.toFixed(1)}%</div>
              <div className="text-[11px] text-text-muted">CTR (7-day)</div>
            </div>
          )}
          {avgRet !== null && (
            <div>
              <div className="text-[18px] font-mono font-bold text-text-bright">{avgRet.toFixed(1)}%</div>
              <div className="text-[11px] text-text-muted">Avg Retention</div>
            </div>
          )}
          <div>
            <div className="text-[18px] font-mono font-bold text-text-bright">{entries.length}</div>
            <div className="text-[11px] text-text-muted">Videos</div>
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {isAdding && (
        <div className="bg-bg-card border border-amber/20 rounded-xl p-5 space-y-4">
          <h3 className="text-[15px] font-medium text-text-bright">{editing ? 'Edit Entry' : 'Log Published Video'}</h3>

          <div>
            <label className="block text-[13px] text-text-dim mb-1">
              YouTube URL <span className="text-text-muted font-normal">(optional, paste a link and we&apos;ll fill in the details)</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={draft.url}
                onChange={(e) => setDraft((d) => ({ ...d, url: e.target.value }))}
                onBlur={(e) => fetchVideoInfo(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-2.5 pr-10 text-[14px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber/50"
              />
              {isFetching && (
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-amber" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
            </div>
            {fetchError && (
              <p className="text-[12px] text-amber mt-1.5">{fetchError} &middot; you can still log manually.</p>
            )}
            {(thumbnailUrl || channelName) && !fetchError && (
              <div className="mt-2 flex items-start gap-3 bg-bg-elevated border border-border/50 rounded-lg p-2">
                {thumbnailUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={thumbnailUrl} alt="Video thumbnail" className="w-32 h-auto rounded" />
                )}
                {channelName && (
                  <div className="text-[12px] text-text-muted pt-1">
                    <div className="text-text-dim">Channel</div>
                    <div className="text-text-bright">{channelName}</div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-[13px] text-text-dim mb-1">Video Title</label>
              <input type="text" value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                placeholder="The actual title used"
                className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-2.5 text-[14px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber/50" />
            </div>
            <div>
              <label className="block text-[13px] text-text-dim mb-1">Publish Date</label>
              <input type="date" value={draft.publishDate}
                onChange={(e) => setDraft((d) => ({ ...d, publishDate: e.target.value }))}
                className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-2.5 text-[14px] text-text-primary focus:outline-none focus:border-amber/50" />
            </div>
            <div>
              <label className="block text-[13px] text-text-dim mb-1">Title Formula</label>
              <select value={draft.titleFormula}
                onChange={(e) => setDraft((d) => ({ ...d, titleFormula: e.target.value }))}
                className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-2.5 text-[14px] text-text-primary focus:outline-none focus:border-amber/50">
                <option value="">Select</option>
                {TITLE_FORMULAS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[13px] text-text-dim mb-1">Hook Formula</label>
              <select value={draft.hookFormula}
                onChange={(e) => setDraft((d) => ({ ...d, hookFormula: e.target.value }))}
                className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-2.5 text-[14px] text-text-primary focus:outline-none focus:border-amber/50">
                <option value="">Select</option>
                {HOOK_FORMULAS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[13px] text-text-dim mb-1">Hook Score (0-10)</label>
              <input type="number" min={0} max={10} value={draft.hookScore ?? ''}
                onChange={(e) => setDraft((d) => ({ ...d, hookScore: e.target.value ? Number(e.target.value) : null }))}
                className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-2.5 text-[14px] text-text-primary focus:outline-none focus:border-amber/50" />
            </div>
            <div>
              <label className="block text-[13px] text-text-dim mb-1">CTR 7-Day (%)</label>
              <input type="number" step="0.1" min={0} max={100} value={draft.ctr7day ?? ''}
                onChange={(e) => setDraft((d) => ({ ...d, ctr7day: e.target.value ? Number(e.target.value) : null }))}
                className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-2.5 text-[14px] text-text-primary focus:outline-none focus:border-amber/50" />
            </div>
            <div>
              <label className="block text-[13px] text-text-dim mb-1">Avg Retention (%)</label>
              <input type="number" step="0.1" min={0} max={100} value={draft.avgRetention ?? ''}
                onChange={(e) => setDraft((d) => ({ ...d, avgRetention: e.target.value ? Number(e.target.value) : null }))}
                className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-2.5 text-[14px] text-text-primary focus:outline-none focus:border-amber/50" />
            </div>
            <div>
              <label className="block text-[13px] text-text-dim mb-1">Views 28-Day</label>
              <input type="number" min={0} value={draft.views28day ?? ''}
                onChange={(e) => setDraft((d) => ({ ...d, views28day: e.target.value ? Number(e.target.value) : null }))}
                className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-2.5 text-[14px] text-text-primary focus:outline-none focus:border-amber/50" />
            </div>
            <div>
              <label className="block text-[13px] text-text-dim mb-1">Satisfaction Score (0-8)</label>
              <input type="number" min={0} max={8} value={draft.satisfactionScore ?? ''}
                onChange={(e) => setDraft((d) => ({ ...d, satisfactionScore: e.target.value ? Number(e.target.value) : null }))}
                className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-2.5 text-[14px] text-text-primary focus:outline-none focus:border-amber/50" />
            </div>
            <div className="md:col-span-3">
              <label className="block text-[13px] text-text-dim mb-1">Notes</label>
              <textarea value={draft.notes}
                onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
                placeholder="What worked, what didn't..."
                rows={2}
                className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-2.5 text-[14px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber/50 resize-y" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleSave} className="px-5 py-2 bg-amber hover:bg-amber-bright hover:text-bg text-bg text-[14px] font-medium rounded-lg transition-colors">
              {editing ? 'Save Changes' : 'Log Video'}
            </button>
            <button onClick={handleCancel} className="px-4 py-2 text-[14px] text-text-muted hover:text-text-dim transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {/* Entries table */}
      {sorted.length > 0 ? (
        <div className="bg-bg-card border border-border rounded-xl overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-[12px] text-text-muted font-medium px-4 py-3 uppercase tracking-wider">Title</th>
                <th className="text-left text-[12px] text-text-muted font-medium px-4 py-3 uppercase tracking-wider">Date</th>
                <th className="text-left text-[12px] text-text-muted font-medium px-4 py-3 uppercase tracking-wider">Title F.</th>
                <th className="text-left text-[12px] text-text-muted font-medium px-4 py-3 uppercase tracking-wider">Hook F.</th>
                <th className="text-right text-[12px] text-text-muted font-medium px-4 py-3 uppercase tracking-wider">Hook</th>
                <th className="text-right text-[12px] text-text-muted font-medium px-4 py-3 uppercase tracking-wider">CTR</th>
                <th className="text-right text-[12px] text-text-muted font-medium px-4 py-3 uppercase tracking-wider">Ret.</th>
                <th className="text-right text-[12px] text-text-muted font-medium px-4 py-3 uppercase tracking-wider">Views</th>
                <th className="text-right text-[12px] text-text-muted font-medium px-4 py-3 uppercase tracking-wider w-20"></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((entry) => (
                <tr key={entry.id} className="border-b border-border/50 last:border-0 hover:bg-bg-card-hover/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="text-[13px] text-text-bright max-w-[200px] truncate">{entry.title}</div>
                    {entry.notes && <div className="text-[11px] text-text-muted max-w-[200px] truncate">{entry.notes}</div>}
                  </td>
                  <td className="px-4 py-3 text-[12px] text-text-dim font-mono">{entry.publishDate || '—'}</td>
                  <td className="px-4 py-3 text-[12px] text-text-dim">{entry.titleFormula || '—'}</td>
                  <td className="px-4 py-3 text-[12px] text-text-dim">{entry.hookFormula || '—'}</td>
                  <td className="px-4 py-3 text-right text-[13px] font-mono">{entry.hookScore !== null ? <span className={entry.hookScore >= 8 ? 'text-green' : entry.hookScore >= 5 ? 'text-amber' : 'text-red'}>{entry.hookScore}</span> : '—'}</td>
                  <td className="px-4 py-3 text-right text-[13px] font-mono">{entry.ctr7day !== null ? `${entry.ctr7day}%` : '—'}</td>
                  <td className="px-4 py-3 text-right text-[13px] font-mono">{entry.avgRetention !== null ? `${entry.avgRetention}%` : '—'}</td>
                  <td className="px-4 py-3 text-right text-[13px] font-mono">{entry.views28day !== null ? entry.views28day.toLocaleString() : '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEdit(entry)} className="text-[12px] text-text-muted hover:text-amber transition-colors">Edit</button>
                      <button onClick={() => handleDelete(entry.id)} className="text-[12px] text-text-muted hover:text-red transition-colors">Del</button>
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
            <p className="text-text-muted text-[14px] mb-1">No videos tracked yet.</p>
            <p className="text-text-muted text-[13px] mb-3">After 10 videos, you&apos;ll see patterns in what works for YOUR channel.</p>
            <button onClick={() => setIsAdding(true)} className="text-amber text-[14px] hover:text-amber-bright transition-colors">
              Log your first video
            </button>
          </div>
        )
      )}
    </div>
  );
}
