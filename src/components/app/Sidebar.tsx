'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useProject } from '@/lib/project-context';
import CreditHealthBar from '@/components/app/CreditHealthBar';

function SaveProgressButton() {
  const [saved, setSaved] = useState(false);

  function handleSave() {
    window.dispatchEvent(new Event('save-progress'));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <button
      onClick={handleSave}
      className={`mx-2 mb-2 flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all w-[calc(100%-16px)] ${
        saved
          ? 'text-green bg-green/5'
          : 'text-text-dim hover:text-text-primary hover:bg-[rgba(255,255,255,0.03)]'
      }`}
    >
      <span className="shrink-0">
        {saved ? (
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
          </svg>
        )}
      </span>
      {saved ? 'Saved' : 'Save Progress'}
    </button>
  );
}

const modules = [
  {
    label: 'Dashboard',
    href: '/app',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    label: 'Workflow',
    href: '/app/workflow',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
      </svg>
    ),
  },
  {
    label: 'Idea Validator',
    href: '/app/idea-validator',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  {
    label: 'Research',
    href: '/app/research',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    label: 'Structure',
    href: '/app/structure',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M4 6h16M4 12h16M4 18h7" />
      </svg>
    ),
  },
  {
    label: 'AI Prompts',
    href: '/app/ai-prompts',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-2.47 2.47a2.25 2.25 0 00-.659 1.59v.91a1.5 1.5 0 01-1.5 1.5h-4.742a1.5 1.5 0 01-1.5-1.5v-.91a2.25 2.25 0 00-.659-1.59L5 14.5m14 0h.375a1.125 1.125 0 010 2.25H5.625" />
      </svg>
    ),
  },
  {
    label: 'Write',
    href: '/app/write',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
      </svg>
    ),
  },
  {
    label: 'Refine',
    href: '/app/refine',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
      </svg>
    ),
  },
  {
    label: 'Optimize',
    href: '/app/optimize',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  {
    label: 'Post-Production',
    href: '/app/post-production',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M13.125 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 0v.375" />
      </svg>
    ),
  },
  { type: 'divider' as const, label: '', href: '' },
  {
    label: 'Hook Library',
    href: '/app/reference/hooks',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
  },
  {
    label: 'Calendar',
    href: '/app/reference/calendar',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
  },
  {
    label: 'Tracker',
    href: '/app/reference/tracker',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
      </svg>
    ),
  },
  { type: 'divider' as const, label: '', href: '' },
  {
    label: 'Settings',
    href: '/app/settings',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7 7 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a7 7 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a7 7 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a7 7 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
        <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [projectDropdown, setProjectDropdown] = useState(false);
  const { projects, currentProject, setCurrentProject, createProject } = useProject();
  const [newProjectName, setNewProjectName] = useState('');

  useEffect(() => {
    setMobileOpen(false);
    setProjectDropdown(false);
  }, [pathname]);

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 768) setMobileOpen(false);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  async function handleQuickCreate() {
    if (!newProjectName.trim()) return;
    await createProject(newProjectName.trim());
    setNewProjectName('');
    setProjectDropdown(false);
  }

  return (
    <>
      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 h-[56px] bg-bg-elevated border-b border-border flex items-center px-4 z-50 md:hidden">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 -ml-2 text-text-dim hover:text-text-primary transition-colors"
          aria-label="Toggle menu"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            )}
          </svg>
        </button>
        <Link href="/app" className="flex items-baseline gap-2 ml-3 no-underline">
          <span className="font-sans font-extrabold text-lg text-text-bright tracking-[-0.03em]">BUB</span>
          <span className="font-sans font-medium text-[10px] text-amber uppercase tracking-[0.14em]">Script System</span>
        </Link>
        {currentProject && (
          <span className="ml-auto text-[12px] text-amber truncate max-w-[120px]">{currentProject.title}</span>
        )}
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-bg/60 backdrop-blur-sm z-40 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-bg-elevated border-r border-border flex flex-col z-50 transition-all duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 ${
          collapsed ? 'md:w-[60px]' : 'md:w-[240px]'
        } w-[280px] md:w-[240px]`}
      >
        {/* Logo */}
        <div className="h-[60px] flex items-center px-4 border-b border-border shrink-0">
          <Link href="/" className="flex items-baseline gap-2 no-underline">
            <span className="font-sans font-extrabold text-lg text-text-bright tracking-[-0.03em]">BUB</span>
            {!collapsed && (
              <span className="font-sans font-medium text-[10px] text-amber uppercase tracking-[0.14em]">Script System</span>
            )}
          </Link>
        </div>

        {/* Project selector */}
        {!collapsed && (
          <div className="px-2 pt-2 relative">
            <button
              onClick={() => setProjectDropdown(!projectDropdown)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-bg-card border border-border hover:border-amber/30 transition-colors cursor-pointer text-left"
            >
              <div className="min-w-0">
                <div className="text-[10px] text-text-muted uppercase tracking-wider">Project</div>
                <div className="text-[13px] text-text-bright truncate">
                  {currentProject?.title || 'No project selected'}
                </div>
              </div>
              <svg className={`w-3.5 h-3.5 text-text-muted shrink-0 ml-2 transition-transform ${projectDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Project dropdown */}
            {projectDropdown && (
              <div className="absolute left-2 right-2 top-full mt-1 bg-bg-card border border-border rounded-lg shadow-xl z-50 overflow-hidden">
                {/* Quick create */}
                <div className="p-2 border-b border-border/50">
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleQuickCreate()}
                      placeholder="New project..."
                      className="flex-1 bg-bg-elevated border border-border rounded px-2.5 py-1.5 text-[12px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber/50"
                    />
                    <button
                      onClick={handleQuickCreate}
                      disabled={!newProjectName.trim()}
                      className="px-2.5 py-1.5 bg-amber text-bg text-[11px] font-medium rounded border-none cursor-pointer disabled:opacity-40 hover:bg-amber-bright hover:text-bg"
                    >
                      Create
                    </button>
                  </div>
                </div>

                {/* Project list */}
                <div className="max-h-[200px] overflow-y-auto">
                  {projects.length === 0 ? (
                    <div className="px-3 py-4 text-[12px] text-text-muted text-center">No projects yet</div>
                  ) : (
                    projects.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setCurrentProject(p);
                          setProjectDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-[13px] transition-colors bg-transparent border-none cursor-pointer ${
                          currentProject?.id === p.id
                            ? 'text-amber bg-amber/5'
                            : 'text-text-dim hover:text-text-primary hover:bg-bg-card-hover'
                        }`}
                      >
                        {p.title}
                      </button>
                    ))
                  )}
                </div>

                {/* Manage link */}
                <Link
                  href="/app/projects"
                  onClick={() => setProjectDropdown(false)}
                  className="block px-3 py-2 text-[11px] text-text-muted hover:text-amber transition-colors border-t border-border/50 no-underline text-center"
                >
                  Manage Projects
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Credit health bar */}
        {!collapsed && <CreditHealthBar />}

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {modules.map((item, i) => {
            if ('type' in item && item.type === 'divider') {
              return <div key={`div-${i}`} className="h-px bg-border mx-2 my-2" />;
            }

            const isActive =
              item.href === '/app'
                ? pathname === '/app'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all no-underline mb-0.5 ${
                  isActive
                    ? 'bg-amber-glow text-amber'
                    : 'text-text-dim hover:text-text-primary hover:bg-[rgba(255,255,255,0.03)]'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <span className="shrink-0">{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Save Progress */}
        {!collapsed && (
          <SaveProgressButton />
        )}

        {/* Collapse toggle — desktop only */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex h-[48px] items-center justify-center border-t border-border text-text-muted hover:text-text-dim transition-colors shrink-0"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg
            width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"
            className={`transition-transform ${collapsed ? 'rotate-180' : ''}`}
          >
            <path d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
      </aside>
    </>
  );
}
