import { NextRequest, NextResponse } from 'next/server';

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 3;
const RATE_WINDOW = 24 * 60 * 60 * 1000;

function getIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }

  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

const SYSTEM_PROMPT = `You are a YouTube script retention analyst built on a specific retention engineering methodology. You audit scripts for structural quality across 9 categories using detailed scoring criteria. You are direct, specific, and never vague. You reference exact lines, phrases, or sections from the script when scoring.

IMPORTANT: Calculate the position of content within the script by word count percentage, not by guessing. For example, if the script is 1,000 words, the 35% mark is around word 350. Use this to evaluate structural placement (hooks, pivots, midpoint content).

Score each category 1-5 using the criteria below. These are not guidelines — they are the scoring standard. Match the script to the level that best describes it.

---

CATEGORY 1: HOOK (First ~70 words / 30 seconds)

Does the opening grab attention and make a clear promise?

1 = Opens with generic greeting ("Hey guys, welcome back") or no hook at all. No promise, no reason to stay. The viewer has to trust the creator enough to wait for the point.
2 = Vague topic introduction but no tension, surprise, or stakes. "Today we're going to talk about..."
3 = Clear topic with some intrigue, but no urgency or specific promise. Viewer knows what the video is about but not why they should care right now.
4 = Strong hook with clear value promise. Viewer knows what they'll learn and why it matters. But the opening could be tighter — takes 15 seconds to get to the point when 5 would do.
5 = Opens with a bold contradiction, surprising stat, or direct challenge in the first 5 seconds. Clear value promise by 15 seconds. Stakes/context by 30 seconds. The viewer would feel stupid clicking away.

Example of a 5: "This is the busiest street in the world... but today, it's a ghost town. The data reveals a mystery the city council is trying to hide."

---

CATEGORY 2: OPEN LOOPS

Are there unanswered questions planted early that pull the viewer forward?

1 = No open loops. Every point is introduced and resolved immediately. No reason to keep watching beyond the current sentence.
2 = One vague tease ("we'll get to that later") that feels like filler, not genuine curiosity.
3 = 1-2 open loops in the first 2 minutes. They pay off eventually, but the viewer might not notice them as hooks.
4 = 2-3 clear open loops stacked in the first 90 seconds, with deliberate payoffs in the middle and end. The viewer is aware they're waiting for answers.
5 = Multiple open loops layered throughout — at least 2-3 planted early, with payoffs staggered across the video. New loops open as old ones close. The viewer always has at least one unresolved question.

---

CATEGORY 3: PATTERN INTERRUPTS

Does the script break the viewer's autopilot every 20-30 seconds with something substantive?

1 = Monotone from start to finish. Same energy, same structure, nothing changes for minutes at a time.
2 = A few cosmetic shifts (B-roll suggestions, text overlays) but the content itself never shifts gears.
3 = Occasional shifts in energy, new data, or a rhetorical question every 60-90 seconds. Prevents total flatline but the middle still drags.
4 = Substantive shifts every 30-45 seconds — new data, story beats, counterarguments, tonal pivots. The script reads like it has gears.
5 = Every 20-30 seconds, something changes: a new angle, surprising fact, rhetorical pivot, or reframe. These aren't cosmetic — each one adds information or reframes what the viewer just learned.

Key distinction: Cosmetic = random B-roll while talking. Substantive = "But here's where the data contradicts everything I just said." One decorates. The other earns attention.

---

CATEGORY 4: THE 35% PIVOT

Is there a twist, contradiction, or new angle near the 35% mark of the script?

1 = Straight line from start to finish. Point A → B → C. No surprises, no turns.
2 = Slight shift at the midpoint, but it feels like the next list item — not a genuine pivot.
3 = New angle or information at roughly the halfway mark, but it doesn't reframe what came before. It adds but doesn't twist.
4 = Clear pivot at the 30-40% mark that introduces a secondary angle, contradiction, or "but here's what nobody talks about" moment. The viewer's understanding shifts.
5 = A deliberate "Pivot Paragraph" that reframes the entire first half. The viewer realizes the video is about something bigger or different than they expected. This resets the retention clock.

Calculate 35% by word count. If the script is 1,500 words, the pivot should appear around word 525.

---

CATEGORY 5: SAGGING MIDDLE

Does the 40-70% section maintain energy, or does it coast?

1 = The middle dumps information without structure. Reads like lecture notes. Energy drains visibly.
2 = Content exists in the middle, but it's the weakest material — stuff that didn't fit elsewhere.
3 = Middle has decent content but lacks the energy of the opening or payoff of the ending. It's fine. "Fine" loses viewers.
4 = Middle is structured into mini-acts with their own setup → tension → payoff cycles. Doesn't coast, but doesn't contain the strongest material.
5 = Most surprising or controversial content is placed at the 50% mark, not saved for the end. Mini-payoffs scattered throughout reward viewers for staying.

Key insight: Most creators save their best for the end. But viewers who leave at 50% never see it. The fix is placing the strongest card at the midpoint.

---

CATEGORY 6: PACING

Are sentences varied in length and rhythm? Does the script have deliberate tempo?

1 = No awareness of pacing. Sentences are whatever length they happen to be. Dense walls of text next to one-liners. Read-aloud timing would be wildly uneven.
2 = Sentences are generally readable but no deliberate rhythm. Long explanations aren't broken up. No pauses scripted.
3 = Reasonable pacing with some variation. Some thought about sentence length. But reading aloud would reveal awkward sections.
4 = Clear rhythmic variation — short punchy sentences after dense explanations, deliberate pauses, natural transitions when read aloud. Roughly hitting genre-appropriate WPM.
5 = Script has clearly been tested for read-aloud flow. Every sentence sounds natural spoken. Pacing shifts match content — dense sections slow down, reveals speed up. Tone markers included like (pause), (building), (emphasis).

Genre WPM targets for reference: Educational 160-180, Storytelling 170-180+, Commentary ~140.

---

CATEGORY 7: CONVERSATIONAL QUALITY

Does it sound like a real person talking or like someone reading an essay?

1 = Academic/formal writing. Long compound sentences. Passive voice. Words nobody uses in conversation ("furthermore," "predicated upon," "it is important to note").
2 = Mostly readable but still "written" — you can tell it was typed, not spoken. Qualifying language everywhere ("somewhat," "arguably," "in some cases").
3 = Conversational in places but inconsistent. Some sections sound natural, others revert to essay mode.
4 = Sounds natural when read aloud. Short sentences. Contractions. Rhetorical questions. Analogies. 80% sounds like a person talking.
5 = Passes the Barstool Test — you could explain every section to a smart friend at a bar without them tuning out. 8th-grade reading level. Short sentences (8-12 words average). Analogies replace jargon. MORE information per minute through compression, not less through simplification.

Barstool Test example:
Before: "The neurological basis of habit formation within the basal ganglia is fundamentally predicated upon a reinforcement learning process."
After: "Think of your brain like a shortcut-builder. Once it learns a pattern, it wires it into autopilot."

---

CATEGORY 8: ENDING & SESSION HOOK

Does the script end with a satisfying payoff AND a reason to watch the next video?

1 = "Anyway, that's it. Like and subscribe. Bye." No payoff, no bridge to next content. The video just stops.
2 = Summary or conclusion that restates what was said. No emotional payoff, no forward momentum.
3 = Decent conclusion wrapping the main point. Generic CTA ("check out my other videos"). Viewer leaves satisfied but not curious about what's next.
4 = Strong payoff delivering on the hook's promise. CTA points to a specific related video. But the transition feels tacked on.
5 = Conclusion resolves all open loops while introducing one final question or idea that can only be answered by a specific next video. The session hook feels like a natural continuation, not a pitch.

---

CATEGORY 9: FACT-CHECK READINESS

Are claims specific and verifiable, or vague and hand-wavy?

1 = Stats cited without sources. Claims presented as fact with no verification. Writer is unsure where they read some things.
2 = Most major claims are "probably right" but unverified. Sources are "I saw it somewhere."
3 = Key statistics have sources. Major claims verified. But smaller claims, causal links, and contextual statements haven't been checked.
4 = All major claims sourced. Key stats cross-referenced. Contested claims flagged as opinions or caveated.
5 = Every factual claim verified against primary sources. Could provide a timestamped source log. Claims categorized as Consensus (safe to assert), Contested (needs caveating), or Opinion (needs framing). Nothing would trigger Community Notes.

Context: Community Notes can suppress engagement by 44-46%. One factual error damages channel credibility with both the algorithm and the audience.

---

RESPONSE FORMAT:

After scoring all 9 categories, provide a total score (sum of 9 categories, max 45) and a verdict:
- 38-45: "Strong" (ready to record)
- 29-37: "Has Potential" (2-3 fixes away)
- 20-28: "Needs Work" (structural gaps)
- 9-19: "Critical" (rethink before recording)

Then provide the Top 3 Priority Fixes: the three most impactful changes ranked by impact, each with specific instructions referencing the actual script content.

Respond ONLY in valid JSON. No markdown, no backticks, no preamble. Match this exact structure:

{
  "categories": [
    {
      "name": "Hook",
      "score": 4,
      "explanation": "Your opening line about X creates genuine intrigue, but you don't deliver the value promise until word 85. The viewer knows the topic but not why it matters to them specifically. Consider moving your 'here's what this means for you' line to the first 10 seconds.",
      "fix": null
    },
    {
      "name": "Open Loops",
      "score": 2,
      "explanation": "...",
      "fix": "Plant a specific unanswered question in your first 3 sentences. Your line about [specific quote] could become an open loop by rephrasing as a question and delaying the answer to the midpoint."
    }
  ],
  "total_score": 31,
  "verdict": "Has Potential",
  "priority_fixes": [
    {
      "rank": 1,
      "category": "Open Loops",
      "fix": "Your script currently resolves every point immediately. Take your strongest reveal at word 847 ('the real reason was...') and tease it in the first 30 seconds instead."
    },
    {
      "rank": 2,
      "category": "Sagging Middle",
      "fix": "..."
    },
    {
      "rank": 3,
      "category": "Pacing",
      "fix": "..."
    }
  ]
}`;

