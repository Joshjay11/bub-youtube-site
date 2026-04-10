'use client';

import { Suspense } from 'react';
import MarketingLayout from '@/components/marketing/MarketingLayout';
import MagicLinkForm from '@/components/auth/MagicLinkForm';

const checkmarkIcon = (
  <div className="w-16 h-16 rounded-full bg-amber/10 flex items-center justify-center mx-auto mb-6">
    <svg className="w-8 h-8 text-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  </div>
);

export default function WelcomePage() {
  return (
    <MarketingLayout>
      <section className="max-w-[600px] mx-auto px-8 pt-40 pb-24">
        <Suspense fallback={
          <div className="text-center text-text-muted">Loading...</div>
        }>
          <MagicLinkForm
            headline="Payment confirmed!"
            subhead="Enter the email you used at checkout to get your access link. We&apos;ll send a magic link. No password needed."
            helperText="Use the same email you paid with so we can match your purchase."
            icon={checkmarkIcon}
            enableStripePrefill
          />
        </Suspense>
      </section>
    </MarketingLayout>
  );
}
