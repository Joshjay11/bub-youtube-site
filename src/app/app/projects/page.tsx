'use client';

import { useState } from 'react';
import { useProject, type Project } from '@/lib/project-context';

const STATUS_LABELS: Record<Project['status'], string> = {
  idea: 'Idea',
  researching: 'Researching',
  scripting: 'Scripting',
  filming: 'Filming',
  editing: 'Editing',
  published: 'Published',
};

const STATUS_COLORS: Record<Project['status'], string> = {
  idea: 'bg-text-muted/20 text-text-muted',
  researching: 'bg-amber/10 text-amber-dim',
  scripting: 'bg-amber/20 text-amber',
  filming: 'bg-blue-500/10 text-blue-400',
  editing: 'bg-purple-500/10 text-purple-400',
  published: 'bg-green/20 text-green',
};

const STATUSES: Project['status'][] = ['idea', 'researching', 'scripting', 'filming', 'editing', 'published'];

export default function ProjectsPage() {
  const { projects, currentProject, setCurrentProject, createProject, updateProject, deleteProject } = useProject();
  const [newTitle, setNewTitle] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  function handleCreate() {
    if (!newTitle.trim()) return;
    createProject(newTitle.trim());
    setNewTitle('');
  }

  function handleStartEdit(project: Project) {
    setEditingId(project.id);
    setEditTitle(project.title);
  }

  function handleSaveEdit(id: string) {
    if (editTitle.trim()) {
      updateProject(id, { title: editTitle.trim() });
    }
    setEditingId(null);
  }

  const sorted = [...projects].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <div>
      <h1 className="font-serif text-[32px] text-text-bright mb-2">Projects</h1>
      <p className="text-text-dim text-[15px] mb-8">
        Each project collects all your module data for one video. Select a project to make it active across all tools.
      </p>

      {/* Create new project */}
      <div className="flex gap-3 mb-8">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          placeholder="New video project title..."
          className="flex-1 bg-bg-card border border-border rounded-xl px-4 py-3 text-[14px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber/50 focus:ring-1 focus:ring-amber/20"
        />
        <button
          onClick={handleCreate}
          disabled={!newTitle.trim()}
          className="px-5 py-3 bg-amber hover:bg-amber-bright disabled:bg-bg-card disabled:text-text-muted text-bg text-[14px] font-medium rounded-xl transition-colors shrink-0"
        >
          Create Project
        </button>
      </div>

      {/* Current project indicator */}
      {currentProject && (
        <div className="bg-amber/5 border border-amber/20 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div>
            <div className="text-[12px] text-amber uppercase tracking-wider mb-0.5">Active Project</div>
            <div className="text-[16px] text-text-bright font-medium">{currentProject.title}</div>
          </div>
          <span className={`text-[12px] font-medium px-2 py-0.5 rounded ${STATUS_COLORS[currentProject.status]}`}>
            {STATUS_LABELS[currentProject.status]}
          </span>
        </div>
      )}

      {/* Project list */}
      {sorted.length > 0 ? (
        <div className="space-y-3">
          {sorted.map((project) => {
            const isActive = currentProject?.id === project.id;
            const isEditing = editingId === project.id;

            return (
              <div
                key={project.id}
                className={`bg-bg-card border rounded-xl p-5 transition-colors ${
                  isActive ? 'border-amber/30 bg-amber/[0.02]' : 'border-border hover:border-border-light'
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit(project.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        onBlur={() => handleSaveEdit(project.id)}
                        autoFocus
                        className="w-full bg-bg-elevated border border-amber/50 rounded-lg px-3 py-1.5 text-[15px] text-text-bright focus:outline-none"
                      />
                    ) : (
                      <div className="text-[15px] text-text-bright font-medium">{project.title}</div>
                    )}
                    <div className="flex items-center gap-3 mt-1">
                      <select
                        value={project.status}
                        onChange={(e) => updateProject(project.id, { status: e.target.value as Project['status'] })}
                        className="bg-transparent text-[12px] text-text-muted focus:outline-none cursor-pointer"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                        ))}
                      </select>
                      <span className="text-[11px] text-text-muted">
                        Updated {new Date(project.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {!isActive && (
                      <button
                        onClick={() => setCurrentProject(project)}
                        className="px-3 py-1.5 text-[13px] text-amber border border-amber/30 rounded-lg hover:bg-amber/10 transition-colors"
                      >
                        Select
                      </button>
                    )}
                    {isActive && (
                      <span className="px-3 py-1.5 text-[13px] text-amber bg-amber/10 rounded-lg">Active</span>
                    )}
                    <button
                      onClick={() => handleStartEdit(project)}
                      className="p-1.5 text-text-muted hover:text-text-dim transition-colors"
                      title="Rename"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => deleteProject(project.id)}
                      className="p-1.5 text-text-muted hover:text-red transition-colors"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-bg-card border border-border rounded-xl p-10 text-center">
          <p className="text-text-muted text-[14px] mb-1">No projects yet.</p>
          <p className="text-text-muted text-[13px]">Create your first project to start tracking a video from idea to publication.</p>
        </div>
      )}
    </div>
  );
}
