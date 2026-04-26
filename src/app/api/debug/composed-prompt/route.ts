import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { composeWriterSystemPrompt } from '@/lib/prompts/compose-writer-system-prompt';

type WriterRoute = 'generate-script' | 'suggest-hooks' | 'editors-table';
type ModelFamily = 'claude' | 'minimax' | 'grok';

const VALID_ROUTES: WriterRoute[] = ['generate-script', 'suggest-hooks', 'editors-table'];
const VALID_MODELS: ModelFamily[] = ['claude', 'minimax', 'grok'];

export async function GET(request: NextRequest) {
  // Auth gate — only logged-in users can hit this
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const route = (searchParams.get('route') || 'generate-script') as WriterRoute;
  const model = (searchParams.get('model') || 'claude') as ModelFamily;
  const cadenceCountParam = searchParams.get('cadenceCount');
  const cadenceCount = cadenceCountParam === '3' ? 3 : 2;
  const includeVoice = searchParams.get('voice') === 'true';

  if (!VALID_ROUTES.includes(route)) {
    return NextResponse.json(
      { error: 'invalid route', valid: VALID_ROUTES },
      { status: 400 }
    );
  }
  if (!VALID_MODELS.includes(model)) {
    return NextResponse.json(
      { error: 'invalid model', valid: VALID_MODELS },
      { status: 400 }
    );
  }

  // Stub roleBlock and taskBlock with obviously-marked placeholder content
  // so we can see they're being threaded through correctly
  const roleBlock = `[DEBUG ROLE BLOCK for route=${route}, model=${model}]\nIn production, this would be the route-specific role definition.`;
  const taskBlock = `[DEBUG TASK BLOCK]\nIn production, this would contain user-specific task context (topic, length, pace, etc.).`;
  const voiceTranscript = includeVoice
    ? `[DEBUG VOICE TRANSCRIPT]\nIn production, this would be the user's voice_video_transcript from user_settings.`
    : null;

  const composed = composeWriterSystemPrompt({
    route,
    modelFamily: model,
    roleBlock,
    taskBlock,
    voiceTranscript,
    cadenceCount: cadenceCount as 2 | 3,
  });

  return NextResponse.json({
    requestedParams: { route, model, cadenceCount, includeVoice },
    metadata: composed.metadata,
    systemPrompt: composed.systemPrompt,
    bleedChecks: {
      hasUnfilledTranscriptPlaceholder: composed.systemPrompt.includes('{{TRANSCRIPT_'),
      hasExcerpt3WhenCadence2: cadenceCount === 2 && composed.systemPrompt.includes('EXCERPT 3'),
      hasSoulCoreContent: composed.systemPrompt.includes('SOUL CORE'),
      hasFramingDelimiter: composed.systemPrompt.includes('BEGIN REFERENCE EXCERPT 1'),
      hasRoleBlock: composed.systemPrompt.includes('[DEBUG ROLE BLOCK'),
      hasTaskBlock: composed.systemPrompt.includes('[DEBUG TASK BLOCK'),
      hasVoiceWhenRequested: includeVoice ? composed.systemPrompt.includes('CREATOR REFERENCE MATERIAL') : true,
    },
  });
}
