-- 010_stripe_events.sql
-- Idempotency dedup table for Stripe webhook events.
-- Stripe retries on non-2xx and on timeouts. Without this table,
-- retries can re-process tier changes, payment_succeeded events, etc.

CREATE TABLE IF NOT EXISTS public.stripe_events (
  id text PRIMARY KEY,
  type text NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  payload jsonb NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_stripe_events_received_at
  ON public.stripe_events (received_at DESC);

CREATE INDEX IF NOT EXISTS idx_stripe_events_type
  ON public.stripe_events (type);

ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;
-- No policies created. Service role bypasses RLS automatically.
-- Authenticated users have no access, which is correct for webhook-only data.

COMMENT ON TABLE public.stripe_events IS
  'Idempotency dedup for Stripe webhook events. Insert with ON CONFLICT DO NOTHING; if no row returned, event was already processed.';
