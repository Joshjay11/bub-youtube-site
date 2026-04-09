-- Voice Video Sampling v1 (Tier A) — raw transcript injection for script generation.
--
-- IMPORTANT: This is DISTINCT from Tastemaker's voice_samples table (migration 006).
--   - Tastemaker voice_samples = uploaded WRITTEN content (md/txt/docx/paste) used to
--     compile a written-style "taste profile" for the Tastemaker module.
--   - These columns = a YouTube VIDEO transcript fetched once, injected verbatim into
--     the system prompt of writing routes so generated scripts mimic the user's spoken voice.
-- Same product surface, different feature. Namespacing prevents confusion.

ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS voice_video_url TEXT,
  ADD COLUMN IF NOT EXISTS voice_video_transcript TEXT,
  ADD COLUMN IF NOT EXISTS voice_video_fetched_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS voice_nudge_dismissed BOOLEAN DEFAULT FALSE;
