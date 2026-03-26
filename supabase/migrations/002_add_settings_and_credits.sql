-- Add AI credits to purchases table
ALTER TABLE public.purchases
  ADD COLUMN IF NOT EXISTS ai_credits_remaining INTEGER DEFAULT 50,
  ADD COLUMN IF NOT EXISTS ai_credits_monthly INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS credits_reset_at TIMESTAMPTZ;

-- User settings table (BYOK keys, preferences)
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  anthropic_api_key_encrypted TEXT,
  ai_subscription_active BOOLEAN DEFAULT FALSE,
  ai_subscription_stripe_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on user_settings"
  ON public.user_settings
  FOR ALL
  USING (true)
  WITH CHECK (true);
