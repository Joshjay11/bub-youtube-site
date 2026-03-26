-- Stores Stripe purchases independently of auth.users.
-- The webhook inserts here immediately after checkout.
-- When the user later signs up via magic link, the auth callback
-- merges this record into the users table.

CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  has_access BOOLEAN DEFAULT TRUE,
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Allow service role to read/write
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on purchases"
  ON public.purchases
  FOR ALL
  USING (true)
  WITH CHECK (true);
