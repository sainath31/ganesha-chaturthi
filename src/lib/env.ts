function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. See SETUP.md — copy .env.example to .env.local and fill it in.`,
    );
  }
  return value;
}

function list(name: string): string[] {
  return (process.env[name] ?? '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

export const env = {
  get googleClientId() {
    return required('GOOGLE_CLIENT_ID');
  },
  get googleClientSecret() {
    return required('GOOGLE_CLIENT_SECRET');
  },
  /** Refresh token for the Google account that owns the sheets and Drive folder. */
  get googleRefreshToken() {
    return required('GOOGLE_REFRESH_TOKEN');
  },
  get spreadsheetId() {
    return required('SHEET_ID');
  },
  get receiptsFolderId() {
    return required('DRIVE_RECEIPTS_FOLDER_ID');
  },
  get allowedEmails() {
    return list('ALLOWED_EMAILS');
  },
  get adminEmails() {
    return list('ADMIN_EMAILS');
  },
  get currency() {
    return process.env.NEXT_PUBLIC_CURRENCY ?? 'USD';
  },
  get locale() {
    return process.env.NEXT_PUBLIC_LOCALE ?? 'en-US';
  },
};
