'use client';

import { useState, useEffect, useRef } from 'react';
import { useProject } from '@/lib/project-context';
import { loadProjectBundle } from '@/lib/project-bundle';
import { useProjectData, SaveIndicator } from '@/lib/use-project-data';
import { useRegisterPageContext } from '@/contexts/PageContextProvider';
import { notifyCreditChange } from '@/components/app/CreditHealthBar';

interface ExportData {
  elevenlabs_version: string;
  converted_script: string;
  character_count: number;
  needs_split: boolean;
}

const DEFAULTS: ExportData = { elevenlabs_version: 'v3', converted_script: '', character_count: 0, needs_split: false };

export default function ElevenLabsExport() {
  const { currentProject } = useProject();
  const { data, setData, saveStatus } = useProjectData<ExportData>('post_production', DEFAULTS);
  const [scriptText, setScriptText] = useState('');
  const [version, setVersion] = useState<'v2' | 'v3'>(data.elevenlabs_version === 'v2' ? 'v2' : 'v3');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!currentProject?.id) return;
    loadProjectBundle(currentProject.id).then((bundle) => {
      const ws = bundle.write as { script_draft?: string } | undefined;
      if (ws?.script_draft) setScriptText(ws.script_draft);
    }).catch(() => {});
  }, [currentProject?.id]);

  async function handleConvert() {
    if (!scriptText.trim() || loading) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/ai/elevenlabs-convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script: scriptText, version }),
      });
      const result = await res.json();
      if (result.converted_script) {
        setData({ elevenlabs_version: version, converted_script: result.converted_script, character_count: result.character_count, needs_split: result.needs_split });
        notifyCreditChange();
      } else {
        setError(result.error || 'Conversion failed.');
      }
    } catch { setError('Connection error.'); }
    setLoading(false);
  }

  function handleCopy() {
    navigator.clipboard.writeText(data.converted_script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const blob = new Blob([data.converted_script], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `elevenlabs-${version}-script.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const wrapperRef = useRef<HTMLDivElement>(null);
  useRegisterPageContext('elevenlabs_export', 'ElevenLabs Export', () => {
    return `Tool: ElevenLabs Export\nVersion: ${version}\nConverted: ${data.converted_script ? 'Yes' : 'No'}\nChars: ${data.character_count}`;
  }, wrapperRef);

  return (
    <div ref={wrapperRef} className="space-y-5">
      <div className="flex items-center gap-3">
        <div>
          <h2 className="font-serif text-[22px] text-text-bright">ElevenLabs Voiceover Export</h2>
          <p className="text-text-dim text-[13px] mt-1">Convert your script into ElevenLabs-ready format with proper tags.</p>
        </div>
        <SaveIndicator status={saveStatus} />
      </div>

      {/* Version selector */}
      <div className="flex gap-2">
        <button onClick={() => setVersion('v2')} className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${version === 'v2' ? 'bg-amber text-bg' : 'bg-bg-card text-text-dim border border-border'}`}>V2 / V2.5</button>
        <button onClick={() => setVersion('v3')} className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${version === 'v3' ? 'bg-amber text-bg' : 'bg-bg-card text-text-dim border border-border'}`}>V3</button>
      </div>
      <p className="text-[12px] text-text-muted">
        {version === 'v2' ? 'Uses <break> tags for pauses. Compatible with Multilingual V2 and Turbo V2.5 voices.' : 'Uses audio tags like [excited] for emotion. Compatible with Multilingual V3 voices. More expressive.'}
      </p>

      <button onClick={handleConvert} disabled={!scriptText.trim() || loading} className="flex items-center gap-2 px-5 py-2.5 bg-amber text-bg text-[14px] font-medium rounded-xl border-none cursor-pointer transition-all hover:bg-amber-bright hover:text-bg disabled:opacity-50 disabled:cursor-not-allowed">
        {loading ? 'Converting...' : 'Convert for ElevenLabs'} <span className="text-[12px] opacity-70">(1 credit)</span>
      </button>

      {error && <div className="text-[13px] text-red bg-red/5 border border-red/20 rounded-lg px-4 py-3">{error}</div>}

      {data.converted_script && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-text-muted">{data.character_count.toLocaleString()} characters</span>
            <div className="flex gap-2">
              <button onClick={handleCopy} className="text-[12px] text-text-muted hover:text-text-dim bg-transparent border border-border rounded-lg px-3 py-1.5 cursor-pointer hover:border-border-light">{copied ? 'Copied ✓' : 'Copy'}</button>
              <button onClick={handleDownload} className="text-[12px] text-text-muted hover:text-text-dim bg-transparent border border-border rounded-lg px-3 py-1.5 cursor-pointer hover:border-border-light">Download .txt</button>
            </div>
          </div>
          {data.needs_split && (
            <div className="text-[12px] text-amber bg-amber/5 border border-amber/20 rounded-lg px-4 py-2">
              Script exceeds 5,000 characters. Split markers have been added — generate each section separately in ElevenLabs.
            </div>
          )}
          <div className="bg-bg-card border border-border rounded-xl p-5 max-h-[400px] overflow-y-auto">
            <pre className="text-[13px] text-text-primary leading-relaxed whitespace-pre-wrap font-mono">{data.converted_script}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
