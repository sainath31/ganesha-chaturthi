import { checkGoogleAccess } from '@/lib/health';

export const dynamic = 'force-dynamic';

/**
 * Open a browser at /api/health to confirm the Google connection is alive.
 * Returns 200 when everything works and 503 when it does not, so an external
 * uptime monitor can watch it without parsing the body.
 */
export async function GET() {
  const result = await checkGoogleAccess();
  return Response.json(result, { status: result.ok ? 200 : 503 });
}
