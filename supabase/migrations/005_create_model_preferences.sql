CREATE TABLE IF NOT EXISTS public.model_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  task TEXT NOT NULL DEFAULT 'script_generation',
  chosen_model TEXT NOT NULL,
  rejected_model TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.model_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on model_preferences"
  ON public.model_preferences
  FOR ALL
  USING (true)
  WITH CHECK (true);
