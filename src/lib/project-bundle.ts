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
    videos?: Array<{ title: string; views: string; angle: string; missed: string }>;
    uniqueAngle?: string;
    marketGap?: string;
  };
  framing_worksheet?: {
    oneSentence?: string;
    rememberOneWeek?: string;
    contrarianAngle?: string;
    emotionalHook?: string;
    thirtySeconds?: string;
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

  // Competitive landscape
  const cs = bundle.competitive_scan;
  if (cs && (cs.uniqueAngle || (cs.videos && cs.videos.some((v) => v.title)))) {
    lines.push('COMPETITIVE LANDSCAPE');
    if (cs.videos) {
      for (const v of cs.videos) {
        if (v.title) lines.push(`  - ${v.title}${v.views ? ` (${v.views})` : ''}: ${v.missed || v.angle || ''}`);
      }
    }
    if (cs.uniqueAngle) lines.push(`Our angle: ${cs.uniqueAngle}`);
    if (cs.marketGap) lines.push(`Gap: ${cs.marketGap}`);
    lines.push('');
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

  // Hook concept
  if (fw?.thirtySeconds) {
    lines.push('HOOK CONCEPT', fw.thirtySeconds, '');
  }

  return lines.join('\n').trim();
}
