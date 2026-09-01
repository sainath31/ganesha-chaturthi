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
