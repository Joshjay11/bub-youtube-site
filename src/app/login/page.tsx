'use client';

import { Suspense } from 'react';
import MarketingLayout from '@/components/marketing/MarketingLayout';
import MagicLinkForm from '@/components/auth/MagicLinkForm';

export default function LoginPage() {
  return (
    <MarketingLayout>
      <section className="max-w-[600px] mx-auto px-8 pt-40 pb-24">
        <Suspense fallback={
          <div className="text-center text-text-muted">Loading...</div>
        }>
          <MagicLinkForm
            headline="Welcome back"
            subhead="Enter your email and we'll send you a magic link. No password needed."
            helperText="Use the email you subscribed with."
          />
        </Suspense>
      </section>
    </MarketingLayout>
  );
}
