-- ============================================================
-- Tastemaker v2: voice samples + per-project inclusion toggle
--
-- Two additions:
--   1. public.voice_samples — external samples uploaded/pasted by
--      users to supplement the behavioral Tastemaker data.
--   2. public.projects.included_in_tastemaker — per-project
--      include/exclude flag powering mix-and-match.
--
-- Design choice: one inclusion column per source-type-owning-table
-- (projects + voice_samples) rather than a polymorphic join table,
-- to match the existing one-owner-per-row pattern.
-- ============================================================

-- voice_samples -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.voice_samples (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  notes TEXT DEFAULT '',
  source_type TEXT NOT NULL CHECK (source_type IN ('upload_md', 'upload_txt', 'upload_docx', 'paste')),
  content TEXT NOT NULL,
  word_count INTEGER NOT NULL,
  included_in_tastemaker BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS voice_samples_user_id_idx ON public.voice_samples (user_id);

ALTER TABLE public.voice_samples ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'voice_samples' AND policyname = 'Users can manage own voice samples'
  ) THEN
    CREATE POLICY "Users can manage own voice samples"
      ON public.voice_samples FOR ALL
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- projects.included_in_tastemaker ----------------------------------------
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS included_in_tastemaker BOOLEAN DEFAULT TRUE;
