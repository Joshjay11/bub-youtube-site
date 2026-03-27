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

// Strip page context blocks from messages for clean history
function stripPageContext(content: string): string {
  return content.replace(/\[CURRENT PAGE DATA\][\s\S]*?\[END PAGE DATA\]\n*/g, '').trim();
}

export default function ThinkingPartner() {
  const pathname = usePathname();
  const stage = getStage(pathname);
  const stageLabel = STAGE_LABELS[stage] || 'General';
  const { getPageContext } = usePageContext();

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const prevStageRef = useRef(stage);

  // Reset conversation on stage change
  useEffect(() => {
    if (prevStageRef.current !== stage) {
      setMessages([]);
      setError('');
      prevStageRef.current = stage;
    }
  }, [stage]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming) return;

    // Show the raw user message in the chat UI
    const userMessage: Message = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setStreaming(true);
    setError('');

    // Inject current page context into the message sent to the API
    const pageContext = getPageContext();
    const enrichedMessage = pageContext
      ? `[CURRENT PAGE DATA]\n${pageContext}\n[END PAGE DATA]\n\n${text}`
      : text;

    // Build clean history (strip page context from previous messages)
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

      // Add empty assistant message that we'll append to
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
  }

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

          <div className="fixed bottom-0 right-0 md:bottom-4 md:right-4 z-50 w-full md:w-[420px] h-[85vh] md:h-[600px] md:max-h-[80vh] bg-bg-elevated border border-border md:rounded-2xl flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <svg className="w-4 h-4 text-amber shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                </svg>
                <span className="text-[14px] text-text-bright font-medium">Thinking Partner</span>
                <span className="text-[11px] text-text-muted bg-bg-card px-2 py-0.5 rounded">
                  {stageLabel}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {remaining !== null && (
                  <span className="text-[11px] text-text-muted mr-2">{remaining} left today</span>
                )}
                <button
                  onClick={handleClear}
                  className="p-1.5 text-text-muted hover:text-text-dim transition-colors bg-transparent border-none cursor-pointer"
                  title="Clear conversation"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                  </svg>
                </button>
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

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {messages.length === 0 && !streaming && (
                <div className="text-center py-8">
                  <p className="text-[14px] text-text-dim mb-2">Ask me anything about your current stage.</p>
                  <p className="text-[12px] text-text-muted">
                    I&apos;ll challenge your thinking, flag weak spots, and suggest directions. I won&apos;t write script prose — that&apos;s your job.
                  </p>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed ${
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
                  </div>
                </div>
              ))}

              {error && (
                <div className="text-[12px] text-red bg-red/5 border border-red/20 rounded-lg px-3 py-2">
                  {error}
                </div>
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
