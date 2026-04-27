-- 013_stripe_events_status.sql
-- Atomic idempotency for Stripe webhook events.
--
-- Previously the webhook inserted into stripe_events BEFORE running the
-- handler and swallowed all handler errors, returning 200 to Stripe even
-- when downstream writes (purchases, users) failed. Customer payments
-- could succeed at Stripe while access rows failed to write, with no retry.
--
-- This adds a status column so the webhook can claim the event as
-- 'processing', run the handler, and only flip to 'processed' on full
-- success. On failure the row is marked 'failed' and the webhook returns
-- non-200 so Stripe retries.

ALTER TABLE public.stripe_events
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'processed'
  CHECK (status IN ('processing', 'processed', 'failed')),
  ADD COLUMN IF NOT EXISTS last_error TEXT,
  ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ DEFAULT now();

-- Backfill: any existing rows are treated as processed (they were inserted
-- under the old logic which only inserted on apparent success).
UPDATE public.stripe_events SET status = 'processed' WHERE status IS NULL;
