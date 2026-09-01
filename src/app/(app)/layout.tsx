import { Suspense } from 'react';
import { currentUser } from '@/lib/auth';
import { Nav } from '@/components/nav';
import { ToastProvider } from '@/components/toast';
import { availableYears, currentYear } from '@/lib/year';
import { ensureAllTabs } from '@/lib/repository';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const member = await currentUser();

  // A misconfigured sheet should not lock the whole app out of its navigation.
  let years: number[] = [currentYear()];
  try {
    await ensureAllTabs();
    years = await availableYears();
  } catch {
    /* the page below will surface the real error */
  }

  return (
    <ToastProvider>
      <div className="min-h-screen">
      <Suspense fallback={<div className="h-[6.4rem] border-b border-line" />}>
        <Nav
          user={member}
          years={years}
          year={years[0]}
        />
      </Suspense>
        <main className="enter mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6 sm:pb-10 sm:pt-10">{children}</main>
      </div>
    </ToastProvider>
  );
}
