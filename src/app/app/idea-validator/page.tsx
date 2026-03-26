'use client';

import { useState } from 'react';
import IdeaEntry from '@/components/app/IdeaEntry';
import IdeaScorecard from '@/components/app/IdeaScorecard';
import ViewerBeliefMap from '@/components/app/ViewerBeliefMap';

export default function IdeaValidatorPage() {
  const [currentIdea, setCurrentIdea] = useState('');

  return (
    <div>
      <h1 className="font-serif text-[32px] text-text-bright mb-2">Idea Validator</h1>
      <p className="text-text-dim text-[15px] mb-8">
        Score your video ideas and map viewer beliefs before committing to a script.
      </p>

      <div className="space-y-12">
        <IdeaEntry onIdeaSet={setCurrentIdea} currentIdea={currentIdea} />
        <hr className="rule" style={{ margin: '0' }} />
        <IdeaScorecard />
        <hr className="rule" style={{ margin: '0' }} />
        <ViewerBeliefMap />
      </div>
    </div>
  );
}
