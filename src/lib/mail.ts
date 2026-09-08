import nodemailer from 'nodemailer';
import { env } from './env';

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (!env.gmailUser || !env.gmailAppPassword) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: env.gmailUser, pass: env.gmailAppPassword },
    });
  }
  return transporter;
}

/**
 * Best-effort: failing to send email should never block the access request
 * itself from being logged to the sheet, so callers just fire-and-forget this
 * and the caller's own try/catch (if any) is not relied upon here.
 */
export async function notifyAccessRequest(request: {
  email: string;
  name: string;
  message: string;
}): Promise<void> {
  const client = getTransporter();
  const to = env.accessRequestNotifyEmail ?? env.gmailUser;
  if (!client || !to) return;

  try {
    await client.sendMail({
      from: env.gmailUser!,
      to,
      subject: `Access request from ${request.name || request.email}`,
      text: [
        `Email: ${request.email}`,
        request.name ? `Name: ${request.name}` : null,
        request.message ? `Message: ${request.message}` : null,
        '',
        'Add them to ADMIN_EMAILS or EDITOR_EMAILS in .env.local to grant access.',
      ]
        .filter(Boolean)
        .join('\n'),
    });
  } catch (error) {
    console.error('Failed to send access request notification email:', error);
  }
}

/**
 * Alerts the committee when the nightly check finds the Google connection
 * broken. Deliberately spells out the remedy: the person reading it may be
 * doing this a year after setup, with no memory of how it was wired together.
 */
export async function sendHealthAlert(result: {
  title?: string;
  detail?: string;
  checkedAt: string;
  checks: { name: string; ok: boolean; detail?: string }[];
}): Promise<void> {
  const client = getTransporter();
  const to = env.accessRequestNotifyEmail ?? env.gmailUser;
  if (!client || !to) return;

  const failed = result.checks.filter((check) => !check.ok).map((check) => check.name);

  try {
    await client.sendMail({
      from: env.gmailUser!,
      to,
      subject: `[Ganesha Chaturthi] Site cannot reach Google (${failed.join(', ')})`,
      text: [
        result.title ?? 'The Google connection is not working.',
        '',
        result.detail ?? '',
        '',
        `Checked at: ${result.checkedAt}`,
        `Failing: ${failed.join(', ')}`,
        '',
        'The site is showing an error instead of the accounts until this is fixed.',
        'Recovery steps are in SETUP.md under Troubleshooting.',
      ]
        .filter((line) => line !== null)
        .join('\n'),
    });
  } catch (error) {
    console.error('Failed to send health alert email:', error);
  }
}
