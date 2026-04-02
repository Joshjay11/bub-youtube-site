import Anthropic from '@anthropic-ai/sdk';
import { resolveApiKey, decrementCredits, getUserEmail } from '@/lib/ai-credits';
import { checkSubscriptionAccess } from '@/lib/subscription-check';

const V2_RULES = `ElevenLabs V2 FORMATTING RULES:
- The ONLY supported SSML tag is <break time="x.xs" /> (up to 3.0 seconds). No other SSML tags work.
- Do NOT use <prosody>, <emphasis>, <speak>, or any other SSML tags.
Tone marker conversions:
- (pause for emphasis) → <break time="1.0s" />
- (conversational) → Remove. Use natural punctuation.
- (building tension) → Remove. Break into shorter sentences. Add ellipses where natural.
- (excited reveal) → Remove. CAPITALIZE the key reveal word. Add ! at end.
- (matter-of-fact) → Remove. Hard periods. Declarative sentences.
- (skeptical) → Remove. Add ? where appropriate. Ellipses for doubt.
Additional pauses:
- Between major sections: <break time="1.5s" />
- After rhetorical questions: <break time="0.8s" />`;

const V3_RULES = `ElevenLabs V3 FORMATTING RULES:
- V3 does NOT support <break> tags or any SSML.
- Uses audio tags in square brackets: [excited], [pause], [whispers], etc.
- Tags go BEFORE the line they modify.
- Pause tags: [pause], [short pause], [long pause]
- Use CAPS for emphasis on key words.
Tone marker conversions:
- (pause for emphasis) → [long pause]
- (conversational) → No tag needed. Add [casually] if resetting from high-energy.
- (building tension) → [tense] or [whispers]. Use shorter sentences.
- (excited reveal) → [excited] before the line. CAPITALIZE the key word.
- (matter-of-fact) → [matter-of-factly]
- (skeptical) → [sarcastic] or [annoyed]
Additional: [sighs], [laughs], [curious], [whispers]. Do NOT over-tag. ~1 tag per 3-5 sentences.`;

export async function POST(request: Request) {
  try {
    const { script, version } = await request.json();
    if (!script || !version) return Response.json({ error: 'Missing script or version' }, { status: 400 });

    const email = await getUserEmail();
    const { allowed: subAllowed, message: subMessage } = await checkSubscriptionAccess(email);
    if (!subAllowed) {
      return Response.json({ error: subMessage, needsSubscription: true }, { status: 403 });
    }
    const { apiKey, source } = await resolveApiKey(email);
    if (!apiKey) return Response.json({ error: 'No AI credits remaining.', needsUpgrade: true }, { status: 402 });
    if (source === 'credits' && email) await decrementCredits(email);

    const rules = version === 'v3' ? V3_RULES : V2_RULES;
    const systemPrompt = `You are an ElevenLabs script formatting specialist. Convert this YouTube voiceover script into ElevenLabs-ready format.

The input contains tone markers in parentheses and HTML retention comments.

CONVERSION RULES FOR ${version.toUpperCase()}:
${rules}

GENERAL RULES:
- Remove ALL HTML comments (<!-- -->).
- Remove ALL tone markers in parentheses — convert them into the appropriate format.
- Do NOT add any text not in the original. Preserve exact wording.
- Add blank lines between paragraphs.
- If over 5,000 characters, add "--- SPLIT HERE FOR NEW GENERATION ---" at nearest paragraph break to 4,500 chars.

Output ONLY the converted script.`;

    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: 'user', content: script.trim() }],
    });

    const converted = response.content[0].type === 'text' ? response.content[0].text : '';
    const charCount = converted.length;

    return Response.json({
      converted_script: converted,
      character_count: charCount,
      needs_split: charCount > 5000,
    });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 });
  }
}
