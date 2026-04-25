# Cadence Pool — Rhythm Interference Material for Bub YouTube Writer

## Purpose

This pool exists to disrupt the homogenized RLHF rhythm that Claude Sonnet, Minimax M2.5, and Grok Fast all default to. When 2-3 transcripts from this pool get injected into a writer model's system prompt, the model has to produce output that breaks out of its default sentence-length uniformity and cadence patterns.

This is camouflage, not voice imitation. The transcripts are Jayson's personal YouTube transcripts, but the product does NOT aim to make customer scripts sound like him. The goal is to produce scripts that sound rhythmically varied and human-paced — not scripts that sound like this specific speaker.

The framing prompt in `INJECTION_FRAMING.md` does the load-bearing work of making this distinction clear to the model.

---

## Architecture Context

This pool is layer 3 of a three-layer stack injected into Bub YouTube Writer's three script-producing routes:

```
ROUTE SYSTEM PROMPT
├── Route-specific role (you are a script writer, hook writer, editor persona)
├── soul-core.md           ← LAYER 1: anti-convergence blacklist (RLHF tells)
├── soul-youtube.md        ← LAYER 2: YouTube structural rules (30-sec contract, micro-acts)
├── CADENCE REFERENCE      ← LAYER 3: THIS POOL (rotated per generation)
└── Task-specific instructions + user message
```

Each layer does a different job:

- **soul-core** strips the universal AI tells (vocabulary, hedge frames, empathy sandwiches).
- **soul-youtube** provides YouTube-specific structure.
- **cadence-pool** provides rhythm interference — proof to the model that non-default rhythms are acceptable.

All three need to exist for the camouflage to work. Dropping any one weakens the others.

---

## Pool Contents (8 transcripts, ordered by rhythmic strength)

| # | File | Words | Rating | Best For |
|---|------|-------|--------|----------|
| 01 | gods_in_machine | 1,699 | A+ | Maximum fragmentation signal |
| 02 | competition | 2,585 | A | Widest length variety |
| 03 | inner_war | 2,639 | A- | Quote-to-cadence register shifts |
| 04 | reality_bending | 2,259 | A- | Instructional with rhythm |
| 05 | transforming_life | 1,485 | A- | Conversational asides |
| 06 | decoding_reality | 1,447 | B+ | One-line affirmations |
| 07 | mental_wellness | 1,570 | B+ | Narrative texture |
| 08 | failing_forward | 1,302 | B | Syntactic inversions |

See `pool-manifest.json` for machine-readable metadata including specific rhythmic features per file.

---

## Dropped From Pool

Two transcripts were uploaded but not included:

- **Loosh / emotional energy** — Contains Bob Monroe quote material that interferes with the cadence signal.
- **In the beginning / energy vampirism** — Opens with ~20 lines of Monroe block quote. The quoted material dominates the file's rhythmic profile and is not Jayson's cadence.

Both could be added later if the block quotes are stripped manually and replaced with paraphrase. Until then they weaken the pool more than they strengthen it.

---

## Injection Logic (for eventual Claude Code spec)

The three writer routes need to be modified to:

1. Load the pool manifest at route startup (or build-time — it's static data).
2. On each generation request, randomly select 2 transcripts from the pool (configurable to 3 if quality needs boosting, 1 if cost needs reduction).
3. Load those 2 transcripts.
4. Wrap them using the `INJECTION_FRAMING.md` template.
5. Concatenate into the system prompt in the correct stack position (after soul-youtube, before task instructions).
6. Record which transcripts were injected in the response metadata (for debugging and analysis).

**Pool storage:** recommend `src/lib/cadence-pool/` in the Next.js repo, with transcripts imported as static string constants or read from `public/` at build time. Do not put the pool in Supabase — this is deploy-time content, not user data.

**Rotation algorithm:** random without replacement within a generation (don't inject the same transcript twice). Across generations, use simple random with replacement (users don't see pool state). No session state needed.

**Cost budget:** at 2 transcripts average ~5,000 tokens overhead per generation. Monitor `usage.prompt_tokens` in the response telemetry and alert if it climbs unexpectedly.

---

## Testing Before Production

Before wiring this into the live routes, do a manual test cycle:

1. Pick a topic maximally different from any pool content. Grout, fishing, pickleball, tax deductions — anything non-metaphysical.
2. Run a generation with injection enabled (use a local test harness, not production).
3. Scan the output for:
   - **Content bleed:** any mention of "Jason," "Locke," "Jamie," "Tufti," "Neville Goddard," "Awake Mind," "Loosh," esoteric topics. If present → framing failure, strengthen framing before shipping.
   - **Topic fidelity:** does the output still address the user's actual topic? If no → framing failure.
   - **Rhythmic variety:** are there fragments, one-word sentences, pivots, length variety? If no → framing too restrictive, loosen the "DO NOT" rules.
4. Run the same test against all three writer models (Sonnet, Minimax, Grok Fast). They will respond to the injection differently — Sonnet will be most compliant, Grok may deviate most, Minimax is an unknown.

Test at least 10 generations per model before going live. Voice-bleed is catastrophic to the product positioning — the point is that customer scripts DON'T sound like a specific speaker.

---

## Expansion Protocol

When adding new transcripts to the pool:

1. Drop the new transcript in `transcripts/NN_slug.md` (next available number).
2. Assess it against the same criteria as the existing pool:
   - Sentence length variety (fragments through long passages)
   - Fragment and one-word sentence density
   - Rhetorical pivots and self-interruption patterns
   - Low AI-tell vocabulary density
   - Minimal block quote content from other authors
3. Assign a rating (A+ through C).
4. Add an entry to `pool-manifest.json` with metadata.
5. Bump `pool_version` in the manifest.
6. Re-run the test cycle above to make sure the new transcript doesn't destabilize output quality.

Target pool size: 10-15 transcripts. Bigger than that and rotation randomness produces less perceptible variation; smaller than 6 and the rotation itself becomes a pattern.

---

## When This Layer Gets Replaced

The cadence pool is a **bridge**, not the final solution. It pushes the three writer models away from their defaults using prompt-level pressure only. The underlying models still want to pattern-match to their RLHF training.

The real fix is Giscard — the Gemma LoRA being trained on Jayson's personal corpus — which changes the underlying distribution instead of just pressuring the surface prompt. When Giscard lands:

- The cadence pool layer can be removed from routes that switch to Giscard.
- soul-core and soul-youtube remain (they handle different concerns).
- The transcripts themselves become part of the Giscard training corpus, so the rhythm-teaching function moves from prompt-level to weights-level.

Until then, this pool is the camouflage.
