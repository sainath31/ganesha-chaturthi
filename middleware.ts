import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

/**
 * Read access is public, so there is nothing to protect here by default —
 * every write is guarded inside the server action itself, which is the only
 * check that actually matters. Middleware only bites when a deployment sets
 * REQUIRE_SIGN_IN.
 */
export default auth((request) => {
  if (process.env.REQUIRE_SIGN_IN !== 'true') return NextResponse.next();
  if (request.auth) return NextResponse.next();

  const signInUrl = new URL('/signin', request.nextUrl.origin);
  return NextResponse.redirect(signInUrl);
});

export const config = {
  matcher: ['/((?!api/auth|signin|_next/static|_next/image|favicon.ico).*)'],
};
