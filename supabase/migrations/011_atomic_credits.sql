-- 011_atomic_credits.sql
-- Atomic credit decrement and refund. Replaces read-then-write pattern
-- in src/lib/ai-credits.ts that could race on concurrent AI calls.

CREATE OR REPLACE FUNCTION public.decrement_credits(
  p_email text,
  p_amount integer DEFAULT 1
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_remaining integer;
BEGIN
  IF p_amount < 1 THEN
    RAISE EXCEPTION 'decrement_credits: amount must be >= 1';
  END IF;

  UPDATE public.purchases
  SET ai_credits_remaining = ai_credits_remaining - p_amount
  WHERE email = p_email
    AND ai_credits_remaining >= p_amount
  RETURNING ai_credits_remaining INTO v_remaining;

  RETURN v_remaining; -- NULL if no row updated (insufficient credits or unknown email)
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_credits(
  p_email text,
  p_amount integer DEFAULT 1
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_remaining integer;
BEGIN
  IF p_amount < 1 THEN
    RAISE EXCEPTION 'increment_credits: amount must be >= 1';
  END IF;

  UPDATE public.purchases
  SET ai_credits_remaining = ai_credits_remaining + p_amount
  WHERE email = p_email
  RETURNING ai_credits_remaining INTO v_remaining;

  RETURN v_remaining; -- NULL if email not found
END;
$$;

REVOKE EXECUTE ON FUNCTION public.decrement_credits(text, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_credits(text, integer) FROM PUBLIC;
