'use client';

import { useProjectData, SaveIndicator } from '@/lib/use-project-data';
import { useRegisterPageContext } from '@/contexts/PageContextProvider';

interface BeliefMapData {
  currentBelief: string;
  skepticism: string;
  fear: string;
  hope: string;
  changeTrigger: string;
  targetBelief: string;
  targetEmotion: string;
  targetAction: string;
}

const EMPTY: BeliefMapData = {
  currentBelief: '',
  skepticism: '',
  fear: '',
  hope: '',
  changeTrigger: '',
  targetBelief: '',
  targetEmotion: '',
  targetAction: '',
};

const BEFORE_FIELDS: { key: keyof BeliefMapData; label: string; placeholder: string }[] = [
  { key: 'currentBelief', label: 'What do they currently believe about this topic?', placeholder: 'e.g. "Meditation is just sitting quietly and thinking about nothing"' },
  { key: 'skepticism', label: 'What are they skeptical about?', placeholder: 'e.g. "That meditation can actually change brain structure"' },
  { key: 'fear', label: "What do they fear won't work or isn't true?", placeholder: 'e.g. "That they\'ll waste time on something woo-woo with no real benefit"' },
  { key: 'hope', label: 'What do they secretly hope IS true?', placeholder: 'e.g. "That there\'s a simple practice that reduces their anxiety"' },
  { key: 'changeTrigger', label: 'What evidence would change their mind?', placeholder: 'e.g. "Brain scans, peer-reviewed studies, personal testimony from skeptics"' },
];

const AFTER_FIELDS: { key: keyof BeliefMapData; label: string; placeholder: string }[] = [
  { key: 'targetBelief', label: 'What should they now believe?', placeholder: 'e.g. "Meditation physically changes brain regions responsible for anxiety in 8 weeks"' },
  { key: 'targetEmotion', label: 'What specific emotion should they feel?', placeholder: 'Not "informed" — be precise: relieved? angry? motivated? unsettled?' },
  { key: 'targetAction', label: 'What should they do next?', placeholder: 'e.g. "Try the 5-minute protocol described in the video for one week"' },
];

function TextArea({ label, value, onChange, placeholder }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="block text-[14px] text-text-bright mb-2">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={2}
        className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-3 text-[14px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber/50 focus:ring-1 focus:ring-amber/20 transition-colors resize-y"
      />
    </div>
  );
}

export default function ViewerBeliefMap() {
  const { data, setData, saveStatus } = useProjectData<BeliefMapData>('viewer_belief_map', EMPTY);

  function update(key: keyof BeliefMapData, value: string) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  function handleClear() {
    setData(EMPTY);
  }

  useRegisterPageContext('viewer_belief_map', () => {
    const hasBefore = BEFORE_FIELDS.some((f) => (data[f.key] ?? '').trim());
    const hasAfter = AFTER_FIELDS.some((f) => (data[f.key] ?? '').trim());
    if (!hasBefore && !hasAfter) return null;
    const lines = ['Tool: Viewer Belief Map'];
    if (hasBefore) {
      lines.push('Before They Click:');
      for (const f of BEFORE_FIELDS) {
        const v = (data[f.key] ?? '').trim();
        if (v) lines.push(`  ${f.label.split('?')[0]}: ${v}`);
      }
    }
    if (hasAfter) {
      lines.push('After They Watch:');
      for (const f of AFTER_FIELDS) {
        const v = (data[f.key] ?? '').trim();
        if (v) lines.push(`  ${f.label.split('?')[0]}: ${v}`);
      }
    }
    return lines.join('\n');
  });

  const filledBefore = BEFORE_FIELDS.filter((f) => (data[f.key] ?? '').trim().length > 0).length;
  const filledAfter = AFTER_FIELDS.filter((f) => (data[f.key] ?? '').trim().length > 0).length;
  const filledTotal = filledBefore + filledAfter;
  const totalFields = BEFORE_FIELDS.length + AFTER_FIELDS.length;

  const gapStrength =
    filledTotal === totalFields ? 'strong' :
    filledTotal >= 5 ? 'developing' : 'incomplete';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="font-serif text-[24px] text-text-bright">Viewer Belief Map</h2>
            <p className="text-text-dim text-[13px] mt-1">
              Map what&apos;s happening inside your viewer&apos;s head for THIS specific video.
            </p>
          </div>
          <SaveIndicator status={saveStatus} />
        </div>
        <button
          onClick={handleClear}
          className="text-[13px] text-text-muted hover:text-text-dim transition-colors px-3 py-1.5 rounded-lg border border-border hover:border-border-light"
        >
          Clear
        </button>
      </div>

      {/* Before they click */}
      <div className="bg-bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-2 h-2 rounded-full bg-amber" />
          <h3 className="text-[16px] font-medium text-text-bright">Before They Click</h3>
          <span className="text-[12px] text-text-muted ml-auto">{filledBefore}/{BEFORE_FIELDS.length} filled</span>
        </div>
        <div className="space-y-4">
          {BEFORE_FIELDS.map((field) => (
            <TextArea
              key={field.key}
              label={field.label}
              value={data[field.key] ?? ''}
              onChange={(v) => update(field.key, v)}
              placeholder={field.placeholder}
            />
          ))}
        </div>
      </div>

      {/* After they watch */}
      <div className="bg-bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-2 h-2 rounded-full bg-green" />
          <h3 className="text-[16px] font-medium text-text-bright">After They Watch</h3>
          <span className="text-[12px] text-text-muted ml-auto">{filledAfter}/{AFTER_FIELDS.length} filled</span>
        </div>
        <div className="space-y-4">
          {AFTER_FIELDS.map((field) => (
            <TextArea
              key={field.key}
              label={field.label}
              value={data[field.key] ?? ''}
              onChange={(v) => update(field.key, v)}
              placeholder={field.placeholder}
            />
          ))}
        </div>
      </div>

      {/* Gap Assessment */}
      <div className={`rounded-xl border p-5 text-center transition-all duration-300 ${
        gapStrength === 'strong'
          ? 'border-green/30 bg-green/5'
          : gapStrength === 'developing'
            ? 'border-amber/30 bg-amber/5'
            : 'border-border bg-bg-card'
      }`}>
        <div className="text-[13px] text-text-dim mb-1">The Gap</div>
        <div className={`text-[16px] font-medium ${
          gapStrength === 'strong' ? 'text-green' : gapStrength === 'developing' ? 'text-amber' : 'text-text-muted'
        }`}>
          {gapStrength === 'strong'
            ? 'Belief gap mapped — the distance between before and after is the value of your video.'
            : gapStrength === 'developing'
              ? 'Getting there — fill in the remaining fields to fully map the gap.'
              : 'Fill in both sections to see the gap between where your viewer starts and where they end up.'}
        </div>
      </div>
    </div>
  );
}
