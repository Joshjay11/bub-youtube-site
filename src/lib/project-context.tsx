'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

export interface Project {
  id: string;
  title: string;
  status: 'idea' | 'researching' | 'scripting' | 'filming' | 'editing' | 'published';
  createdAt: string;
  updatedAt: string;
}

interface ProjectContextValue {
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
  setCurrentProject: (project: Project | null) => void;
  createProject: (title: string) => Promise<Project | null>;
  updateProject: (id: string, updates: { title?: string; status?: Project['status'] }) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  refreshProjects: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

const LAST_PROJECT_KEY = 'bub_last_project_id';

function mapRow(row: { id: string; title: string; status: string; created_at: string; updated_at: string }): Project {
  return {
    id: row.id,
    title: row.title,
    status: (row.status || 'idea') as Project['status'],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProjectRaw] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  const setCurrentProject = useCallback((project: Project | null) => {
    setCurrentProjectRaw(project);
    if (project) {
      try { localStorage.setItem(LAST_PROJECT_KEY, project.id); } catch {}
    }
  }, []);

  // Fetch projects from Supabase on mount
  const refreshProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/projects');
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const data = await res.json();
      const mapped = (data.projects || []).map(mapRow);
      setProjects(mapped);

      // Restore last selected project
      const lastId = localStorage.getItem(LAST_PROJECT_KEY);
      const match = mapped.find((p: Project) => p.id === lastId);
      if (match) {
        setCurrentProjectRaw(match);
      } else if (mapped.length > 0) {
        setCurrentProjectRaw(mapped[0]);
        try { localStorage.setItem(LAST_PROJECT_KEY, mapped[0].id); } catch {}
      }
    } catch {
      // API not available (local dev without Supabase) — leave empty
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshProjects();
  }, [refreshProjects]);

  const createProject = useCallback(async (title: string): Promise<Project | null> => {
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) {
        // Fallback for local dev: create ephemeral project
        const fallback: Project = {
          id: crypto.randomUUID(),
          title,
          status: 'idea',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setProjects((prev) => [fallback, ...prev]);
        setCurrentProject(fallback);
        return fallback;
      }
      const data = await res.json();
      const project = mapRow(data.project);
      setProjects((prev) => [project, ...prev]);
      setCurrentProject(project);
      return project;
    } catch {
      return null;
    }
  }, [setCurrentProject]);

  const updateProject = useCallback(async (id: string, updates: { title?: string; status?: Project['status'] }) => {
    const res = await fetch(`/api/projects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update project');
    }
    const data = await res.json();
    const project = mapRow(data.project);
    setProjects((prev) => prev.map((p) => (p.id === id ? project : p)));
    setCurrentProjectRaw((curr) => (curr?.id === id ? project : curr));
  }, []);

  const deleteProject = useCallback(async (id: string) => {
    const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete project');
    }
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setCurrentProjectRaw((curr) => {
      if (curr?.id !== id) return curr;
      try { localStorage.removeItem(LAST_PROJECT_KEY); } catch {}
      return null;
    });
  }, []);

  return (
    <ProjectContext.Provider value={{ projects, currentProject, loading, setCurrentProject, createProject, updateProject, deleteProject, refreshProjects }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject must be used within ProjectProvider');
  return ctx;
}
