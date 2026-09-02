import Image from 'next/image';
import { signIn } from '@/lib/auth';
import { ToastProvider } from '@/components/toast';

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <ToastProvider>
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_40rem_at_50%_-10%,rgb(var(--brand)/0.14),transparent)]"
        />

        <div className="relative w-full max-w-sm">
          <div className="mb-8 text-center">
            <Image
              src="/om-logo.png"
              alt=""
              width={64}
              height={64}
              priority
              className="mx-auto h-16 w-16 rounded-full object-cover shadow-lift"
            />
            <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight">
              Ganesha Chaturthi
            </h1>
            <p className="mt-1.5 text-sm text-muted">Committee accounts &amp; receipts</p>
          </div>

          <div className="card p-6">
            {error ? (
              <p role="alert" className="mb-4 rounded-xl bg-negative/10 px-3 py-2.5 text-sm text-negative">
                {error === 'AccessDenied'
                  ? 'That Google account is not on the committee list. Ask an admin to add you.'
                  : 'Sign-in failed. Please try again.'}
              </p>
            ) : null}

            <form
              action={async () => {
                'use server';
                await signIn('google', { redirectTo: '/' });
              }}
            >
              <button type="submit" className="btn-primary w-full py-2.5">
                <GoogleMark />
                Continue with Google
              </button>
            </form>

            {/* "Request access" form disabled for now — access is granted
                manually. Re-add <RequestAccessForm /> (from
                '@/components/request-access-form') here to turn it back on;
                the underlying action, sheet tab and email notify still work. */}
          </div>
        </div>
      </main>
    </ToastProvider>
  );
}

function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden focusable="false">
      <path
        fill="currentColor"
        d="M23.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.87c2.26-2.09 3.56-5.17 3.56-8.87Z"
        opacity=".9"
      />
      <path
        fill="currentColor"
        d="M12 24c3.24 0 5.96-1.08 7.94-2.91l-3.87-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.28v3.09A12 12 0 0 0 12 24Z"
        opacity=".75"
      />
      <path
        fill="currentColor"
        d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.62H1.28a12 12 0 0 0 0 10.76l3.99-3.09Z"
        opacity=".6"
      />
      <path
        fill="currentColor"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.28 6.62l3.99 3.09C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  );
}
