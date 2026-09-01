'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { YearSwitcher } from './year-switcher';

const LINKS = [
  { href: '/', label: 'Dashboard' },
  { href: '/donations', label: 'Donations' },
  { href: '/expenses', label: 'Expenses' },
  { href: '/receipts', label: 'Receipts' },
  { href: '/reports', label: 'Reports' },
];

export function Nav({
  user,
  years,
  year,
}: {
  user: { name: string; email: string; role: string };
  years: number[];
  year: number;
}) {
  const pathname = usePathname();
  const params = useSearchParams();
  const qs = params.get('year') ? `?year=${params.get('year')}` : '';

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span aria-hidden className="text-xl">🕉️</span>
          <span className="font-display text-base font-semibold tracking-tight">
            Ganesha Chaturthi
          </span>
        </Link>

        <nav className="-mx-1 flex flex-1 items-center gap-1 overflow-x-auto">
          {LINKS.map((link) => {
            const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={`${link.href}${qs}`}
                aria-current={active ? 'page' : undefined}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  active ? 'bg-brand/10 text-brand' : 'text-muted hover:bg-raised hover:text-ink'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <YearSwitcher years={years} fallback={year} />
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium leading-tight text-ink">{user.name}</p>
            <p className="text-xs capitalize leading-tight text-faint">{user.role}</p>
          </div>
          <Link href="/api/auth/signout" className="text-sm text-muted hover:text-ink">
            Sign out
          </Link>
        </div>
      </div>
    </header>
  );
}
