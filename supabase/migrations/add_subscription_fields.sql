-- Subscription tracking fields for users table
--
-- Subscription status values:
-- 'none'     — never subscribed
-- 'active'   — paid and current
-- 'past_due' — payment failed, retries in progress, KEEP ACCESS
-- 'canceled' — user canceled, access until period end
-- 'lapsed'   — period ended, read-only access

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS subscription_tier text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS subscription_current_period_end timestamptz,
  ADD COLUMN IF NOT EXISTS is_founding_member boolean DEFAULT false;

-- stripe_customer_id may already exist from the one-time purchase flow
-- This is safe to run — IF NOT EXISTS prevents errors
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS stripe_customer_id text;

CREATE INDEX IF NOT EXISTS idx_users_stripe_customer
  ON public.users(stripe_customer_id);
