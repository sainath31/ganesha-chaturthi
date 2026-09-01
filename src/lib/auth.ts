import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { env } from './env';

export type Role = 'admin' | 'volunteer';

function roleFor(email: string | null | undefined): Role | null {
  if (!email) return null;
  const address = email.toLowerCase();
  if (env.adminEmails.includes(address)) return 'admin';

  // An empty allowlist means "admins only" rather than "everyone" — failing
  // closed matters more than convenience for a page showing donation records.
  const allowlist = env.allowedEmails;
  if (allowlist.length === 0) return null;
  return allowlist.includes(address) ? 'volunteer' : null;
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
      return roleFor(profile?.email) !== null;
    },
    jwt({ token }) {
      token.role = roleFor(token.email);
      return token;
    },
    session({ session, token }) {
      session.user.role = (token.role as Role | null) ?? 'volunteer';
      return session;
    },
  },
});

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.email) throw new Error('Not signed in.');
  return { email: session.user.email, name: session.user.name ?? session.user.email, role: session.user.role };
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== 'admin') throw new Error('This action is restricted to committee admins.');
  return user;
}
