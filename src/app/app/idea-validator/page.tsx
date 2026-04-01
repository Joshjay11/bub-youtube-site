'use client';

import { useState } from 'react';
import IdeaEntry from '@/components/app/IdeaEntry';
import IdeaScorecard from '@/components/app/IdeaScorecard';
import ViewerBeliefMap from '@/components/app/ViewerBeliefMap';
import ResetSectionButton from '@/components/app/ResetSectionButton';

export default function IdeaValidatorPage() {
  const [currentIdea, setCurrentIdea] = useState('');

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-serif text-[32px] text-text-bright">Idea Validator</h1>
        <ResetSectionButton toolKeys={['idea_entry', 'idea_scorecard', 'score_checker', 'viewer_belief_map']} />
      </div>
      <p className="text-text-dim text-[15px] mb-8">
        Score your video ideas and map viewer beliefs before committing to a script.
      </p>

      <div className="space-y-12">
        <IdeaEntry onIdeaSet={setCurrentIdea} currentIdea={currentIdea} />
        <hr className="rule" style={{ margin: '0' }} />
        <IdeaScorecard idea={currentIdea} />
        <hr className="rule" style={{ margin: '0' }} />
        <ViewerBeliefMap />
      </div>
    </div>
  );
}
