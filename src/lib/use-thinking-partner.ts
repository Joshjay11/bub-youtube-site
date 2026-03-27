'use client';

// Event-based communication with the ThinkingPartner widget.
// Any component can dispatch a 'thinking-partner:ask' custom event
// and the ThinkingPartner listens for it.

export interface ThinkingPartnerEvent {
  message: string;
}

export function askThinkingPartner(message: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<ThinkingPartnerEvent>('thinking-partner:ask', {
      detail: { message },
    }),
  );
}
