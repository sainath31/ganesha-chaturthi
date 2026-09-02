import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { env } from './env';

/**
 * Three tiers:
 *
 *   admin  — everything, including deleting records and receipt files
 *   editor — records donations and expenses, uploads receipts
 *   viewer — read-only
 *
 * Viewer is the default for everyone, signed in or not: anyone with the link
 * can read. Only admins and editors are named explicitly, so granting write
 * access means adding one address to an environment variable — and nobody
 * needs to be listed just to look.
 */
export type Role = 'admin' | 'editor' | 'viewer';

export function roleFor(email: string | null | undefined): Role {
  if (!email) return 'viewer';
  const address = email.toLowerCase();

  if (env.adminEmails.includes(address)) return 'admin';
  if (env.editorEmails.includes(address)) return 'editor';
  return 'viewer';
}

export function canEdit(role: Role): boolean {
  return role === 'admin' || role === 'editor';
}

export function canDelete(role: Role): boolean {
  return role === 'admin';
}

/**
 * Receipt images are gated separately from editing. By default any editor may
 * see them; setting RECEIPT_VIEWER_EMAILS narrows that to a named few, with
 * admins always retained so the committee cannot lock itself out.
 */
export function canViewReceipts(role: Role, email: string | null | undefined): boolean {
  if (role === 'admin') return true;
  if (!canEdit(role)) return false;

  const restricted = env.receiptViewerEmails;
  if (restricted.length === 0) return true;
  return restricted.includes((email ?? '').toLowerCase());
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  pages: { signIn: '/signin', error: '/signin' },
  callbacks: {
    signIn({ profile }) {
      // With public reads there is nothing to gate at sign-in: an unlisted
      // account simply signs in as a viewer and sees what it would have seen
      // anyway. Locked-down deployments admit only listed members.
      if (!env.requireSignIn) return true;
      return roleFor(profile?.email) !== 'viewer';
    },
    jwt({ token }) {
      token.role = roleFor(token.email);
      return token;
    },
    session({ session, token }) {
      session.user.role = (token.role as Role | null) ?? 'viewer';
      return session;
    },
  },
});

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.email) throw new Error('Not signed in.');
  return {
    email: session.user.email,
    name: session.user.name ?? session.user.email,
    role: session.user.role,
  };
}

/** Guards every write. A viewer reaching a server action directly is rejected here. */
export async function requireEditor() {
  const user = await requireUser();
  if (!canEdit(user.role)) {
    throw new Error('Your account has read-only access. Ask an admin for edit permission.');
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== 'admin') throw new Error('This action is restricted to committee admins.');
  return user;
}

/**
 * The viewer for the current request. In demo mode DEMO_ROLE can stand in for a
 * signed-in member, so every screen — including the entry forms — can be
 * previewed before any Google credentials exist.
 */
export async function currentUser(): Promise<{
  email: string;
  name: string;
  role: Role;
} | null> {
  if (process.env.DEMO_MODE === 'true' && process.env.DEMO_ROLE) {
    const role = process.env.DEMO_ROLE as Role;
    return { email: 'demo@example.com', name: 'Demo Member', role };
  }

  const session = await auth();
  if (!session?.user?.email) return null;
  return {
    email: session.user.email,
    name: session.user.name ?? session.user.email,
    role: session.user.role,
  };
}
