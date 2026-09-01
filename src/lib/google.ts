import { google } from 'googleapis';
import { env } from './env';

/**
 * A single OAuth client acting as the account that owns the spreadsheet and the
 * receipts folder. A service account is deliberately not used: service accounts
 * have no Drive storage quota of their own, so file uploads into a personal
 * My Drive folder fail with storageQuotaExceeded even when the folder is shared
 * with them.
 */
type OAuth2Client = InstanceType<typeof google.auth.OAuth2>;

let cached: OAuth2Client | null = null;

export function getAuthClient(): OAuth2Client {
  if (!cached) {
    const client = new google.auth.OAuth2(env.googleClientId, env.googleClientSecret);
    client.setCredentials({ refresh_token: env.googleRefreshToken });
    cached = client;
  }
  return cached;
}

export function sheetsClient() {
  return google.sheets({ version: 'v4', auth: getAuthClient() });
}

export function driveClient() {
  return google.drive({ version: 'v3', auth: getAuthClient() });
}
