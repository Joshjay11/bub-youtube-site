-- ============================================================
-- Fix: Remove wide-open "Service role full access" policies on all
-- tables. The admin/service-role client bypasses RLS automatically;
-- these USING (true) policies only served to disable protection for
-- anon/authenticated roles. Replace with owner-only policies.
-- ============================================================

-- purchases ----------------------------------------------------------------
DROP POLICY IF EXISTS "Service role full access on purchases" ON public.purchases;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'purchases' AND policyname = 'Users can read own purchases'
  ) THEN
    CREATE POLICY "Users can read own purchases"
      ON public.purchases FOR SELECT
      USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));
  END IF;
END $$;

-- user_settings ------------------------------------------------------------
DROP POLICY IF EXISTS "Service role full access on user_settings" ON public.user_settings;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_settings' AND policyname = 'Users can manage own settings'
  ) THEN
    CREATE POLICY "Users can manage own settings"
      ON public.user_settings FOR ALL
      USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()))
      WITH CHECK (email = (SELECT email FROM auth.users WHERE id = auth.uid()));
  END IF;
END $$;

-- project_data -------------------------------------------------------------
DROP POLICY IF EXISTS "Service role full access on project_data" ON public.project_data;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'project_data' AND policyname = 'Users can manage own project data'
  ) THEN
    CREATE POLICY "Users can manage own project data"
      ON public.project_data FOR ALL
      USING (
        project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
      )
      WITH CHECK (
        project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
      );
  END IF;
END $$;

-- model_preferences --------------------------------------------------------
DROP POLICY IF EXISTS "Service role full access on model_preferences" ON public.model_preferences;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'model_preferences' AND policyname = 'Users can manage own model preferences'
  ) THEN
    CREATE POLICY "Users can manage own model preferences"
      ON public.model_preferences FOR ALL
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- voice_samples (if table exists) -----------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'voice_samples') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Service role full access on voice_samples" ON public.voice_samples';
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = 'voice_samples' AND policyname = 'Users can manage own voice samples'
    ) THEN
      EXECUTE 'CREATE POLICY "Users can manage own voice samples"
        ON public.voice_samples FOR ALL
        USING (user_id = auth.uid())
        WITH CHECK (user_id = auth.uid())';
    END IF;
  END IF;
END $$;
