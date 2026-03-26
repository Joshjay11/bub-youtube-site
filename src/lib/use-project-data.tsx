'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useProject } from '@/lib/project-context';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useProjectData<T extends Record<string, any>>(
  toolKey: string,
  defaultData: T,
): {
  data: T;
  setData: (updater: T | ((prev: T) => T)) => void;
  saveStatus: SaveStatus;
  projectId: string | null;
} {
  const { currentProject } = useProject();
  const projectId = currentProject?.id ?? null;

  const [data, setDataRaw] = useState<T>(defaultData);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>('');
  const loadedProjectRef = useRef<string | null>(null);

  // Wrapped setter that accepts value or updater function
  const setData = useCallback((updater: T | ((prev: T) => T)) => {
    setDataRaw(updater);
  }, []);

  // Load data when project changes
  useEffect(() => {
    if (!projectId) {
      // No project — reset to defaults if we were on a different project
      if (loadedProjectRef.current !== null) {
        setDataRaw(defaultData);
        loadedProjectRef.current = null;
        lastSavedRef.current = '';
      }
      return;
    }

    // Don't reload if same project
    if (loadedProjectRef.current === projectId) return;

    loadedProjectRef.current = projectId;
    lastSavedRef.current = '';

    fetch(`/api/projects/data?projectId=${projectId}&toolKey=${toolKey}`)
      .then((r) => r.json())
      .then((result) => {
        if (result.data && Object.keys(result.data).length > 0) {
          // Merge with defaults so missing fields don't break UI
          setDataRaw((prev) => ({ ...prev, ...defaultData, ...result.data }));
          lastSavedRef.current = JSON.stringify(result.data);
        } else {
          setDataRaw(defaultData);
        }
      })
      .catch(() => {
        // Silent fail on load — use defaults
      });
  }, [projectId, toolKey, defaultData]);

  // Debounced auto-save on data changes
  useEffect(() => {
    if (!projectId) return;

    const serialized = JSON.stringify(data);
    // Skip if unchanged from last save or from just-loaded data
    if (serialized === lastSavedRef.current) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(() => {
      setSaveStatus('saving');

      fetch('/api/projects/data', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, toolKey, data }),
      })
        .then((r) => {
          if (r.ok) {
            lastSavedRef.current = serialized;
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
          } else {
            setSaveStatus('error');
          }
        })
        .catch(() => {
          setSaveStatus('error');
        });
    }, 1000);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [data, projectId, toolKey]);

  return { data, setData, saveStatus, projectId };
}

export function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === 'idle') return null;

  return (
    <span className={`text-[11px] transition-opacity ${
      status === 'saving' ? 'text-amber' :
      status === 'saved' ? 'text-green' :
      'text-red'
    }`}>
      {status === 'saving' ? 'Saving...' :
       status === 'saved' ? 'Saved' :
       'Save failed'}
    </span>
  );
}
