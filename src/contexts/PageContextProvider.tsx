'use client';

import { createContext, useContext, useCallback, useRef, useEffect, type ReactNode, type RefObject } from 'react';

type GetPageContext = () => string;

interface ToolRegistration {
  buildContext: GetPageContext;
  isVisible: () => boolean;
  label: string;
}

interface PageContextValue {
  registerPageContext: (id: string, reg: ToolRegistration) => void;
  unregisterPageContext: (id: string) => void;
  getPageContext: () => string | null;
}

const PageContextCtx = createContext<PageContextValue>({
  registerPageContext: () => {},
  unregisterPageContext: () => {},
  getPageContext: () => null,
});

export function PageContextProvider({ children }: { children: ReactNode }) {
  const tools = useRef<Map<string, ToolRegistration>>(new Map());

  const registerPageContext = useCallback((id: string, reg: ToolRegistration) => {
    tools.current.set(id, reg);
  }, []);

  const unregisterPageContext = useCallback((id: string) => {
    tools.current.delete(id);
  }, []);

  const getPageContext = useCallback(() => {
    const visibleParts: string[] = [];
    const otherParts: string[] = [];

    for (const [, reg] of tools.current) {
      const ctx = reg.buildContext();
      if (!ctx) continue;

      if (reg.isVisible()) {
        visibleParts.push(`[CURRENTLY VIEWING - ${reg.label}]\n${ctx}\n[END CURRENTLY VIEWING]`);
      } else {
        otherParts.push(ctx);
      }
    }

    const all = [...visibleParts, ...otherParts];
    return all.length > 0 ? all.join('\n\n') : null;
  }, []);

  return (
    <PageContextCtx.Provider value={{ registerPageContext, unregisterPageContext, getPageContext }}>
      {children}
    </PageContextCtx.Provider>
  );
}

export const usePageContext = () => useContext(PageContextCtx);

/**
 * Hook to register a page context function with visibility tracking.
 * The build function should ALWAYS return a string (include empty field labels).
 * The ref is used to detect whether the component is in the viewport.
 */
export function useRegisterPageContext(
  id: string,
  label: string,
  buildContext: () => string,
  wrapperRef: RefObject<HTMLElement | null>,
) {
  const { registerPageContext, unregisterPageContext } = usePageContext();
  const buildRef = useRef(buildContext);
  const visibleRef = useRef(false);

  // Keep build function fresh
  buildRef.current = buildContext;

  // IntersectionObserver for viewport detection
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => { visibleRef.current = entry.isIntersecting; },
      { threshold: 0.2 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [wrapperRef]);

  useEffect(() => {
    registerPageContext(id, {
      buildContext: () => buildRef.current(),
      isVisible: () => visibleRef.current,
      label,
    });
    return () => unregisterPageContext(id);
  }, [id, label, registerPageContext, unregisterPageContext]);
}
