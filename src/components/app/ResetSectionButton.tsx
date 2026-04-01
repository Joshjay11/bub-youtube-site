'use client';

import { useState } from 'react';
import { useProject } from '@/lib/project-context';

interface ResetSectionButtonProps {
  toolKeys: string[];
  label?: string;
}

export default function ResetSectionButton({ toolKeys, label = 'Reset Section' }: ResetSectionButtonProps) {
  const { currentProject } = useProject();
  const [confirming, setConfirming] = useState(false);
  const [resetting, setResetting] = useState(false);

  async function handleReset() {
    if (!currentProject?.id || resetting) return;
    setResetting(true);

    try {
      await Promise.all(
        toolKeys.map((key) =>
          fetch('/api/projects/data', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectId: currentProject.id, toolKey: key, data: {} }),
          })
        )
      );
      // Reload the page to reset all component state
      window.location.reload();
    } catch {
      setResetting(false);
      setConfirming(false);
    }
  }

  if (!currentProject) return null;

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-[12px] text-text-muted">Reset this section?</span>
        <button
          onClick={handleReset}
          disabled={resetting}
          className="text-[12px] text-red hover:text-red/80 bg-transparent border border-red/20 rounded px-2 py-1 cursor-pointer hover:bg-red/10 transition-colors disabled:opacity-50"
        >
          {resetting ? 'Resetting...' : 'Confirm'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-[12px] text-text-muted hover:text-text-dim bg-transparent border-none cursor-pointer"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="flex items-center gap-1.5 text-[12px] text-text-muted hover:text-text-dim bg-transparent border-none cursor-pointer transition-colors"
      title="Clear all data on this page"
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
      </svg>
      {label}
    </button>
  );
}
