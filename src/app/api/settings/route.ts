import { createAdminSupabase } from '@/lib/supabase';
import { getUserEmail } from '@/lib/ai-credits';
import { encrypt } from '@/lib/byok-crypto';

export async function GET() {
  const email = await getUserEmail();
  if (!email) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const supabase = createAdminSupabase();

  // Get settings
  const { data: settings } = await supabase
    .from('user_settings')
    .select('anthropic_api_key_encrypted, ai_subscription_active')
    .eq('email', email)
    .single();

  // Get credits from purchases
  const { data: purchase } = await supabase
    .from('purchases')
    .select('ai_credits_remaining, ai_credits_monthly')
    .eq('email', email)
    .single();

  return Response.json({
    hasApiKey: !!settings?.anthropic_api_key_encrypted,
    credits: {
      remaining: purchase?.ai_credits_remaining ?? 0,
      monthly: purchase?.ai_credits_monthly ?? 0,
      subscriptionActive: settings?.ai_subscription_active ?? false,
    },
  });
}

export async function POST(request: Request) {
  const email = await getUserEmail();
  if (!email) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await request.json();
  const { anthropic_api_key } = body;

  if (typeof anthropic_api_key !== 'string') {
    return Response.json({ error: 'Invalid input' }, { status: 400 });
  }

  const supabase = createAdminSupabase();

  const encrypted = anthropic_api_key ? encrypt(anthropic_api_key) : null;

  await supabase.from('user_settings').upsert(
    {
      email,
      anthropic_api_key_encrypted: encrypted,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'email' },
  );

  return Response.json({ success: true });
}
