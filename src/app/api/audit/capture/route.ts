import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const FROM_ADDRESS = 'BUB YouTube Writer <noreply@bubwriter.com>';
const INTAKE_EMAIL = process.env.INTAKE_EMAIL || 'support@bubwriter.com';

export async function POST(request: NextRequest) {
  let body: { name?: string; email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const { name, email } = body;

  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: 'Name and email required.' }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY not configured');
    return NextResponse.json({ success: true });
  }

  const resend = new Resend(apiKey);

  resend.emails
    .send({
      from: FROM_ADDRESS,
      to: INTAKE_EMAIL,
      replyTo: email,
      subject: `New Audit Lead: ${name} (${email})`,
      html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; color: #e0e0e0; background: #111; padding: 24px; border-radius: 8px;">
  <h2 style="color: #d4a342; margin: 0 0 16px 0; font-size: 16px; letter-spacing: 0.05em; text-transform: uppercase;">New Audit Lead</h2>
  <table style="width: 100%; border-collapse: collapse;">
    <tr><td style="padding: 6px 0; color: #999; width: 80px;">Name</td><td style="padding: 6px 0; color: #fff;">${esc(name)}</td></tr>
    <tr><td style="padding: 6px 0; color: #999;">Email</td><td style="padding: 6px 0; color: #fff;">${esc(email)}</td></tr>
    <tr><td style="padding: 6px 0; color: #999;">Time</td><td style="padding: 6px 0; color: #fff;">${new Date().toISOString()}</td></tr>
  </table>
  <p style="color: #666; font-size: 12px; margin: 16px 0 0 0;">From the free Script Audit tool.</p>
</div>`.trim(),
    })
    .catch((err) => console.error('Audit capture email failed:', err));

  return NextResponse.json({ success: true });
}

function esc(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
