/**
 * Google's OAuth and API errors arrive as short machine codes ("invalid_grant")
 * that say nothing about what to actually do. These map the ones this app can
 * realistically hit onto instructions the committee can follow.
 */

type Described = { title: string; detail: string };

const DESCRIPTIONS: Record<string, Described> = {
  invalid_grant: {
    title: 'The Google connection has expired',
    detail:
      'GOOGLE_REFRESH_TOKEN is no longer accepted by Google. The usual cause is the ' +
      'OAuth consent screen still being in "Testing" mode, which expires refresh tokens ' +
      'after 7 days. Publish the app to "In production" in Google Cloud Console, mint a ' +
      'fresh refresh token, update it in your hosting environment, and redeploy. ' +
      'See the Troubleshooting section of SETUP.md.',
  },
  invalid_client: {
    title: 'The Google client credentials are wrong',
    detail:
      'GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET does not match the OAuth client that ' +
      'issued the refresh token. All three must come from the same client.',
  },
  access_denied: {
    title: 'Google denied access',
    detail:
      'The account that authorised this app may have revoked it, or the requested ' +
      'scopes changed. Mint a fresh refresh token.',
  },
  insufficient_scope: {
    title: 'The Google token is missing a permission',
    detail:
      'Re-mint the refresh token with both scopes: spreadsheets and drive.file.',
  },
};

const STATUS_DESCRIPTIONS: Record<number, Described> = {
  403: {
    title: 'Google refused the request',
    detail:
      'Check that the Sheets API and Drive API are both enabled for the project, and ' +
      'that the authorising account can edit the spreadsheet and the receipts folder.',
  },
  404: {
    title: 'The spreadsheet or folder was not found',
    detail:
      'Check that SHEET_ID and DRIVE_RECEIPTS_FOLDER_ID hold just the id from the ' +
      'middle of the Google URL, not the whole link, and that the authorising ' +
      'account can open both.',
  },
  429: {
    title: 'Google is rate limiting the app',
    detail: 'Too many requests in a short window. Wait a minute and reload.',
  },
};

/** Best-effort extraction of Google's error code from whatever shape it threw. */
function codeOf(error: unknown): string | null {
  if (!error || typeof error !== 'object') return null;
  const anyError = error as Record<string, unknown>;

  const direct = anyError.error;
  if (typeof direct === 'string') return direct;
  if (direct && typeof direct === 'object') {
    const nested = (direct as Record<string, unknown>).error;
    if (typeof nested === 'string') return nested;
  }

  const response = anyError.response as Record<string, unknown> | undefined;
  const data = response?.data as Record<string, unknown> | undefined;
  if (typeof data?.error === 'string') return data.error;

  // googleapis often flattens the OAuth code into the message.
  const message = typeof anyError.message === 'string' ? anyError.message : '';
  for (const known of Object.keys(DESCRIPTIONS)) {
    if (message.includes(known)) return known;
  }
  return null;
}

function statusOf(error: unknown): number | null {
  if (!error || typeof error !== 'object') return null;
  const anyError = error as Record<string, unknown>;
  if (typeof anyError.status === 'number') return anyError.status;
  if (typeof anyError.code === 'number') return anyError.code;
  const response = anyError.response as Record<string, unknown> | undefined;
  if (typeof response?.status === 'number') return response.status;
  return null;
}

export function describeGoogleError(error: unknown): Described {
  const code = codeOf(error);
  if (code && DESCRIPTIONS[code]) return DESCRIPTIONS[code];

  const status = statusOf(error);
  if (status && STATUS_DESCRIPTIONS[status]) return STATUS_DESCRIPTIONS[status];

  return {
    title: 'Could not reach Google',
    detail:
      error instanceof Error && error.message
        ? error.message
        : 'An unexpected error occurred while loading data from Google.',
  };
}
