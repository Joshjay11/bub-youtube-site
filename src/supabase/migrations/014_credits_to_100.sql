-- Update defaults for new purchase rows
ALTER TABLE public.purchases
  ALTER COLUMN ai_credits_remaining SET DEFAULT 100,
  ALTER COLUMN ai_credits_monthly SET DEFAULT 100;

-- Bump existing purchases to 100 credits
UPDATE public.purchases
SET ai_credits_remaining = 100,
    ai_credits_monthly = 100
WHERE ai_credits_remaining < 100;
