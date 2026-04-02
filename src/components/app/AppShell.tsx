'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/app/Sidebar';
import { ProjectProvider } from '@/lib/project-context';
import { PageContextProvider } from '@/contexts/PageContextProvider';
import { SubscriptionProvider, useSubscription } from '@/contexts/SubscriptionContext';
import Onboarding from '@/components/app/Onboarding';
import ThinkingPartner from '@/components/app/ThinkingPartner';

function SubscriptionBanner() {
  const { status, currentPeriodEnd } = useSubscription();

  if (status === 'loading' || status === 'active' || status === 'none') return null;

  const endDate = currentPeriodEnd
    ? new Date(currentPeriodEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  if (status === 'past_due') {
    return (
      <div className="bg-amber/10 border-b border-amber/20 px-4 py-3 text-center">
        <p className="text-[13px] text-amber">
          We had trouble processing your payment.{' '}
          <Link href="/app/settings" className="text-amber font-medium underline underline-offset-2">
            Update Payment &rarr;
          </Link>
        </p>
      </div>
    );
  }

  if (status === 'canceled') {
    return (
      <div className="bg-amber/10 border-b border-amber/20 px-4 py-3 text-center">
        <p className="text-[13px] text-amber">
          Your subscription ends{endDate ? ` on ${endDate}` : ' soon'}. Your work is still here.{' '}
          <Link href="/pricing" className="text-amber font-medium underline underline-offset-2">
            Resubscribe &rarr;
          </Link>
        </p>
      </div>
    );
  }

  if (status === 'lapsed') {
    return (
      <div className="bg-amber/10 border-b border-amber/20 px-4 py-3 text-center">
        <p className="text-[13px] text-amber">
          Your subscription has ended. Your work is still here.{' '}
          <Link href="/pricing" className="text-amber font-medium underline underline-offset-2">
            Resubscribe to continue &rarr;
          </Link>
        </p>
      </div>
    );
  }

  return null;
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ProjectProvider>
      <PageContextProvider>
        <SubscriptionProvider>
          <SubscriptionBanner />
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 ml-0 md:ml-[240px] p-4 md:p-8 pt-[68px] md:pt-8 transition-all duration-300">
              {children}
            </main>
          </div>
          <Suspense fallback={null}>
            <Onboarding />
          </Suspense>
          <ThinkingPartner />
        </SubscriptionProvider>
      </PageContextProvider>
    </ProjectProvider>
  );
}
