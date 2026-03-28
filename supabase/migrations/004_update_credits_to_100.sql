-- Update default credits from 50 to 100 for new purchases
-- Existing users keep their current balance
ALTER TABLE public.purchases
  ALTER COLUMN ai_credits_remaining SET DEFAULT 100;
