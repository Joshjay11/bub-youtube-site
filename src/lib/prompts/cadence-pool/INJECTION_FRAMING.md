# INJECTION_FRAMING.md

This is the framing template that wraps selected cadence-pool transcripts when they're injected into writer-model system prompts (generate-script, suggest-hooks, editors-table).

The framing is the load-bearing piece. Without it, the model will treat the transcripts as topic and voice reference and produce content that sounds like the reference speaker. With it, the model treats the transcripts as rhythm reference and produces output on the user's actual topic with rhythmic interference applied to the default RLHF cadence.

---

## Template

Concatenate the wrapper below with 2-3 randomly selected transcripts from the pool. Insert transcripts at the `{{TRANSCRIPT_1}}`, `{{TRANSCRIPT_2}}`, `{{TRANSCRIPT_3}}` slots. If injecting only 2, omit the third block.

```
===========================================================
CADENCE REFERENCE MATERIAL — READ THESE INSTRUCTIONS FIRST
===========================================================

The excerpts below are reference material for RHYTHM AND CADENCE ONLY.

They exist in this prompt for one purpose: to give you permission to break out of default AI sentence rhythm. They are NOT voice models. They are NOT topic references. They are NOT authors you are imitating.

-----------------------------------------------------------
WHAT TO OBSERVE IN THE EXCERPTS
-----------------------------------------------------------

- Sentence length variety: fragments, single-word sentences, short declaratives, medium sentences, longer passages, all mixed together.
- Punctuation texture: unexpected periods, standalone questions without answers, one-word sentences used as beats.
- Rhetorical moves: pivots mid-thought, self-interruption, direct address, repetition as rhythm, call-and-response patterns.
- Willingness to be choppy. Willingness to be short. Willingness to break the expected sentence shape.

-----------------------------------------------------------
WHAT TO IGNORE IN THE EXCERPTS (CRITICAL)
-----------------------------------------------------------

- The speaker's identity, persona, name, or background.
- All proper nouns: personal names, brand names, channel names, product names, character names (including but not limited to any names appearing in the excerpts).
- Topic-specific vocabulary: metaphysical terms, esoteric references, philosophical concepts, historical references.
- Opinions, arguments, worldviews, themes.
- Specific phrases, analogies, or figures of speech.
- Any content signal whatsoever.

The excerpts may discuss topics completely unrelated to the user's actual request. This is irrelevant. The topic of the excerpts is NOISE. Only the rhythm is signal.

-----------------------------------------------------------
ABSOLUTE RULES
-----------------------------------------------------------

1. Do NOT reference these excerpts in your output.
2. Do NOT use any proper noun that appears in these excerpts.
3. Do NOT reproduce any phrase longer than 3 words verbatim from these excerpts.
4. Do NOT echo the excerpts' topics, arguments, or vocabulary.
5. Do NOT shift to the excerpts' tone or worldview.
6. DO write on the user's actual topic in the user's actual tone.
7. DO apply sentence-rhythm variety, fragment use, and pivot habits observed in the excerpts to YOUR output on the user's topic.

-----------------------------------------------------------
THE GOAL
-----------------------------------------------------------

Default AI prose has a recognizable uniform rhythm: medium-length sentences, balanced clauses, tricolon habits, em dashes, setup-pivot-payoff at every level. That rhythm is what makes AI-generated writing sound like AI-generated writing regardless of topic.

These excerpts prove that other rhythms are possible and readable. Use them as permission. Produce prose that sounds rhythmically varied and human-paced — not prose that sounds like the excerpts' speaker.

-----------------------------------------------------------
BEGIN REFERENCE EXCERPT 1
-----------------------------------------------------------

{{TRANSCRIPT_1}}

-----------------------------------------------------------
END REFERENCE EXCERPT 1
-----------------------------------------------------------

-----------------------------------------------------------
BEGIN REFERENCE EXCERPT 2
-----------------------------------------------------------

{{TRANSCRIPT_2}}

-----------------------------------------------------------
END REFERENCE EXCERPT 2
-----------------------------------------------------------

-----------------------------------------------------------
BEGIN REFERENCE EXCERPT 3
-----------------------------------------------------------

{{TRANSCRIPT_3}}

-----------------------------------------------------------
END REFERENCE EXCERPT 3
-----------------------------------------------------------

=====================================================================
END OF CADENCE REFERENCE MATERIAL — PROCEED WITH THE USER'S TASK BELOW
=====================================================================
```

---

## Placement

This block goes into the system prompt for the three writer routes, AFTER the existing anti-slop blacklist (soul-core.md) and AFTER the YouTube structural rules (soul-youtube.md), but BEFORE the task-specific instructions for that route.

Recommended stack order:

1. Route-specific role (e.g., "You are a YouTube script writer...")
2. `soul-core.md` — anti-convergence blacklist and rhythm rules
3. `soul-youtube.md` — YouTube structural rules (30-Second Contract, micro-acts, etc.)
4. **This cadence reference block** — rhythm interference material
5. Task-specific instructions (user's topic, length, tone, etc.)
6. User message

---

## Why The Framing Is Heavy

AI models are pattern-matchers. If you drop 5000 words of Jason's voice into a prompt with weak framing, the model will match the voice. It's the strongest signal in the prompt.

The only way to prevent voice-matching while still getting rhythm-matching is to:

1. **Explicitly instruct the model on the role of the reference material** (CADENCE ONLY, not voice).
2. **Enumerate what to ignore** (proper nouns, topics, worldview).
3. **Enumerate what to observe** (length variety, fragments, pivots).
4. **Use strong visual delimiters** (the block-of-dashes borders) so the model treats the reference as a separated artifact, not content to blend with.
5. **Bookend with "proceed with the user's task"** so the model exits reference-mode cleanly.

This framing has been designed with all five safeguards. Don't weaken it.

---

## Testing The Framing

Before shipping to production, test with one script generation per writer model:

1. Pick a topic maximally DIFFERENT from any excerpt topic (e.g., "How to grout shower tile").
2. Inject 3 transcripts using the full framing.
3. Check output for:
   - Any mention of "Jason," "Locke," "Jamie," "Tufti," "Neville Goddard," "Awake Mind," "Loosh," etc. → framing failure
   - Any pivot to metaphysical/consciousness themes → framing failure
   - Rhythmic variety (fragments, one-word sentences, sentence-length mixing) → framing success
   - Topic fidelity (still actually about grout) → framing success

If the framing fails (content bleeds through), strengthen the "ABSOLUTE RULES" section before expanding rollout.

---

## Cost Note

Each transcript averages ~2,500 tokens. Injecting 3 per generation adds ~7,500 tokens of system-prompt overhead. At Claude Sonnet's current pricing this is a meaningful but not prohibitive per-generation cost uplift.

Options if cost is a concern:
- Inject 2 transcripts instead of 3 (~5,000 tokens overhead)
- Inject 1 transcript but rotate through the pool (~2,500 tokens overhead, less rhythmic density but still meaningful signal)
- Truncate each transcript to the first 1,000 words (~1,300 tokens each, reduces cost but may reduce signal)

Start at 2 transcripts and tune from there.
