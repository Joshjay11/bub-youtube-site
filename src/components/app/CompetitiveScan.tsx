'use client';

import { useRef } from 'react';
import { useProjectData, SaveIndicator } from '@/lib/use-project-data';
import { useRegisterPageContext } from '@/contexts/PageContextProvider';

interface VideoEntry {
  title: string;
  views: string;
  angle: string;
  missed: string;
}

interface ScanData {
  videos: VideoEntry[];
  uniqueAngle: string;
  marketGap: string;
}

const EMPTY_VIDEO: VideoEntry = { title: '', views: '', angle: '', missed: '' };

const DEFAULTS: ScanData = {
  videos: [{ ...EMPTY_VIDEO }, { ...EMPTY_VIDEO }, { ...EMPTY_VIDEO }],
  uniqueAngle: '',
  marketGap: '',
};

export default function CompetitiveScan() {
  const { data, setData, saveStatus } = useProjectData<ScanData>('competitive_scan', DEFAULTS);

  const videos: VideoEntry[] = data.videos?.length ? data.videos : DEFAULTS.videos;

  function updateVideo(index: number, field: keyof VideoEntry, value: string) {
    setData((prev) => {
      const updated = [...(prev.videos || DEFAULTS.videos)];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, videos: updated };
    });
  }

  function addVideo() {
    if (videos.length >= 10) return;
    setData((prev) => ({ ...prev, videos: [...(prev.videos || []), { ...EMPTY_VIDEO }] }));
  }

  function removeVideo(index: number) {
    if (videos.length <= 1) return;
    setData((prev) => ({
      ...prev,
      videos: (prev.videos || []).filter((_, i) => i !== index),
    }));
  }

  const filledVideos = videos.filter((v) => v.title.trim().length > 0).length;

  const wrapperRef = useRef<HTMLDivElement>(null);
  useRegisterPageContext('competitive_scan', 'Competitive Scan', () => {
    const lines = [`Tool: Competitive Scan`, `Videos logged: ${filledVideos}`];
    for (const v of videos) {
      if (v.title.trim()) lines.push(`  "${v.title}"${v.views ? ` (${v.views})` : ''}: ${v.angle || v.missed || '(no notes)'}`);
    }
    lines.push(`Unique angle: ${(data.uniqueAngle ?? '').trim() || '(empty)'}`);
    lines.push(`Market gap: ${(data.marketGap ?? '').trim() || '(empty)'}`);
    return lines.join('\n');
  }, wrapperRef);

  return (
    <div ref={wrapperRef} className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="font-serif text-[24px] text-text-bright">Competitive Scan</h2>
            <p className="text-text-dim text-[13px] mt-1">What&apos;s already out there on this topic? Look before you leap.</p>
          </div>
          <SaveIndicator status={saveStatus} />
        </div>
        <span className="text-[12px] text-text-muted">{filledVideos} video{filledVideos !== 1 ? 's' : ''} logged</span>
      </div>

      <div className="bg-bg-card border border-border rounded-xl p-6 space-y-5">
        <p className="text-[13px] text-text-dim">Search YouTube for your topic. List the top 3–5 existing videos:</p>

        {videos.map((video, i) => (
          <div key={i} className="bg-bg-elevated border border-border/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-text-muted font-medium">Video {i + 1}</span>
              {videos.length > 1 && (
                <button
                  onClick={() => removeVideo(i)}
                  className="text-[12px] text-text-muted hover:text-red transition-colors bg-transparent border-none cursor-pointer"
                >
                  Remove
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={video.title}
                onChange={(e) => updateVideo(i, 'title', e.target.value)}
                placeholder="Video title"
                className="bg-bg-card border border-border rounded-lg px-4 py-2.5 text-[14px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber/50 focus:ring-1 focus:ring-amber/20"
              />
              <input
                type="text"
                value={video.views}
                onChange={(e) => updateVideo(i, 'views', e.target.value)}
                placeholder="Views (e.g. 120K)"
                className="bg-bg-card border border-border rounded-lg px-4 py-2.5 text-[14px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber/50 focus:ring-1 focus:ring-amber/20"
              />
            </div>
            <textarea
              value={video.angle}
              onChange={(e) => updateVideo(i, 'angle', e.target.value)}
              placeholder="What angle did they take?"
              rows={2}
              className="w-full bg-bg-card border border-border rounded-lg px-4 py-2.5 text-[14px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber/50 focus:ring-1 focus:ring-amber/20 resize-y"
            />
            <textarea
              value={video.missed}
              onChange={(e) => updateVideo(i, 'missed', e.target.value)}
              placeholder="What did they miss or get wrong?"
              rows={2}
              className="w-full bg-bg-card border border-border rounded-lg px-4 py-2.5 text-[14px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber/50 focus:ring-1 focus:ring-amber/20 resize-y"
            />
          </div>
        ))}

        {videos.length < 10 && (
          <button
            onClick={addVideo}
            className="flex items-center gap-2 text-[13px] text-amber hover:text-amber-bright transition-colors bg-transparent border-none cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Another Video
          </button>
        )}
      </div>

      {/* Synthesis */}
      <div className="bg-bg-card border border-border rounded-xl p-6 space-y-4">
        <div>
          <label className="block text-[14px] text-text-bright mb-2">Based on what exists, what&apos;s YOUR unique angle?</label>
          <textarea
            value={data.uniqueAngle ?? ''}
            onChange={(e) => setData((prev) => ({ ...prev, uniqueAngle: e.target.value }))}
            placeholder="What will YOUR video say that none of these did?"
            rows={3}
            className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-3 text-[14px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber/50 focus:ring-1 focus:ring-amber/20 transition-colors resize-y"
          />
        </div>
        <div>
          <label className="block text-[14px] text-text-bright mb-2">What&apos;s the gap in the market?</label>
          <textarea
            value={data.marketGap ?? ''}
            onChange={(e) => setData((prev) => ({ ...prev, marketGap: e.target.value }))}
            placeholder="What question do the comments on those videos keep asking that nobody answered?"
            rows={3}
            className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-3 text-[14px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber/50 focus:ring-1 focus:ring-amber/20 transition-colors resize-y"
          />
        </div>
      </div>
    </div>
  );
}
