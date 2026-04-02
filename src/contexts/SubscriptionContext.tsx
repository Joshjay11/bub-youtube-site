'use client';

import { createContext, useContext, useState, useEffect } from 'react';

export type SubscriptionStatus = 'loading' | 'none' | 'active' | 'past_due' | 'canceled' | 'lapsed';

interface SubscriptionState {
  status: SubscriptionStatus;
  tier: string | null;
  isFoundingMember: boolean;
  currentPeriodEnd: string | null;
}

const SubscriptionContext = createContext<SubscriptionState>({
  status: 'loading',
  tier: null,
  isFoundingMember: false,
  currentPeriodEnd: null,
});

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SubscriptionState>({
    status: 'loading',
    tier: null,
    isFoundingMember: false,
    currentPeriodEnd: null,
  });

  useEffect(() => {
    fetch('/api/stripe/subscription-status')
      .then(res => res.json())
      .then(data => {
        setState({
          status: data.status || 'none',
          tier: data.tier || null,
          isFoundingMember: data.is_founding_member || false,
          currentPeriodEnd: data.current_period_end || null,
        });
      })
      .catch(() => {
        setState(prev => ({ ...prev, status: 'none' }));
      });
  }, []);

  return (
    <SubscriptionContext.Provider value={state}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}
