'use client';

import { useState, useEffect } from 'react';
import { useProject } from '@/lib/project-context';
import { type ProjectBundle, loadProjectBundle, computeVerdict } from '@/lib/project-bundle';

type Section = 'research' | 'structure' | 'ai-prompts' | 'write' | 'optimize';

interface UpstreamContextProps {
  section: Section;
  onBundleLoaded?: (bundle: ProjectBundle) => void;
}

export default function UpstreamContext({ section, onBundleLoaded }: UpstreamContextProps) {
  const { currentProject } = useProject();
  const [bundle, setBundle] = useState<ProjectBundle | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!currentProject?.id) {
      setBundle(null);
      return;
    }
    loadProjectBundle(currentProject.id).then((b) => {
      setBundle(b);
      onBundleLoaded?.(b);
    }).catch(() => {});
  }, [currentProject?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!bundle || !currentProject) return null;

  const idea = bundle.idea_entry?.currentIdea;
  const scores = bundle.idea_scorecard?.scores;
  const { total, verdict } = computeVerdict(scores);
  const vbm = bundle.viewer_belief_map;
  const gaps = bundle.score_checker?.gapResponses;
  const aa = bundle.audience_avatar;
  const fw = bundle.framing_worksheet;
  const cs = bundle.competitive_scan;

  // Only show if there's meaningful upstream data
  const hasIdeaData = !!idea;
  const hasResearchData = !!(aa?.idealViewer || fw?.oneSentence || cs?.uniqueAngle);

  // Determine what to show based on current section
  const showIdea = hasIdeaData;
  const showResearch = hasResearchData && ['structure', 'ai-prompts', 'write', 'optimize'].includes(section);

  if (!showIdea && !showResearch) return null;

  const verdictColor = verdict === 'GO' ? 'text-green' : verdict === 'HOLD' ? 'text-amber' : 'text-red';

  return (
    <div className="bg-bg-card border border-border rounded-xl mb-8 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-3 text-left bg-transparent border-none cursor-pointer"
      >
        <div className="flex items-center gap-2 min-w-0">
          <svg
            className={`w-3.5 h-3.5 text-text-muted transition-transform shrink-0 ${expanded ? 'rotate-90' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-[13px] text-text-dim">Context from previous steps</span>
          {!expanded && (
            <span className="text-[12px] text-text-muted truncate ml-2">
              {idea && <><span className="text-text-dim">{idea.length > 40 ? idea.slice(0, 40) + '...' : idea}</span> <span className={verdictColor}>{total}/45</span></>}
            </span>
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-4 space-y-3 border-t border-border/50 pt-3">
          {/* Idea */}
          {showIdea && (
            <div>
              <div className="text-[11px] text-text-muted uppercase tracking-wider mb-1">Idea</div>
              <div className="text-[14px] text-text-bright">{idea}</div>
              {scores && (
                <div className="text-[13px] mt-1">
                  Score: <span className={`font-mono font-bold ${verdictColor}`}>{total}/45</span> <span className={verdictColor}>({verdict})</span>
                </div>
              )}
            </div>
          )}

          {/* Gap responses */}
          {gaps && Object.values(gaps).some((v) => v.trim()) && (
            <div>
              <div className="text-[11px] text-text-muted uppercase tracking-wider mb-1">Key Gaps Addressed</div>
              {Object.entries(gaps).map(([k, v]) => v.trim() ? (
                <div key={k} className="text-[12px] text-text-dim"><span className="text-amber">{k}:</span> {v}</div>
              ) : null)}
            </div>
          )}

          {/* Viewer belief map */}
          {vbm && (vbm.currentBelief || vbm.targetBelief) && (
            <div>
              <div className="text-[11px] text-text-muted uppercase tracking-wider mb-1">Viewer Belief</div>
              {vbm.currentBelief && <div className="text-[12px] text-text-dim">Before: {vbm.currentBelief}</div>}
              {vbm.targetBelief && <div className="text-[12px] text-text-dim">After: {vbm.targetBelief}</div>}
              {vbm.targetEmotion && <div className="text-[12px] text-text-dim">Emotion: {vbm.targetEmotion}</div>}
            </div>
          )}

          {/* Research data (if showing) */}
          {showResearch && (
            <>
              {aa?.idealViewer && (
                <div>
                  <div className="text-[11px] text-text-muted uppercase tracking-wider mb-1">Audience</div>
                  <div className="text-[12px] text-text-dim">{aa.idealViewer}</div>
                </div>
              )}
              {fw?.oneSentence && (
                <div>
                  <div className="text-[11px] text-text-muted uppercase tracking-wider mb-1">Thesis</div>
                  <div className="text-[12px] text-text-dim">{fw.oneSentence}</div>
                </div>
              )}
              {fw?.contrarianAngle && (
                <div>
                  <div className="text-[11px] text-text-muted uppercase tracking-wider mb-1">Angle</div>
                  <div className="text-[12px] text-text-dim">{fw.contrarianAngle}</div>
                </div>
              )}
              {cs?.uniqueAngle && (
                <div>
                  <div className="text-[11px] text-text-muted uppercase tracking-wider mb-1">Unique Angle (vs Competition)</div>
                  <div className="text-[12px] text-text-dim">{cs.uniqueAngle}</div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
