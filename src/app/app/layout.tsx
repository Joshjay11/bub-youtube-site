'use client';

import { Suspense } from 'react';
import Sidebar from '@/components/app/Sidebar';
import { ProjectProvider } from '@/lib/project-context';
import Onboarding from '@/components/app/Onboarding';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProjectProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        {/* Main content: responsive margin for sidebar */}
        <main className="flex-1 ml-0 md:ml-[240px] p-4 md:p-8 pt-[68px] md:pt-8 transition-all duration-300">
          {children}
        </main>
      </div>
      <Suspense fallback={null}>
        <Onboarding />
      </Suspense>
    </ProjectProvider>
  );
}
