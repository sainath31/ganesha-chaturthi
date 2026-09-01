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
  user: { name: string; email: string; role: string } | null;
  years: number[];
  year: number;
}) {
  const pathname = usePathname();
  const params = useSearchParams();
  const qs = params.get('year') ? `?year=${params.get('year')}` : '';

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link href={`/${qs}`} className="flex shrink-0 items-center gap-2.5">
          <span aria-hidden className="text-lg">
            🕉️
          </span>
          <span className="hidden font-display text-[15px] font-semibold tracking-tight sm:block">
            Ganesha Chaturthi
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <YearSwitcher years={years} fallback={year} />
          <div className="hidden h-5 w-px bg-line sm:block" />
          {user ? (
            <Avatar name={user.name} role={user.role} />
          ) : (
            <Link
              href="/signin"
              className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-raised hover:text-ink"
            >
              Committee sign in
            </Link>
          )}
        </div>
      </div>

      <nav className="scroll-x mx-auto -mb-px max-w-6xl px-4 sm:px-6">
        <ul className="flex gap-1">
          {LINKS.map((link) => {
            const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
            return (
              <li key={link.href}>
                <Link
                  href={`${link.href}${qs}`}
                  aria-current={active ? 'page' : undefined}
                  className={`block whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? 'border-brand text-brand'
                      : 'border-transparent text-muted hover:text-ink'
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}

function Avatar({ name, role }: { name: string; role: string }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <details className="relative">
      <summary
        className="flex cursor-pointer list-none items-center gap-2 rounded-lg p-1 hover:bg-raised"
        aria-label="Account menu"
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-brand/12 text-xs font-semibold text-brand">
          {initials || '?'}
        </span>
      </summary>
      <div className="absolute right-0 top-full z-40 mt-2 w-52 rounded-xl border border-line bg-surface p-1.5 shadow-lift">
        <div className="px-2.5 py-2">
          <p className="truncate text-sm font-medium text-ink">{name}</p>
          <p className="text-xs capitalize text-faint">{role}</p>
        </div>
        <div className="my-1 h-px bg-line" />
        <Link
          href="/api/auth/signout"
          className="block rounded-lg px-2.5 py-1.5 text-sm text-muted hover:bg-raised hover:text-ink"
        >
          Sign out
        </Link>
      </div>
    </details>
  );
}
