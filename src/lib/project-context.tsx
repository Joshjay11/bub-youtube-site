'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

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
  setCurrentProject: (project: Project | null) => void;
  createProject: (title: string) => Project;
  updateProject: (id: string, updates: Partial<Omit<Project, 'id' | 'createdAt'>>) => void;
  deleteProject: (id: string) => void;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);

  const createProject = useCallback((title: string): Project => {
    const now = new Date().toISOString();
    const project: Project = {
      id: genId(),
      title,
      status: 'idea',
      createdAt: now,
      updatedAt: now,
    };
    setProjects((prev) => [...prev, project]);
    setCurrentProject(project);
    return project;
  }, []);

  const updateProject = useCallback((id: string, updates: Partial<Omit<Project, 'id' | 'createdAt'>>) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
      )
    );
    setCurrentProject((curr) =>
      curr?.id === id ? { ...curr, ...updates, updatedAt: new Date().toISOString() } : curr
    );
  }, []);

  const deleteProject = useCallback((id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setCurrentProject((curr) => (curr?.id === id ? null : curr));
  }, []);

  return (
    <ProjectContext.Provider value={{ projects, currentProject, setCurrentProject, createProject, updateProject, deleteProject }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject must be used within ProjectProvider');
  return ctx;
}
