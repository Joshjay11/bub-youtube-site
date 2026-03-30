'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { type PromptTemplate, injectVariables } from '@/lib/prompts';
import { useRegisterPageContext } from '@/contexts/PageContextProvider';

interface SavedPromptState {
  values: Record<string, string>;
  output: string;
}

interface PromptRunnerProps {
  prompt: PromptTemplate;
  prefill?: Record<string, string>;
  savedState?: SavedPromptState;
  onStateChange?: (state: SavedPromptState) => void;
  onKeepOutput?: (output: string) => void;
  keptOutput?: string | null;
  pick?: string;
  onPickChange?: (text: string) => void;
}

const MULTI_OPTION_PROMPTS = new Set(['find-angle', 'cross-disciplinary', 'counter-arguments', 'hook-variants']);

function parseOutputItems(text: string): string[] {
  // Strategy 1: Split by markdown headers (## 1, ### 1, **1., etc.)
  const headerChunks = text.split(/\n(?=#{1,3}\s*\d+|#{1,3}\s*\*?\*?(?:Objection|Argument|Counter|Connection|Angle|Hook)\b|\*\*\d+[\.\)])/i);
  if (headerChunks.length >= 3) {
    return headerChunks.map((c) => c.trim()).filter((c) => c.length > 20);
  }

  // Strategy 2: Split by numbered patterns at line start, keeping everything until next number
  const numbered = text.split(/\n(?=\d+[\.\)]\s)/);
  if (numbered.length >= 3) {
    return numbered.map((c) => c.trim()).filter((c) => c.length > 20);
  }

  // Strategy 3: Split by bold numbered patterns
  const boldNumbered = text.split(/\n(?=\*\*\d+)/);
  if (boldNumbered.length >= 3) {
    return boldNumbered.map((c) => c.trim()).filter((c) => c.length > 20);
  }

  // Fallback: double newline paragraphs (but only if we get reasonable count)
  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter((p) => p.length > 20);
  return paragraphs.length >= 2 && paragraphs.length <= 8 ? paragraphs : [];
}

export default function PromptRunner({ prompt, prefill, savedState, onStateChange, onKeepOutput, keptOutput, pick, onPickChange }: PromptRunnerProps) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const empty = Object.fromEntries(prompt.variables.map((v) => [v.key, '']));
    // Priority: saved state → prefill → empty
    if (savedState?.values) {
      for (const [k, v] of Object.entries(savedState.values)) {
        if (v && k in empty) empty[k] = v;
      }
    }
    // Only apply prefill to still-empty fields
    if (prefill) {
      for (const [k, v] of Object.entries(prefill)) {
        if (v && k in empty && !empty[k]) empty[k] = v;
      }
    }
    return empty;
  });
  const [output, setOutput] = useState(savedState?.output || '');
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState('');
  const [remaining, setRemaining] = useState<number | null>(null);
  const [source, setSource] = useState<string>('');
  const [needsUpgrade, setNeedsUpgrade] = useState(false);
  const [copied, setCopied] = useState(false);
  const [kept, setKept] = useState(!!keptOutput);
  const abortRef = useRef<AbortController | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Register page context for Thinking Partner
  const wrapperRef = useRef<HTMLDivElement>(null);
  useRegisterPageContext('prompt_runner', `AI Prompt: ${prompt.code} ${prompt.title}`, () => {
    const lines = [`Tool: AI Prompt Runner`, `Active Prompt: ${prompt.code} — ${prompt.title}`];
    for (const v of prompt.variables) {
      const val = values[v.key]?.trim();
      lines.push(`  ${v.label}: ${val || '(empty)'}`);
    }
    if (output) {
      lines.push(`\nAI Output (preview): ${output.slice(0, 200)}${output.length > 200 ? '...' : ''}`);
    } else {
      lines.push('\nAI Output: (not run yet)');
    }
    return lines.join('\n');
  }, wrapperRef);

  // Fetch remaining runs on mount
  useEffect(() => {
    fetch('/api/ai/run-prompt')
      .then((r) => r.json())
      .then((data) => {
        setRemaining(data.remaining);
        setSource(data.source || '');
        setNeedsUpgrade(data.source === 'none');
      })
      .catch(() => {});
  }, []);

  // Debounced save on values or output change
  useEffect(() => {
    if (!onStateChange) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      onStateChange({ values, output });
    }, 1000);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [values, output, onStateChange]);

  const allFilled = prompt.variables.every((v) => values[v.key].trim().length > 0);

  const handleRun = useCallback(async () => {
    if (!allFilled || isRunning) return;

    setIsRunning(true);
    setOutput('');
    setError('');
    setCopied(false);
    setKept(false);

    const injected = injectVariables(prompt.template, values);
    abortRef.current = new AbortController();

    try {
      const response = await fetch('/api/ai/run-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: injected }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Request failed');
        if (data.remaining !== undefined) setRemaining(data.remaining);
        if (data.needsUpgrade) setNeedsUpgrade(true);
        setIsRunning(false);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        setError('Failed to read response stream');
        setIsRunning(false);
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6);
          try {
            const event = JSON.parse(jsonStr);
            if (event.type === 'meta') {
              setRemaining(event.remaining);
              if (event.source) setSource(event.source);
            } else if (event.type === 'text') {
              setOutput((prev) => prev + event.text);
            } else if (event.type === 'error') {
              setError(event.error);
            }
          } catch {
            // skip malformed JSON
          }
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // User cancelled
      } else {
        setError(err instanceof Error ? err.message : 'Request failed');
      }
    }

    setIsRunning(false);
  }, [allFilled, isRunning, prompt.template, values]);

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
    setIsRunning(false);
  }, []);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [output]);

  const handleClear = useCallback(() => {
    setOutput('');
    setError('');
  }, []);

  const handleKeep = useCallback(() => {
    if (output && onKeepOutput) {
      onKeepOutput(output);
      setKept(true);
    }
  }, [output, onKeepOutput]);

  // Render the template with highlighted variables
  function renderTemplate() {
    const parts = prompt.template.split(/(\{\{\w+\}\})/g);
    return parts.map((part, i) => {
      const match = part.match(/^\{\{(\w+)\}\}$/);
      if (match) {
        const key = match[1];
        const variable = prompt.variables.find((v) => v.key === key);
        const filled = values[key]?.trim();
        return (
          <span
            key={i}
            className={`inline px-1 rounded font-sans text-[13px] ${
              filled ? 'bg-amber/20 text-amber' : 'bg-amber/10 text-amber-dim'
            }`}
          >
            {filled || variable?.label || key}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  }

  return (
    <div ref={wrapperRef} className="space-y-5">
      {/* Prompt preview */}
      <div className="bg-bg-elevated border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[12px] text-text-muted uppercase tracking-wider">Prompt Template</span>
          {remaining !== null && (
            <span className="text-[12px] text-text-muted">
              {source === 'byok' ? (
                <span className="text-green">Using your API key</span>
              ) : remaining === -1 ? (
                <span className="text-green">Unlimited (BYOK)</span>
              ) : (
                <><span className={remaining === 0 ? 'text-red' : 'text-amber'}>{remaining}</span> credits remaining</>
              )}
            </span>
          )}
        </div>
        <pre className="text-[13px] text-text-dim font-mono whitespace-pre-wrap leading-relaxed">
          {renderTemplate()}
        </pre>
      </div>

      {/* Variable inputs */}
      <div className="space-y-3">
        {prompt.variables.map((variable) => (
          <div key={variable.key}>
            <label className="block text-[13px] text-text-bright mb-1.5">
              {variable.label}
            </label>
            {variable.multiline ? (
              <textarea
                value={values[variable.key]}
                onChange={(e) => setValues((prev) => ({ ...prev, [variable.key]: e.target.value }))}
                placeholder={variable.placeholder}
                rows={4}
                className="w-full bg-bg-card border border-border rounded-lg px-4 py-3 text-[14px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber/50 focus:ring-1 focus:ring-amber/20 transition-colors resize-y"
              />
            ) : (
              <input
                type="text"
                value={values[variable.key]}
                onChange={(e) => setValues((prev) => ({ ...prev, [variable.key]: e.target.value }))}
                placeholder={variable.placeholder}
                className="w-full bg-bg-card border border-border rounded-lg px-4 py-3 text-[14px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber/50 focus:ring-1 focus:ring-amber/20 transition-colors"
              />
            )}
          </div>
        ))}
      </div>

      {/* Upgrade prompt */}
      {needsUpgrade && (
        <div className="bg-amber/5 border border-amber/20 rounded-xl p-5">
          <div className="text-[15px] text-text-bright font-medium mb-2">No AI credits remaining</div>
          <p className="text-[13px] text-text-dim mb-3">
            Add your own Anthropic API key in{' '}
            <a href="/app/settings" className="text-amber hover:text-amber-bright transition-colors">Settings</a>
            {' '}for unlimited prompts, or subscribe for more credits.
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-3">
        {!isRunning ? (
          <button
            onClick={handleRun}
            disabled={!allFilled || remaining === 0 || needsUpgrade}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] font-medium transition-all ${
              allFilled && remaining !== 0 && !needsUpgrade
                ? 'bg-amber hover:bg-amber-bright hover:text-bg text-bg'
                : 'bg-bg-card text-text-muted cursor-not-allowed border border-border'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Run with AI
          </button>
        ) : (
          <button
            onClick={handleStop}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] font-medium bg-red/10 text-red border border-red/20 hover:bg-red/20 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            </svg>
            Stop
          </button>
        )}

        {output && !isRunning && (
          <>
            <button
              onClick={handleRun}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] text-text-dim border border-border hover:border-border-light hover:text-text-primary transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Run Again
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] text-text-dim border border-border hover:border-border-light hover:text-text-primary transition-colors"
            >
              {copied ? (
                <><svg className="w-3.5 h-3.5 text-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> Copied</>
              ) : (
                <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> Copy Output</>
              )}
            </button>
            {onKeepOutput && (
              <button
                onClick={handleKeep}
                disabled={kept}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] transition-colors ${
                  kept
                    ? 'text-green border border-green/20'
                    : 'text-amber border border-amber/20 hover:bg-amber/10'
                }`}
              >
                {kept ? (
                  <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> Kept</>
                ) : (
                  'Keep This Output'
                )}
              </button>
            )}
            <button
              onClick={handleClear}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] text-text-muted hover:text-text-dim transition-colors"
            >
              Clear
            </button>
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red/5 border border-red/20 rounded-xl px-5 py-3 text-[14px] text-red">{error}</div>
      )}

      {/* Output */}
      {(output || isRunning) && (() => {
        const isMulti = MULTI_OPTION_PROMPTS.has(prompt.id);
        const items = isMulti && output && !isRunning ? parseOutputItems(output) : [];
        const showPerItem = items.length >= 2;

        // Append to pick instead of replacing
        function appendToPick(text: string) {
          if (!onPickChange) return;
          const current = (pick ?? '').trim();
          onPickChange(current ? `${current}\n\n${text}` : text);
        }

        return (
          <div ref={outputRef} className="bg-bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[12px] text-text-muted uppercase tracking-wider">AI Output</span>
              <div className="flex items-center gap-2">
                {/* Single "Keep This" for non-multi or single-output prompts */}
                {!isRunning && output && !showPerItem && onPickChange && (
                  <button
                    onClick={() => appendToPick(output)}
                    className="text-[11px] text-amber hover:text-amber-bright transition-colors bg-transparent border border-amber/20 rounded px-2 py-1 cursor-pointer hover:bg-amber/10"
                  >
                    Keep this
                  </button>
                )}
                {isRunning && (
                  <span className="flex items-center gap-2 text-[12px] text-amber">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber animate-pulse" />
                    Generating...
                  </span>
                )}
              </div>
            </div>
            {showPerItem ? (
              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div key={idx} className="group relative bg-bg-elevated border border-border/50 rounded-lg p-4">
                    <div className="text-[14px] text-text-primary leading-relaxed whitespace-pre-wrap pr-16">{item}</div>
                    <button
                      onClick={() => appendToPick(item)}
                      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-[11px] text-amber hover:text-amber-bright transition-all bg-transparent border border-amber/20 rounded px-2 py-1 cursor-pointer hover:bg-amber/10"
                    >
                      Keep this
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[14px] text-text-primary leading-relaxed whitespace-pre-wrap">
                {output || <span className="text-text-muted">Waiting for response...</span>}
              </div>
            )}
          </div>
        );
      })()}

      {/* Your Pick field — always shown after output for all tabs */}
      {output && !isRunning && onPickChange && (
        <div>
          <label className="block text-[13px] text-text-bright mb-1.5">Your Pick</label>
          <textarea
            value={pick ?? ''}
            onChange={(e) => onPickChange(e.target.value)}
            placeholder="Paste or type the angle/insight you're going with. This carries forward into your Running Brief."
            rows={3}
            className="w-full bg-bg-card border border-border rounded-lg px-4 py-3 text-[14px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber/50 focus:ring-1 focus:ring-amber/20 transition-colors resize-y"
          />
        </div>
      )}

      {/* Tips */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-bg-elevated border border-border rounded-lg p-4">
          <div className="text-[12px] text-green font-medium mb-1">Good output looks like</div>
          <div className="text-[13px] text-text-dim">{prompt.goodOutput}</div>
        </div>
        <div className="bg-bg-elevated border border-border rounded-lg p-4">
          <div className="text-[12px] text-red font-medium mb-1">Red flags</div>
          <div className="text-[13px] text-text-dim">{prompt.redFlags}</div>
        </div>
      </div>
      {prompt.weakOutputTip && (
        <div className="bg-bg-elevated border border-border rounded-lg p-4">
          <div className="text-[12px] text-amber font-medium mb-1">If the output is weak</div>
          <div className="text-[13px] text-text-dim">{prompt.weakOutputTip}</div>
        </div>
      )}
    </div>
  );
}
