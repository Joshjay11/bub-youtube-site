'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { STAGE_MAP, STAGE_LABELS } from '@/lib/thinking-partner-prompts';
import { usePageContext } from '@/contexts/PageContextProvider';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function getStage(pathname: string): string {
  return (
    STAGE_MAP[pathname]
    || Object.entries(STAGE_MAP).find(([route]) => pathname.startsWith(route))?.[1]
    || 'reference'
  );
}

function stripPageContext(content: string): string {
  return content.replace(/\[CURRENT PAGE DATA\][\s\S]*?\[END PAGE DATA\]\n*/g, '').trim();
}

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="inline-flex items-center gap-1 text-[11px] text-text-muted hover:text-text-dim transition-colors bg-transparent border-none cursor-pointer p-0"
      title="Copy"
    >
      {copied ? (
        <svg className="w-3 h-3 text-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
      ) : (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
      )}
      {label && <span>{copied ? 'Copied' : label}</span>}
    </button>
  );
}

export default function ThinkingPartner() {
  const pathname = usePathname();
  const stage = getStage(pathname);
  const stageLabel = STAGE_LABELS[stage] || 'General';
  const { getPageContext } = usePageContext();

  const [open, setOpen] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const prevStageRef = useRef(stage);

  useEffect(() => {
    if (prevStageRef.current !== stage) {
      setMessages([]);
      setError('');
      prevStageRef.current = stage;
    }
  }, [stage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Listen for programmatic "ask" events
  useEffect(() => {
    function handleAskEvent(e: Event) {
      const detail = (e as CustomEvent).detail;
      if (detail?.message) {
        setOpen(true);
        setTimeout(() => {
          setInput(detail.message);
          setTimeout(() => {
            const sendBtn = document.querySelector('[data-tp-send]') as HTMLButtonElement;
            sendBtn?.click();
          }, 50);
        }, 100);
      }
    }
    window.addEventListener('thinking-partner:ask', handleAskEvent);
    return () => window.removeEventListener('thinking-partner:ask', handleAskEvent);
  }, []);

  const [captureUrl, setCaptureUrl] = useState<string | null>(null);

  async function handleCapturePage() {
    // Capture visible viewport screenshot + send text context
    try {
      const html2canvas = (await import('html2canvas')).default;

      // Capture the main content area at current scroll position
      const mainEl = document.querySelector('main') as HTMLElement;
      if (!mainEl) return;

      const scrollY = mainEl.scrollTop || window.scrollY;
      const canvas = await html2canvas(mainEl, {
        y: scrollY,
        height: window.innerHeight,
        windowHeight: window.innerHeight,
        useCORS: true,
        scale: 1,
        logging: false,
      });

      const dataUrl = canvas.toDataURL('image/png');
      setCaptureUrl(dataUrl);
    } catch {
      // Fallback: just send text context
    }

    // Always send text context to the AI (the model is text-only)
    let ctx: string | null = null;
    try { ctx = getPageContext(); } catch { /* ignore */ }
    const msg = ctx
      ? 'I just captured my screen. Here\'s the tool data from this page — what should I focus on next?'
      : 'Here\'s what I\'m looking at. What should I focus on next?';
    setInput(msg);
    setTimeout(() => {
      const sendBtn = document.querySelector('[data-tp-send]') as HTMLButtonElement;
      sendBtn?.click();
    }, 100);
  }

  function formatConversation(): string {
    return messages
      .map((m) => `${m.role === 'user' ? 'ME' : 'THINKING PARTNER'}: ${stripPageContext(m.content)}`)
      .join('\n\n');
  }

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming) return;

    const userMessage: Message = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setStreaming(true);
    setError('');

    // Inject FRESH page context (never crash on context failure)
    let pageContext: string | null = null;
    try {
      pageContext = getPageContext();
    } catch {
      // Context capture failed — send without context
    }
    const enrichedMessage = pageContext
      ? `[CURRENT PAGE DATA]\n${pageContext}\n[END PAGE DATA]\n\n${text}`
      : text;

    const cleanHistory = messages.slice(-20).map((m) => ({
      role: m.role,
      content: stripPageContext(m.content),
    }));

    abortRef.current = new AbortController();

    try {
      const res = await fetch('/api/ai/thinking-partner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: enrichedMessage,
          stage,
          history: cleanHistory,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Request failed');
        setStreaming(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setError('Failed to read response');
        setStreaming(false);
        return;
      }

      let assistantContent = '';
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

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
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === 'meta' && event.remaining !== undefined) {
              setRemaining(event.remaining);
            } else if (event.type === 'text') {
              assistantContent += event.text;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
                return updated;
              });
            } else if (event.type === 'error') {
              setError(event.error);
            }
          } catch {
            // skip
          }
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // cancelled
      } else {
        setError(err instanceof Error ? err.message : 'Connection error');
      }
    }

    setStreaming(false);
  }, [input, streaming, messages, stage, getPageContext]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleClear() {
    abortRef.current?.abort();
    setMessages([]);
    setError('');
    setStreaming(false);
    setCaptureUrl(null);
  }

  // Panel size classes
  const panelSize = maximized
    ? 'w-full md:w-[60vw] h-[90vh] md:h-[70vh]'
    : 'w-full md:w-[420px] h-[85vh] md:h-[540px]';

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-bg-card border border-amber/30 rounded-2xl text-[13px] text-amber font-medium shadow-lg hover:border-amber/50 hover:bg-bg-card-hover transition-all cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
          </svg>
          Thinking Partner
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <>
          {/* Mobile backdrop */}
          <div
            className="fixed inset-0 bg-bg/50 backdrop-blur-sm z-50 md:hidden"
            onClick={() => setOpen(false)}
          />

          <div className={`fixed bottom-0 right-0 md:bottom-4 md:right-4 z-50 ${panelSize} md:max-h-[80vh] bg-bg-elevated border border-border md:rounded-2xl flex flex-col shadow-2xl overflow-hidden transition-all duration-200`}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <svg className="w-4 h-4 text-amber shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                </svg>
                <span className="text-[14px] text-text-bright font-medium">Thinking Partner</span>
                <span className="text-[11px] text-text-muted bg-bg-card px-2 py-0.5 rounded">{stageLabel}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {remaining !== null && (
                  <span className="text-[11px] text-text-muted mr-1">{remaining}</span>
                )}
                {messages.length > 0 && (
                  <CopyButton text={formatConversation()} label="All" />
                )}
                {/* Capture page */}
                <button
                  onClick={handleCapturePage}
                  className="p-1.5 text-text-muted hover:text-amber transition-colors bg-transparent border-none cursor-pointer"
                  title="Capture page context"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                  </svg>
                </button>
                {/* Maximize */}
                <button
                  onClick={() => setMaximized(!maximized)}
                  className="p-1.5 text-text-muted hover:text-text-dim transition-colors bg-transparent border-none cursor-pointer hidden md:block"
                  title={maximized ? 'Minimize' : 'Maximize'}
                >
                  {maximized ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" /></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" /></svg>
                  )}
                </button>
                {/* Clear */}
                <button
                  onClick={handleClear}
                  className="p-1.5 text-text-muted hover:text-text-dim transition-colors bg-transparent border-none cursor-pointer"
                  title="Clear conversation"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                  </svg>
                </button>
                {/* Close */}
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 text-text-muted hover:text-text-dim transition-colors bg-transparent border-none cursor-pointer"
                  title="Close"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Screen capture thumbnail */}
            {captureUrl && (
              <div className="px-4 pt-3 pb-0 border-b border-border/30 shrink-0">
                <div className="flex items-start gap-2 mb-2">
                  <img
                    src={captureUrl}
                    alt="Screen capture"
                    className="w-full max-h-[120px] object-cover object-top rounded-lg border border-border/50 cursor-pointer"
                    onClick={() => window.open(captureUrl, '_blank')}
                    title="Click to view full size"
                  />
                  <button
                    onClick={() => setCaptureUrl(null)}
                    className="shrink-0 p-1 text-text-muted hover:text-text-dim transition-colors bg-transparent border-none cursor-pointer"
                    title="Dismiss"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-[10px] text-text-muted mb-2">Screen captured at current scroll position</p>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {messages.length === 0 && !streaming && (
                <div className="text-center py-8">
                  <p className="text-[14px] text-text-dim mb-2">Ask me anything about your current stage.</p>
                  <p className="text-[12px] text-text-muted">
                    I&apos;ll help you sharpen your thinking and find gaps. I won&apos;t write script prose — that&apos;s your job.
                  </p>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed relative group ${
                    msg.role === 'user'
                      ? 'bg-amber/15 text-text-bright rounded-br-md'
                      : 'bg-bg-card text-text-primary rounded-bl-md border border-border/50'
                  }`}>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                    {msg.role === 'assistant' && !msg.content && streaming && i === messages.length - 1 && (
                      <span className="inline-flex gap-1 py-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber animate-pulse" />
                        <span className="w-1.5 h-1.5 rounded-full bg-amber animate-pulse" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-amber animate-pulse" style={{ animationDelay: '300ms' }} />
                      </span>
                    )}
                    {/* Copy button on assistant messages */}
                    {msg.role === 'assistant' && msg.content && !streaming && (
                      <div className="absolute bottom-1 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <CopyButton text={msg.content} />
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {error && (
                <div className="text-[12px] text-red bg-red/5 border border-red/20 rounded-lg px-3 py-2">{error}</div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="shrink-0 border-t border-border px-4 py-3">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about your idea, research, structure..."
                  rows={1}
                  className="flex-1 bg-bg-card border border-border rounded-xl px-4 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber/50 focus:ring-1 focus:ring-amber/20 resize-none max-h-[120px]"
                  style={{ minHeight: '40px' }}
                />
                <button
                  data-tp-send
                  onClick={handleSend}
                  disabled={!input.trim() || streaming}
                  className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-amber text-bg transition-all hover:bg-amber-bright hover:text-bg disabled:opacity-40 disabled:cursor-not-allowed border-none cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
