'use client';

import { useState, useEffect, useRef } from 'react';
import { useProject } from '@/lib/project-context';
import { loadProjectBundle } from '@/lib/project-bundle';
import { useProjectData, SaveIndicator } from '@/lib/use-project-data';
import { useRegisterPageContext } from '@/contexts/PageContextProvider';
import { notifyCreditChange } from '@/components/app/CreditHealthBar';

interface AuditResult {
  criterion: string;
  status: 'pass' | 'fail';
  explanation: string;
  suggestion: string | null;
}

interface AuditData {
  audit_results: AuditResult[];
  passed_count: number;
  failed_count: number;
  last_run: string;
}

const DEFAULTS: AuditData = { audit_results: [], passed_count: 0, failed_count: 0, last_run: '' };

export default function RetentionAudit() {
  const { currentProject } = useProject();
  const { data, setData, saveStatus } = useProjectData<AuditData>('optimize', DEFAULTS);

  const [scriptText, setScriptText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentProject?.id) return;
    loadProjectBundle(currentProject.id).then((bundle) => {
      const ws = bundle.write as { script_draft?: string } | undefined;
      if (ws?.script_draft) setScriptText(ws.script_draft);
    }).catch(() => {});
  }, [currentProject?.id]);

  async function handleRun() {
    if (!scriptText.trim() || loading) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/ai/retention-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scriptText: scriptText.trim() }),
      });

      const result = await res.json();

      if (result.audit?.results) {
        const results: AuditResult[] = result.audit.results;
        const passed = results.filter((r) => r.status === 'pass').length;
        const failed = results.filter((r) => r.status === 'fail').length;
        setData({
          audit_results: results,
          passed_count: passed,
          failed_count: failed,
          last_run: new Date().toISOString(),
        });
        notifyCreditChange();
      } else if (result.needsUpgrade) {
        setError('No AI credits remaining. Add your API key in Settings.');
      } else {
        setError(result.error || 'Audit failed.');
      }
    } catch {
      setError('Connection error. Please try again.');
    }
    setLoading(false);
  }

  const results = data.audit_results || [];
  const hasResults = results.length > 0;
  // Sort: failed first, then passed
  const sorted = [...results].sort((a, b) => {
    if (a.status === 'fail' && b.status === 'pass') return -1;
    if (a.status === 'pass' && b.status === 'fail') return 1;
    return 0;
  });

  const wrapperRef = useRef<HTMLDivElement>(null);
  useRegisterPageContext('retention_audit', 'Retention Audit', () => {
    if (!hasResults) return 'Tool: Retention Audit\nStatus: Not run yet';
    return `Tool: Retention Audit\nPassed: ${data.passed_count}/10\nFailed: ${data.failed_count}/10\nFailed items: ${results.filter((r) => r.status === 'fail').map((r) => r.criterion).join(', ')}`;
  }, wrapperRef);

  return (
    <div ref={wrapperRef} className="space-y-5">
      <div className="flex items-center gap-3">
        <div>
          <h2 className="font-serif text-[24px] text-text-bright">Retention Audit</h2>
          <p className="text-text-dim text-[13px] mt-1">AI scans your script against 10 MUST PASS retention criteria.</p>
        </div>
        <SaveIndicator status={saveStatus} />
      </div>

      {!scriptText ? (
        <div className="bg-bg-card border border-border rounded-xl p-6 text-center">
          <p className="text-text-muted text-[14px]">No script found. <a href="/app/write" className="text-amber hover:text-amber-bright">Generate your script on the Write page first.</a></p>
        </div>
      ) : (
        <button
          onClick={handleRun}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-amber text-bg text-[14px] font-medium rounded-xl border-none cursor-pointer transition-all hover:bg-amber-bright hover:text-bg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading && (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {loading ? 'Auditing...' : 'Run Retention Audit'} <span className="text-[12px] opacity-70">(1 credit)</span>
        </button>
      )}

      {error && <div className="text-[13px] text-red bg-red/5 border border-red/20 rounded-lg px-4 py-3">{error}</div>}

      {hasResults && (
        <div className="space-y-4">
          {/* Summary bar */}
          <div className="bg-bg-card border border-border rounded-xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <div className="text-[28px] font-mono font-bold text-green">{data.passed_count}</div>
                <div className="text-[11px] text-text-muted">PASSED</div>
              </div>
              <div className="w-px h-10 bg-border" />
              <div>
                <div className="text-[28px] font-mono font-bold text-red">{data.failed_count}</div>
                <div className="text-[11px] text-text-muted">FAILED</div>
              </div>
            </div>
            <div className="text-[14px] text-text-dim">
              {data.failed_count === 0 ? (
                <span className="text-green font-medium">All MUST PASS criteria met. Ready to record.</span>
              ) : (
                <span className="text-red">{data.failed_count} item{data.failed_count !== 1 ? 's' : ''} need{data.failed_count === 1 ? 's' : ''} attention before recording.</span>
              )}
            </div>
          </div>

          {/* Results cards — failed first */}
          <div className="space-y-3">
            {sorted.map((result, i) => {
              const pass = result.status === 'pass';
              return (
                <div key={i} className={`bg-bg-card border rounded-xl p-5 ${pass ? 'border-green/20' : 'border-red/20'}`} style={{ borderLeftWidth: 3, borderLeftColor: pass ? '#22c55e' : '#ef4444' }}>
                  <div className="flex items-start gap-3">
                    <span className={`shrink-0 mt-0.5 text-[16px] ${pass ? 'text-green' : 'text-red'}`}>
                      {pass ? '✅' : '❌'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className={`text-[14px] font-medium ${pass ? 'text-text-bright' : 'text-red'}`}>
                        {result.criterion}
                      </div>
                      <p className="text-[13px] text-text-dim mt-1.5 leading-relaxed">{result.explanation}</p>
                      {!pass && result.suggestion && (
                        <div className="mt-2 pl-3 border-l-2 border-amber/30">
                          <span className="text-[12px] text-amber font-medium">Suggestion: </span>
                          <span className="text-[12px] text-text-dim">{result.suggestion}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
