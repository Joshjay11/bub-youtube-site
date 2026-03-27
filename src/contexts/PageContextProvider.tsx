'use client';

import { createContext, useContext, useCallback, useRef, useEffect, type ReactNode } from 'react';

type GetPageContext = () => string | null;

interface PageContextValue {
  registerPageContext: (id: string, fn: GetPageContext) => void;
  unregisterPageContext: (id: string) => void;
  getPageContext: () => string | null;
}

const PageContextCtx = createContext<PageContextValue>({
  registerPageContext: () => {},
  unregisterPageContext: () => {},
  getPageContext: () => null,
});

export function PageContextProvider({ children }: { children: ReactNode }) {
  const contextFns = useRef<Map<string, GetPageContext>>(new Map());

  const registerPageContext = useCallback((id: string, fn: GetPageContext) => {
    contextFns.current.set(id, fn);
  }, []);

  const unregisterPageContext = useCallback((id: string) => {
    contextFns.current.delete(id);
  }, []);

  // Calls each registered function FRESH — no caching
  const getPageContext = useCallback(() => {
    const parts: string[] = [];
    for (const fn of contextFns.current.values()) {
      const ctx = fn();
      if (ctx) parts.push(ctx);
    }
    return parts.length > 0 ? parts.join('\n\n') : null;
  }, []);

  return (
    <PageContextCtx.Provider value={{ registerPageContext, unregisterPageContext, getPageContext }}>
      {children}
    </PageContextCtx.Provider>
  );
}

export const usePageContext = () => useContext(PageContextCtx);

/**
 * Hook to register a page context function that always reads the latest state.
 * Uses a ref so the registered function is never stale — it always calls
 * through to the latest buildContext.
 */
export function useRegisterPageContext(id: string, buildContext: () => string | null) {
  const { registerPageContext, unregisterPageContext } = usePageContext();
  const buildRef = useRef(buildContext);

  // Always keep the ref up to date (runs every render, no effect needed)
  buildRef.current = buildContext;

  useEffect(() => {
    // Register a stable wrapper that calls through the ref
    registerPageContext(id, () => buildRef.current());
    return () => unregisterPageContext(id);
  }, [id, registerPageContext, unregisterPageContext]);
}
