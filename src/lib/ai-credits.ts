import { createAdminSupabase, createServerSupabase } from '@/lib/supabase';

function getEncryptionKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      '[byok] SUPABASE_SERVICE_ROLE_KEY missing — refusing to encrypt with fallback. Set the env var in Vercel before deploying.',
    );
  }
  return key;
}

function deobfuscate(encoded: string): string {
  const key = getEncryptionKey();
  const bytes = Buffer.from(encoded, 'base64');
  return bytes.map((b, i) => b ^ key.charCodeAt(i % key.length)).reduce((s, b) => s + String.fromCharCode(b), '');
}

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
    const byokKey = deobfuscate(settings.anthropic_api_key_encrypted);
    if (byokKey.startsWith('sk-ant-')) {
      return { apiKey: byokKey, source: 'byok', creditsRemaining: -1 };
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

export async function decrementCredits(email: string) {
  const supabase = createAdminSupabase();
  const { data } = await supabase
    .from('purchases')
    .select('ai_credits_remaining')
    .eq('email', email)
    .single();

  if (data && data.ai_credits_remaining > 0) {
    await supabase
      .from('purchases')
      .update({ ai_credits_remaining: data.ai_credits_remaining - 1 })
      .eq('email', email);
  }
}

export async function getUserEmail(): Promise<string | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.email || null;
}
