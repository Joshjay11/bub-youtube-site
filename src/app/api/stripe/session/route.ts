import { getStripe } from '@/lib/stripe';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('session_id');

  if (!sessionId) {
    return Response.json({ error: 'Missing session_id' }, { status: 400 });
  }

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const email = session.customer_details?.email || session.customer_email || '';
    return Response.json({ email });
  } catch {
    return Response.json({ email: '' });
  }
}
