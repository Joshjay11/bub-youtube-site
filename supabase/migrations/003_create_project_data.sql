CREATE TABLE IF NOT EXISTS public.project_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  tool_key TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, tool_key)
);

ALTER TABLE public.project_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on project_data"
  ON public.project_data
  FOR ALL
  USING (true)
  WITH CHECK (true);
