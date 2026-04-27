import { Resend } from 'resend';
import { rateLimit } from '@/lib/rate-limit';

const FROM_ADDRESS = 'BUB YouTube Writer <noreply@bubwriter.com>';
const INTAKE_EMAIL = process.env.INTAKE_EMAIL || 'support@bubwriter.com';
const INTAKE_RATE_LIMIT = 5;
const INTAKE_WINDOW_SECONDS = 60 * 60;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

interface IntakeData {
  name: string;
  email: string;
  channel: string;
  tier: string;
  topic: string;
  length: string;
  deadline: string;
  source: string;
}

interface IntakeBody extends IntakeData {
  website?: string;
}

function formatIntakeEmail(data: IntakeData): string {
  return `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; color: #e0e0e0; background: #111; padding: 32px; border-radius: 8px;">
  <h2 style="color: #d4a342; margin: 0 0 24px 0; font-size: 18px; letter-spacing: 0.05em; text-transform: uppercase;">New Project Inquiry</h2>
  <table style="width: 100%; border-collapse: collapse;">
    <tr><td style="padding: 8px 0; color: #999; width: 140px;">Name</td><td style="padding: 8px 0; color: #fff;">${esc(data.name)}</td></tr>
    <tr><td style="padding: 8px 0; color: #999;">Email</td><td style="padding: 8px 0; color: #fff;">${esc(data.email)}</td></tr>
    <tr><td style="padding: 8px 0; color: #999;">Channel</td><td style="padding: 8px 0; color: #fff;">${esc(data.channel) || '<span style="color:#666">Not provided</span>'}</td></tr>
    <tr><td style="padding: 8px 0; color: #999;">Tier</td><td style="padding: 8px 0; color: #d4a342; font-weight: 600;">${esc(data.tier) || 'Not specified'}</td></tr>
  </table>
  <hr style="border: none; border-top: 1px solid #333; margin: 20px 0;" />
  <table style="width: 100%; border-collapse: collapse;">
    <tr><td style="padding: 8px 0; color: #999; width: 140px;">Topic</td><td style="padding: 8px 0; color: #fff;">${esc(data.topic) || '<span style="color:#666">Not provided</span>'}</td></tr>
    <tr><td style="padding: 8px 0; color: #999;">Target Length</td><td style="padding: 8px 0; color: #fff;">${esc(data.length) || '<span style="color:#666">Not specified</span>'}</td></tr>
    <tr><td style="padding: 8px 0; color: #999;">Deadline</td><td style="padding: 8px 0; color: #fff;">${esc(data.deadline) || '<span style="color:#666">None</span>'}</td></tr>
    <tr><td style="padding: 8px 0; color: #999;">Found us via</td><td style="padding: 8px 0; color: #fff;">${esc(data.source) || '<span style="color:#666">Not specified</span>'}</td></tr>
  </table>
  <hr style="border: none; border-top: 1px solid #333; margin: 20px 0;" />
  <p style="color: #888; font-size: 13px; margin: 0;">Submitter email: ${esc(data.email)}</p>
</div>`.trim();
}

function formatConfirmationEmail(name: string): string {
  return `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; color: #e0e0e0; background: #111; padding: 32px; border-radius: 8px;">
  <p style="color: #fff; font-size: 16px; margin: 0 0 16px 0;">Hey ${esc(name)},</p>
  <p style="color: #ccc; font-size: 15px; line-height: 1.7; margin: 0 0 16px 0;">Thanks for reaching out. We received your project inquiry and will get back to you within 24 hours.</p>
  <p style="color: #ccc; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">In the meantime, if you have any scripts, videos, or notes you'd like us to review, feel free to reply to this email with links or attachments.</p>
  <p style="color: #999; font-size: 14px; margin: 0;">BUB YouTube Writer<br /><span style="color: #d4a342;">youtube.bubwriter.com</span></p>
</div>`.trim();
}

function esc(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function POST(request: Request) {
  try {
    const data: IntakeBody = await request.json();

    // Honeypot: real users never see or fill the `website` field.
    // If it's filled, silently ack so the bot doesn't learn to skip it.
    if (typeof data.website === 'string' && data.website.trim().length > 0) {
      return Response.json({ success: true });
    }

    const name = (data.name ?? '').toString().trim();
    const email = (data.email ?? '').toString().trim().toLowerCase();

    if (!name || !email) {
      return Response.json({ error: 'Name and email are required.' }, { status: 400 });
    }
    if (!EMAIL_RE.test(email)) {
      return Response.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const rl = await rateLimit(`rl:intake:ip:${ip}`, INTAKE_RATE_LIMIT, INTAKE_WINDOW_SECONDS);
    if (!rl.allowed) {
      return Response.json(
        { error: 'Too many submissions. Please try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(rl.retryAfterSeconds) },
        },
      );
    }

    const sanitized: IntakeData = {
      name,
      email,
      channel: (data.channel ?? '').toString(),
      tier: (data.tier ?? '').toString(),
      topic: (data.topic ?? '').toString(),
      length: (data.length ?? '').toString(),
      deadline: (data.deadline ?? '').toString(),
      source: (data.source ?? '').toString(),
    };

    const resend = getResend();
    const replyTo = process.env.INTAKE_REPLY_TO || INTAKE_EMAIL;

    const { error: intakeError } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: INTAKE_EMAIL,
      replyTo,
      subject: `New Project Inquiry: ${sanitized.name} (${sanitized.tier || 'Not specified'})`,
      html: formatIntakeEmail(sanitized),
    });

    if (intakeError) {
      console.error('Intake email failed:', intakeError);
      return Response.json({ error: 'Failed to send inquiry. Please try again.' }, { status: 500 });
    }

    // Confirmation to the submitter is best-effort.
    resend.emails.send({
      from: FROM_ADDRESS,
      to: sanitized.email,
      subject: 'We got your project inquiry',
      html: formatConfirmationEmail(sanitized.name),
    }).catch((err) => console.error('Confirmation email failed:', err));

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
