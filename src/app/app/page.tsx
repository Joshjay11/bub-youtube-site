'use client';

import { useState, useEffect } from 'react';
import { useProject } from '@/lib/project-context';
import { useRouter } from 'next/navigation';
import { loadProjectBundle } from '@/lib/project-bundle';

export default function DashboardPage() {
  const { projects, currentProject, createProject, loading } = useProject();
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  // Load last session state (must be before any early returns)
  const [session, setSession] = useState<{ current_page?: string; script_word_count?: number; next_step?: string; saved_at?: string } | null>(null);
  useEffect(() => {
    if (!currentProject?.id) return;
    loadProjectBundle(currentProject.id).then((bundle) => {
      const ss = bundle.session_state as typeof session;
      if (ss?.next_step) setSession(ss);
    }).catch(() => {});
  }, [currentProject?.id]);

  async function handleCreate() {
    if (!newTitle.trim() || creating) return;
    setCreating(true);
    const project = await createProject(newTitle.trim());
    setCreating(false);
    if (project) {
      setNewTitle('');
      router.push('/app/idea-validator');
    }
  }

  // Show nothing while loading projects from Supabase
  if (loading) {
    return <div className="pt-20 text-center text-text-muted">Loading...</div>;
  }

  // First-visit gate: no projects exist
  if (projects.length === 0) {
    return (
      <div className="max-w-lg mx-auto pt-20">
        <div className="bg-bg-card border border-border rounded-2xl p-10 text-center">
          <h1 className="font-serif text-[28px] text-text-bright mb-3">Welcome to BUB Script System</h1>
          <p className="text-[15px] text-text-dim mb-8 leading-relaxed">
            Every video starts as a project. Create one to get started — your work saves automatically.
          </p>
          <div className="flex gap-3 max-w-sm mx-auto">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="My first video idea..."
              className="flex-1 bg-bg-elevated border border-border rounded-xl px-4 py-3 text-[14px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber/50 focus:ring-1 focus:ring-amber/20"
            />
            <button
              onClick={handleCreate}
              disabled={!newTitle.trim()}
              className="px-5 py-3 bg-amber text-bg font-medium text-[14px] rounded-xl border-none cursor-pointer transition-all hover:bg-amber-bright hover:text-bg disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              Create
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No-project warning
  const noProjectBanner = !currentProject && projects.length > 0 ? (
    <div className="bg-amber/5 border border-amber/20 rounded-xl px-5 py-3 mb-8 flex items-center justify-between">
      <span className="text-[13px] text-amber">No project selected. Your work won&apos;t save.</span>
      <a href="/app/projects" className="text-[13px] text-amber font-medium hover:text-amber-bright transition-colors">
        Select Project
      </a>
    </div>
  ) : null;

  return (
    <div>
      {noProjectBanner}

      {/* Last Session card */}
      {session && currentProject && (
        <div className="bg-bg-card border border-amber/20 rounded-xl p-5 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[12px] text-text-muted uppercase tracking-wider mb-1">Last Session</div>
              <div className="text-[14px] text-text-bright">You were on: <span className="text-amber capitalize">{session.current_page?.replace(/-/g, ' ') || 'Dashboard'}</span></div>
              {session.script_word_count ? <div className="text-[13px] text-text-dim mt-0.5">Script: {session.script_word_count} words</div> : null}
              <div className="text-[13px] text-text-dim mt-0.5">Next: {session.next_step}</div>
            </div>
            <a href={`/app/${session.current_page || ''}`} className="px-4 py-2 bg-amber/10 text-amber text-[13px] font-medium rounded-lg border border-amber/20 hover:bg-amber/20 transition-colors no-underline">
              Resume →
            </a>
          </div>
        </div>
      )}

      <h1 className="font-serif text-[32px] text-text-bright mb-2">
        {currentProject ? currentProject.title : 'Welcome to the Script System'}
      </h1>
      <p className="text-text-dim text-[15px] mb-10 max-w-[560px]">
        {currentProject
          ? 'Your interactive toolkit for research-driven, retention-engineered YouTube scripts. Pick a module to continue.'
          : 'Pick a module to get started.'}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { title: 'Idea Validator', desc: 'Score your video ideas and map viewer beliefs before committing.', href: '/app/idea-validator', num: '01' },
          { title: 'Research', desc: 'Audience avatars, competitive analysis, and framing worksheets.', href: '/app/research', num: '02' },
          { title: 'Structure', desc: 'Beat maps, templates, hooks, and the 35% pivot guide.', href: '/app/structure', num: '03' },
          { title: 'AI Prompts', desc: 'Run AI-powered prompts for brainstorming, outlines, and hooks.', href: '/app/ai-prompts', num: '04' },
          { title: 'Write', desc: 'Pacing calculator and script draft canvas with live word counts.', href: '/app/write', num: '05' },
          { title: 'Optimize', desc: 'Script audit, retention prediction, and failure mode analysis.', href: '/app/optimize', num: '06' },
        ].map((mod) => (
          <a
            key={mod.href}
            href={mod.href}
            className="group bg-bg-card border border-border rounded-xl p-8 relative overflow-hidden transition-all hover:border-[rgba(212,163,66,0.3)] hover:bg-bg-card-hover no-underline"
          >
            <span className="font-serif font-extrabold text-[72px] leading-none text-amber opacity-[0.08] absolute -top-2 -left-1 select-none pointer-events-none">
              {mod.num}
            </span>
            <h3 className="font-sans font-bold text-[16px] text-text-bright mb-2 relative">{mod.title}</h3>
            <p className="font-sans text-[14px] text-text-dim leading-relaxed relative">{mod.desc}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