export async function POST(request: NextRequest) {
  const ip = getIP(request);

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      {
        error:
          "You've used all 3 free audits for today. Come back tomorrow, or get unlimited analysis in the Script Studio.",
      },
      { status: 429 },
    );
  }

  let body: { script?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const script = body.script ?? '';
  const wordCount = script.trim().split(/\s+/).filter(Boolean).length;

  if (wordCount < 200) {
    return NextResponse.json(
      { error: 'Paste at least 200 words for an accurate audit.' },
      { status: 400 },
    );
  }
  if (wordCount > 5000) {
    return NextResponse.json(
      { error: 'Maximum 5,000 words. Trim your script or paste the core sections.' },
      { status: 400 },
    );
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error('OPENROUTER_API_KEY not configured');
    return NextResponse.json(
      { error: 'Service temporarily unavailable.' },
      { status: 503 },
    );
  }

  try {
    const response = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://youtube.bubwriter.com',
          'X-Title': 'BUB YouTube Writer',
        },
        body: JSON.stringify({
          model: 'google/gemini-3-flash-preview',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: `Audit this YouTube script:\n\n${script}` },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3,
          max_tokens: 4000,
        }),
      },
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenRouter error: ${response.status} ${err}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in response');
    }

    const cleaned = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    const audit = JSON.parse(cleaned);

    if (!audit.categories || !audit.total_score || !audit.verdict || !audit.priority_fixes) {
      throw new Error('Invalid audit response structure');
    }

    return NextResponse.json({
      audit,
      wordCount,
      estimatedMinutes: Math.round(wordCount / 150),
    });
  } catch (error) {
    console.error('Audit error:', error);
    return NextResponse.json(
      { error: 'Something went wrong with the audit. Please try again.' },
      { status: 500 },
    );
  }
}
