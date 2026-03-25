'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { type PromptTemplate, injectVariables } from '@/lib/prompts';

interface PromptRunnerProps {
  prompt: PromptTemplate;
}

export default function PromptRunner({ prompt }: PromptRunnerProps) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(prompt.variables.map((v) => [v.key, '']))
  );
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState('');
  const [remaining, setRemaining] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  // Fetch remaining runs on mount
  useEffect(() => {
    fetch('/api/ai/run-prompt?user_id=demo')
      .then((r) => r.json())
      .then((data) => setRemaining(data.remaining))
      .catch(() => {});
  }, []);

  const allFilled = prompt.variables.every((v) => values[v.key].trim().length > 0);

  const handleRun = useCallback(async () => {
    if (!allFilled || isRunning) return;

    setIsRunning(true);
    setOutput('');
    setError('');
    setCopied(false);

    const injected = injectVariables(prompt.template, values);

    abortRef.current = new AbortController();

    try {
      const response = await fetch('/api/ai/run-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: injected, user_id: 'demo' }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Request failed');
        if (data.remaining !== undefined) setRemaining(data.remaining);
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
              filled
                ? 'bg-amber/20 text-amber'
                : 'bg-amber/10 text-amber-dim'
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
    <div className="space-y-5">
      {/* Prompt preview */}
      <div className="bg-bg-elevated border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[12px] text-text-muted uppercase tracking-wider">Prompt Template</span>
          {remaining !== null && (
            <span className="text-[12px] text-text-muted">
              <span className={remaining === 0 ? 'text-red' : 'text-amber'}>{remaining}</span> runs remaining today
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

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-3">
        {!isRunning ? (
          <button
            onClick={handleRun}
            disabled={!allFilled || remaining === 0}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] font-medium transition-all ${
              allFilled && remaining !== 0
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
                <>
                  <svg className="w-3.5 h-3.5 text-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Copied
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy Output
                </>
              )}
            </button>
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
        <div className="bg-red/5 border border-red/20 rounded-xl px-5 py-3 text-[14px] text-red">
          {error}
        </div>
      )}

      {/* Output */}
      {(output || isRunning) && (
        <div ref={outputRef} className="bg-bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[12px] text-text-muted uppercase tracking-wider">AI Output</span>
            {isRunning && (
              <span className="flex items-center gap-2 text-[12px] text-amber">
                <span className="w-1.5 h-1.5 rounded-full bg-amber animate-pulse" />
                Generating...
              </span>
            )}
          </div>
          <div className="text-[14px] text-text-primary leading-relaxed whitespace-pre-wrap">
            {output || <span className="text-text-muted">Waiting for response...</span>}
          </div>
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
