import { checkGoogleAccess } from '@/lib/health';
import { sendHealthAlert } from '@/lib/mail';

export const dynamic = 'force-dynamic';

/**
 * Runs daily via the Vercel cron in vercel.json and emails only when the Google
 * connection is broken, so the committee hears about an expired token within a
 * day rather than when someone opens the app during the festival.
 */
export async function GET(request: Request) {
  // Vercel sends this header when CRON_SECRET is set. Anything else is refused,
  // so a stranger cannot use this endpoint to generate mail.
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) {
    return new Response('Not authorised', { status: 401 });
  }

  const result = await checkGoogleAccess();
  if (!result.ok) {
    await sendHealthAlert(result);
  }

  return Response.json({ ok: result.ok, alerted: !result.ok });
}
