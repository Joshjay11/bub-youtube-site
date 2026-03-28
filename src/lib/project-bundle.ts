export interface ProjectBundle {
  idea_entry?: {
    currentIdea?: string;
    activeTab?: string;
    brainstormResults?: Array<{ title: string; angle: string }>;
  };
  idea_scorecard?: {
    scores?: Record<string, number>;
  };
  score_checker?: {
    aiScores?: Array<{ criterion: string; score: number; reason: string }>;
    gapResponses?: Record<string, string>;
  };
  viewer_belief_map?: {
    currentBelief?: string;
    skepticism?: string;
    fear?: string;
    hope?: string;
    changeTrigger?: string;
    targetBelief?: string;
    targetEmotion?: string;
    targetAction?: string;
  };
  audience_avatar?: {
    idealViewer?: string;
    problem?: string;
    comingFrom?: string;
    skillLevel?: string;
    subscribeReason?: string;
  };
  competitive_scan?: {
    videos?: Array<{ title: string; views: string; angle: string; missed: string; stillWantToKnow?: string }>;
    uniqueAngle?: string;
    marketGap?: string;
    overplayed?: string;
    entryPoint?: string;
  };
  framing_worksheet?: {
    oneSentence?: string;
    rememberOneWeek?: string;
    contrarianAngle?: string;
    emotionalHook?: string;
    thirtySeconds?: string;
  };
  topic_research?: {
    topic?: string;
    results?: Array<{ angle: string; findings: string }>;
  };
  research_keeper?: {
    notes?: string;
  };
  hook_draft?: {
    draft?: string;
    suggestions?: string[];
  };
  hook_scorecard?: {
    checks?: Record<string, boolean>;
  };
  [key: string]: unknown;
}

export async function loadProjectBundle(projectId: string): Promise<ProjectBundle> {
  const res = await fetch(`/api/projects/data/bundle?projectId=${projectId}`);
  if (!res.ok) return {};
  return res.json();
}

/** Compute total and verdict from scores */
export function computeVerdict(scores?: Record<string, number>): { total: number; verdict: string } {
  if (!scores) return { total: 0, verdict: 'N/A' };
  const total = Object.values(scores).reduce((s, v) => s + v, 0);
  const verdict = total >= 40 ? 'GO' : total >= 30 ? 'HOLD' : 'KILL';
  return { total, verdict };
}

/** Compile bundle into a formatted brief string */
export function compileBrief(bundle: ProjectBundle): string {
  const lines: string[] = [];
  const idea = bundle.idea_entry?.currentIdea;

  if (idea) {
    lines.push(`VIDEO BRIEF: ${idea}`, '');
  }

  // Idea score
  const sc = bundle.idea_scorecard?.scores;
  if (sc) {
    const { total, verdict } = computeVerdict(sc);
    lines.push('IDEA SCORE', `Score: ${total}/45 (${verdict})`);

    // Gap responses
    const gaps = bundle.score_checker?.gapResponses;
    if (gaps && Object.keys(gaps).length > 0) {
      lines.push('Key gaps addressed:');
      for (const [criterion, response] of Object.entries(gaps)) {
        if (response.trim()) lines.push(`  ${criterion}: ${response.trim()}`);
      }
    }
    lines.push('');
  }

  // Viewer belief map
  const vbm = bundle.viewer_belief_map;
  if (vbm && (vbm.currentBelief || vbm.targetBelief)) {
    lines.push('VIEWER BELIEF MAP');
    if (vbm.currentBelief) lines.push(`Before: ${vbm.currentBelief}`);
    if (vbm.hope) lines.push(`They hope: ${vbm.hope}`);
    if (vbm.targetBelief) lines.push(`After: ${vbm.targetBelief}`);
    if (vbm.targetEmotion) lines.push(`Emotional target: ${vbm.targetEmotion}`);
    if (vbm.targetAction) lines.push(`Action: ${vbm.targetAction}`);
    lines.push('');
  }

  // Audience
  const aa = bundle.audience_avatar;
  if (aa && (aa.idealViewer || aa.problem)) {
    lines.push('AUDIENCE');
    if (aa.idealViewer) lines.push(`Viewer: ${aa.idealViewer}`);
    if (aa.problem) lines.push(`Problem: ${aa.problem}`);
    if (aa.comingFrom) lines.push(`Coming from: ${aa.comingFrom}`);
    if (aa.skillLevel) lines.push(`Skill level: ${aa.skillLevel}`);
    lines.push('');
  }

  // What's already out there
  const cs = bundle.competitive_scan;
  if (cs && (cs.overplayed || cs.uniqueAngle || cs.entryPoint || cs.marketGap || (cs.videos && cs.videos.some((v) => v.title)))) {
    lines.push("WHAT'S ALREADY OUT THERE");
    if (cs.videos) {
      for (const v of cs.videos) {
        if (v.title) {
          lines.push(`  - ${v.title}${v.views ? ` (${v.views})` : ''}: ${v.angle || ''}`);
          if (v.missed) lines.push(`    Left out: ${v.missed}`);
          if (v.stillWantToKnow) lines.push(`    Viewer still wants: ${v.stillWantToKnow}`);
        }
      }
    }
    if (cs.overplayed || cs.uniqueAngle) lines.push(`Overplayed: ${cs.overplayed || cs.uniqueAngle}`);
    if (cs.marketGap) lines.push(`Missing: ${cs.marketGap}`);
    if (cs.entryPoint) lines.push(`Entry point: ${cs.entryPoint}`);
    lines.push('');
  }

  // Research notes
  const rk = bundle.research_keeper;
  if (rk?.notes?.trim()) {
    lines.push('RESEARCH NOTES', rk.notes.trim(), '');
  }

  // Framing
  const fw = bundle.framing_worksheet;
  if (fw && (fw.oneSentence || fw.contrarianAngle)) {
    lines.push('THESIS & ANGLE');
    if (fw.oneSentence) lines.push(`Thesis: ${fw.oneSentence}`);
    if (fw.contrarianAngle) lines.push(`Contrarian angle: ${fw.contrarianAngle}`);
    if (fw.emotionalHook) lines.push(`Emotional hook: ${fw.emotionalHook}`);
    if (fw.rememberOneWeek) lines.push(`Takeaway: ${fw.rememberOneWeek}`);
    lines.push('');
  }

  // Hook concept (from framing worksheet 30-second pitch)
  if (fw?.thirtySeconds) {
    lines.push('HOOK CONCEPT (30-second pitch)', fw.thirtySeconds, '');
  }

  // Hook draft
  const hd = bundle.hook_draft;
  if (hd?.draft?.trim()) {
    lines.push('HOOK DRAFT', hd.draft.trim(), '');
  }

  // Hook score
  const hs = bundle.hook_scorecard;
  if (hs?.checks) {
    const hookScore = Object.values(hs.checks).filter(Boolean).length;
    const hookVerdict = hookScore >= 8 ? 'Ship it' : hookScore >= 5 ? 'Revise' : 'Start over';
    lines.push(`HOOK SCORE: ${hookScore}/10 (${hookVerdict})`, '');
  }

  return lines.join('\n').trim();
}
