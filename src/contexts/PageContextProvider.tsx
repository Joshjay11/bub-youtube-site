'use client';

import { createContext, useContext, useCallback, useRef, type ReactNode } from 'react';

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
