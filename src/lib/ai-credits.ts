import { createAdminSupabase, createServerSupabase } from '@/lib/supabase';
import { decrypt, encrypt, isLegacyCiphertext } from '@/lib/byok-crypto';

export async function resolveApiKey(email: string | null): Promise<{
  apiKey: string | null;
  source: 'byok' | 'credits' | 'platform' | null;
  creditsRemaining: number;
}> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !email) {
    return { apiKey: process.env.ANTHROPIC_API_KEY || null, source: 'platform', creditsRemaining: 999 };
  }

  const supabase = createAdminSupabase();

  // 1. Check BYOK key
  const { data: settings } = await supabase
    .from('user_settings')
    .select('anthropic_api_key_encrypted')
    .eq('email', email)
    .single();

  if (settings?.anthropic_api_key_encrypted) {
    const ciphertext = settings.anthropic_api_key_encrypted;
    try {
      const byokKey = decrypt(ciphertext);
      if (byokKey.startsWith('sk-ant-')) {
        // Transparent migration: re-encrypt legacy XOR rows with AES on read.
        if (isLegacyCiphertext(ciphertext)) {
          try {
            const upgraded = encrypt(byokKey);
            await supabase
              .from('user_settings')
              .update({ anthropic_api_key_encrypted: upgraded })
              .eq('email', email);
          } catch (err) {
            // Migration is best-effort; decrypt already succeeded so access still works.
            console.error('[byok] legacy migration write failed', err);
          }
        }
        return { apiKey: byokKey, source: 'byok', creditsRemaining: -1 };
      }
    } catch (err) {
      // Decrypt failed — fall through to credits. Don't expose raw error to user.
      console.error('[byok] decrypt failed', err);
    }
  }

  // 2. Check credits
  const { data: purchase } = await supabase
    .from('purchases')
    .select('ai_credits_remaining')
    .eq('email', email)
    .single();

  const remaining = purchase?.ai_credits_remaining ?? 0;
  if (remaining > 0) {
    return { apiKey: process.env.ANTHROPIC_API_KEY || null, source: 'credits', creditsRemaining: remaining };
  }

  return { apiKey: null, source: null, creditsRemaining: 0 };
}

/**
 * Atomically decrement the caller's credit balance. Returns the new balance,
 * or null if the caller has fewer than `amount` credits (no decrement occurred).
 */
export async function decrementCredits(
  email: string,
  amount: number = 1,
): Promise<number | null> {
  const admin = createAdminSupabase();
  const { data, error } = await admin.rpc('decrement_credits', {
    p_email: email,
    p_amount: amount,
  });
  if (error) {
    console.error('[credits] decrement RPC failed', { error });
    return null;
  }
  return (data as number | null) ?? null;
}

/**
 * Atomically refund credits. Returns the new balance or null if the email
 * does not map to a purchases row.
 */
export async function incrementCredits(
  email: string,
  amount: number = 1,
): Promise<number | null> {
  const admin = createAdminSupabase();
  const { data, error } = await admin.rpc('increment_credits', {
    p_email: email,
    p_amount: amount,
  });
  if (error) {
    console.error('[credits] increment RPC failed', { error });
    return null;
  }
  return (data as number | null) ?? null;
}

export async function getUserEmail(): Promise<string | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.email || null;
}
