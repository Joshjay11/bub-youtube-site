import HookScorecard from '@/components/app/HookScorecard';
import Link from 'next/link';

const REFERENCE_PAGES = [
  {
    href: '/app/structure/pivot',
    title: 'The 35% Pivot — Explained',
    description: 'The most important structural beat. 8 genre-specific examples of how to reframe at the 1/3 mark.',
  },
  {
    href: '/app/structure/templates',
    title: 'Structure Templates',
    description: '5 beat maps by video type: Tutorial, Explainer, Story, Commentary, Listicle.',
  },
  {
    href: '/app/structure/decision-tree',
    title: 'Video Type Decision Tree',
    description: '3 questions to identify which structure template fits your video.',
  },
  {
    href: '/app/structure/hooks-examples',
    title: 'Bad / Better / Best Hook Examples',
    description: '18 examples across 6 hook types showing what a 3/10, 6/10, and 9/10 looks like.',
  },
];

export default function StructurePage() {
  return (
    <div>
      <h1 className="font-serif text-[32px] text-text-bright mb-2">Script Structure</h1>
      <p className="text-text-dim text-[15px] mb-8">
        Score your hooks, pick a structure template, and master the 35% Pivot.
      </p>

      <div className="space-y-12">
        <HookScorecard />

        <hr className="rule" style={{ margin: '0' }} />

        {/* Reference pages */}
        <div>
          <h2 className="font-serif text-[22px] text-text-bright mb-4">Reference Guides</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {REFERENCE_PAGES.map((page) => (
              <Link
                key={page.href}
                href={page.href}
                className="bg-bg-card border border-border rounded-xl p-5 hover:border-amber/30 transition-colors group"
              >
                <h3 className="text-[15px] font-medium text-text-bright group-hover:text-amber transition-colors mb-1">
                  {page.title}
                </h3>
                <p className="text-[13px] text-text-dim">{page.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
