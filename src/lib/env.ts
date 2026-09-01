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
  /** Full access, including deletion. */
  get adminEmails() {
    return list('ADMIN_EMAILS');
  },
  /** May record donations and expenses and upload receipts. */
  get editorEmails() {
    return list('EDITOR_EMAILS');
  },
  /**
   * Optional narrower list for receipt images specifically. When empty, any
   * editor or admin can view them; when set, only these addresses (plus
   * admins) can — useful when more people record expenses than should see the
   * bills themselves.
   */
  get receiptViewerEmails() {
    return list('RECEIPT_VIEWER_EMAILS');
  },
  /**
   * Read access is public by default: anyone with the link sees the figures
   * without signing in. Set REQUIRE_SIGN_IN=true to instead demand a Google
   * account, in which case only listed admins and editors can get in at all.
   */
  get requireSignIn() {
    return process.env.REQUIRE_SIGN_IN === 'true';
  },
  get currency() {
    return process.env.NEXT_PUBLIC_CURRENCY ?? 'USD';
  },
  get locale() {
    return process.env.NEXT_PUBLIC_LOCALE ?? 'en-US';
  },
  /**
   * Optional: sends an email via Gmail SMTP whenever someone submits an
   * access request. The request is always logged to the sheet regardless —
   * these three just enable the email on top of that. Leave any of them
   * unset to skip email and rely on checking the sheet instead.
   */
  get gmailUser() {
    return process.env.GMAIL_USER || null;
  },
  get gmailAppPassword() {
    return process.env.GMAIL_APP_PASSWORD || null;
  },
  get accessRequestNotifyEmail() {
    return process.env.ACCESS_REQUEST_NOTIFY_EMAIL || null;
  },
};
