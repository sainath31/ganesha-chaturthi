import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { Nav } from '@/components/nav';
import { availableYears, currentYear } from '@/lib/year';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.email) redirect('/signin');

  // A misconfigured sheet should not lock the whole app out of its navigation.
  let years: number[] = [currentYear()];
  try {
    years = await availableYears();
  } catch {
    /* the page below will surface the real error */
  }

  return (
    <div className="min-h-screen">
      <Suspense fallback={<div className="h-14 border-b border-line" />}>
        <Nav
          user={{
            name: session.user.name ?? session.user.email,
            email: session.user.email,
            role: session.user.role,
          }}
          years={years}
          year={years[0]}
        />
      </Suspense>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}
