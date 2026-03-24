'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const STEPS = [
  {
    title: 'Welcome to the BUB Script System',
    description: 'This is your complete YouTube scriptwriting toolkit. Every module, scorecard, and calculator from the template — now interactive.',
    icon: '🎬',
  },
  {
    title: 'Start with a Project',
    description: 'Create a project for each video idea. Your scorecards, scripts, and audit results are organized per project.',
    link: '/app/projects',
    linkLabel: 'Go to Projects',
  },
  {
    title: 'Validate Before You Write',
    description: 'Use the Idea Scorecard to kill bad ideas fast. Map your viewer\'s beliefs before committing to a script.',
    link: '/app/idea-validator',
    linkLabel: 'Open Idea Validator',
  },
  {
    title: 'Follow the Fast Path',
    description: 'The Workflow page has a timed 7-step process that gets a script done in ~2 hours. Start there if you\'re unsure.',
    link: '/app/workflow',
    linkLabel: 'See Workflow',
  },
  {
    title: 'Use AI as a Thinking Partner',
    description: 'The AI Prompts module runs Claude right inside the app. You get 20 runs per day. Always edit the output — your voice goes in after.',
    link: '/app/ai-prompts',
    linkLabel: 'Try AI Prompts',
  },
];

export default function Onboarding() {
  const searchParams = useSearchParams();
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (searchParams.get('onboarding') === 'true') {
      setShow(true);
    }
  }, [searchParams]);

  if (!show) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-bg/80 backdrop-blur-sm">
      <div className="bg-bg-card border border-border rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? 'bg-amber w-8' : i < step ? 'bg-amber/40 w-4' : 'bg-border w-4'
              }`}
            />
          ))}
        </div>

        {current.icon && (
          <div className="text-[40px] mb-4">{current.icon}</div>
        )}

        <h2 className="font-serif text-[24px] text-text-bright mb-3">{current.title}</h2>
        <p className="text-[15px] text-text-dim leading-relaxed mb-6">{current.description}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 text-[14px] text-text-muted hover:text-text-dim transition-colors"
              >
                Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {current.link && (
              <Link
                href={current.link}
                onClick={() => setShow(false)}
                className="px-4 py-2 text-[14px] text-amber hover:text-amber-bright transition-colors"
              >
                {current.linkLabel}
              </Link>
            )}

            {isLast ? (
              <button
                onClick={() => setShow(false)}
                className="px-5 py-2.5 bg-amber hover:bg-amber-bright text-bg text-[14px] font-medium rounded-xl transition-colors"
              >
                Get Started
              </button>
            ) : (
              <button
                onClick={() => setStep(step + 1)}
                className="px-5 py-2.5 bg-amber hover:bg-amber-bright text-bg text-[14px] font-medium rounded-xl transition-colors"
              >
                Next
              </button>
            )}
          </div>
        </div>

        {/* Skip */}
        <button
          onClick={() => setShow(false)}
          className="block w-full text-center mt-4 text-[13px] text-text-muted hover:text-text-dim transition-colors"
        >
          Skip tour
        </button>
      </div>
    </div>
  );
}
