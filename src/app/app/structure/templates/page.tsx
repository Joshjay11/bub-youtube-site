export default function StructureTemplatesPage() {
  const templates = [
    {
      type: 'Tutorial / How-To',
      beats: [
        { time: '0:00', beat: 'Show the end result first ("Here\'s what we\'re building")' },
        { time: '0:30', beat: 'Why this matters / who this is for' },
        { time: '1:00', beat: 'Step 1 (simplest, builds confidence)' },
        { time: '3:00', beat: 'Step 2 (the meat)' },
        { time: '5:00', beat: 'The tricky part (where most people get stuck)' },
        { time: '7:00', beat: 'Step 3 (the payoff step)' },
        { time: '9:00', beat: 'Show the result again + variations' },
        { time: '10:00', beat: 'Common mistakes to avoid' },
        { time: '11:00', beat: 'Next steps / what to learn next (session hook)' },
      ],
    },
    {
      type: 'Explainer / Educational',
      beats: [
        { time: '0:00', beat: 'Contradiction hook ("Everything you know about X is wrong")' },
        { time: '0:30', beat: 'Value promise + stakes' },
        { time: '1:00', beat: 'The standard explanation (what everyone thinks)' },
        { time: '3:00', beat: 'Why that\'s incomplete or wrong' },
        { time: '4:30', beat: 'The 35% Pivot (the cross-disciplinary angle)' },
        { time: '6:00', beat: 'The deeper truth (with evidence)' },
        { time: '8:00', beat: 'What this means for YOU (practical implications)' },
        { time: '10:00', beat: 'The biggest remaining question (intellectual honesty)' },
        { time: '11:00', beat: 'Grand payoff + session hook' },
      ],
    },
    {
      type: 'Story-Driven / Documentary',
      beats: [
        { time: '0:00', beat: 'Cold open (drop into the most compelling moment)' },
        { time: '0:30', beat: 'Rewind ("To understand this, we need to go back to...")' },
        { time: '2:00', beat: 'The origin / setup (characters, context)' },
        { time: '4:00', beat: 'The inciting incident (something changes)' },
        { time: '5:30', beat: 'Rising tension (consequences, complications)' },
        { time: '7:00', beat: 'The midpoint revelation (reframes everything)' },
        { time: '9:00', beat: 'The climax (highest stakes moment)' },
        { time: '10:30', beat: 'The resolution + what it means' },
        { time: '11:30', beat: 'The lingering question (session hook)' },
      ],
    },
    {
      type: 'Commentary / Opinion',
      beats: [
        { time: '0:00', beat: 'The take (state your position boldly in the first sentence)' },
        { time: '0:30', beat: 'Why this matters now' },
        { time: '1:30', beat: 'The context most people miss' },
        { time: '3:00', beat: 'The strongest counter-argument (steel man it)' },
        { time: '5:00', beat: 'Why the counter-argument falls apart' },
        { time: '7:00', beat: 'The deeper principle at play' },
        { time: '9:00', beat: 'What happens if we get this wrong' },
        { time: '10:00', beat: 'Your final position (refined, not just repeated)' },
        { time: '11:00', beat: 'What you\'re still uncertain about (intellectual honesty)' },
      ],
    },
    {
      type: 'Listicle',
      beats: [
        { time: '0:00', beat: 'Hook: "Number [X] changed everything for me"' },
        { time: '0:30', beat: 'Brief overview + why these specific items' },
        { time: '1:00', beat: 'Item 1 (start strong, not with the weakest)' },
        { time: '3:00', beat: 'Item 2 (build in intensity or surprise)' },
        { time: '5:00', beat: 'Item 3 (the pivot — the one nobody expects)' },
        { time: '7:00', beat: 'Item 4 (if applicable)' },
        { time: '9:00', beat: 'The one that ties them all together' },
        { time: '10:00', beat: 'The pattern you now see across all items' },
        { time: '10:30', beat: 'Session hook' },
      ],
    },
  ];

  return (
    <div className="max-w-3xl">
      <h1 className="font-serif text-[32px] text-text-bright mb-2">Structure Templates</h1>
      <p className="text-text-dim text-[15px] mb-8">
        5 beat maps by video type. Pick the template that matches your video, then fill in the beats.
      </p>

      <div className="space-y-8">
        {templates.map((template) => (
          <div key={template.type} className="bg-bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-serif text-[18px] text-text-bright">{template.type}</h2>
            </div>
            <div className="divide-y divide-border/50">
              {template.beats.map((beat, i) => (
                <div key={i} className="flex items-start gap-4 px-5 py-3">
                  <span className="text-[13px] font-mono text-amber shrink-0 w-12">{beat.time}</span>
                  <span className="text-[14px] text-text-primary">{beat.beat}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
