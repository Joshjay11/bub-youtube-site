export default function DashboardPage() {
  return (
    <div>
      <h1 className="font-serif text-[32px] text-text-bright mb-2">
        Welcome to the Script System
      </h1>
      <p className="text-text-dim text-[15px] mb-10 max-w-[560px]">
        Your interactive toolkit for research-driven, retention-engineered
        YouTube scripts. Pick a module to get started.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          {
            title: "Idea Validator",
            desc: "Score your video ideas and map viewer beliefs before committing.",
            href: "/app/idea-validator",
            num: "01",
          },
          {
            title: "Research",
            desc: "Audience avatars, competitive analysis, and framing worksheets.",
            href: "/app/research",
            num: "02",
          },
          {
            title: "Structure",
            desc: "Beat maps, templates, hooks, and the 35% pivot guide.",
            href: "/app/structure",
            num: "03",
          },
          {
            title: "AI Prompts",
            desc: "Run AI-powered prompts for brainstorming, outlines, and hooks.",
            href: "/app/ai-prompts",
            num: "04",
          },
          {
            title: "Write",
            desc: "Pacing calculator and script draft canvas with live word counts.",
            href: "/app/write",
            num: "05",
          },
          {
            title: "Optimize",
            desc: "Script audit, retention prediction, and failure mode analysis.",
            href: "/app/optimize",
            num: "06",
          },
        ].map((mod) => (
          <a
            key={mod.href}
            href={mod.href}
            className="group bg-bg-card border border-border rounded-xl p-8 relative overflow-hidden transition-all hover:border-[rgba(212,163,66,0.3)] hover:bg-bg-card-hover no-underline"
          >
            <span className="font-serif font-extrabold text-[72px] leading-none text-amber opacity-[0.08] absolute -top-2 -left-1 select-none pointer-events-none">
              {mod.num}
            </span>
            <h3 className="font-sans font-bold text-[16px] text-text-bright mb-2 relative">
              {mod.title}
            </h3>
            <p className="font-sans text-[14px] text-text-dim leading-relaxed relative">
              {mod.desc}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}
