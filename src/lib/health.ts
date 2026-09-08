import { sheetsClient, driveClient } from './google';
import { env } from './env';
import { describeGoogleError } from './google-errors';

export type HealthResult = {
  ok: boolean;
  checkedAt: string;
  checks: { name: string; ok: boolean; detail?: string }[];
  title?: string;
  detail?: string;
};

/**
 * Cheapest possible proof that the Google credentials still work: one metadata
 * read against the spreadsheet and one against the receipts folder. Both go
 * through the same OAuth client the app uses, so an expired or revoked refresh
 * token fails here exactly as it would on a real page load.
 */
export async function checkGoogleAccess(): Promise<HealthResult> {
  const checks: HealthResult['checks'] = [];
  let firstError: unknown = null;

  try {
    await sheetsClient().spreadsheets.get({
      spreadsheetId: env.spreadsheetId,
      fields: 'spreadsheetId',
    });
    checks.push({ name: 'sheets', ok: true });
  } catch (error) {
    firstError = error;
    checks.push({ name: 'sheets', ok: false, detail: describeGoogleError(error).title });
  }

  try {
    await driveClient().files.get({ fileId: env.receiptsFolderId, fields: 'id' });
    checks.push({ name: 'drive', ok: true });
  } catch (error) {
    firstError ??= error;
    checks.push({ name: 'drive', ok: false, detail: describeGoogleError(error).title });
  }

  const ok = checks.every((check) => check.ok);
  const described = ok ? null : describeGoogleError(firstError);

  return {
    ok,
    checkedAt: new Date().toISOString(),
    checks,
    ...(described ? { title: described.title, detail: described.detail } : {}),
  };
}
