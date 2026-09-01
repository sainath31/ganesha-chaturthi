'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { YearSwitcher } from './year-switcher';
import { signOutAction } from '@/lib/actions';
import {
  DashboardIcon,
  DonationIcon,
  ExpenseIcon,
  ReceiptIcon,
  ReportIcon,
  RsvpIcon,
  SignOutIcon,
} from './icons';

const LINKS = [
  { href: '/', label: 'Dashboard', icon: DashboardIcon },
  { href: '/donations', label: 'Donations', icon: DonationIcon },
  { href: '/expenses', label: 'Expenses', icon: ExpenseIcon },
  { href: '/rsvp', label: 'RSVP', icon: RsvpIcon },
  { href: '/receipts', label: 'Receipts', icon: ReceiptIcon },
  { href: '/reports', label: 'Reports', icon: ReportIcon },
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
  const [navigating, setNavigating] = useState(false);

  useEffect(() => {
    setNavigating(false);
  }, [pathname, qs]);

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));
  const go = (href: string) => setNavigating(!isActive(href));

  return (
    <>
      {navigating ? <NavigationOverlay /> : null}

      <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Link href={`/${qs}`} className="flex shrink-0 items-center gap-2.5" onClick={() => go('/')}>
            <Image
              src="/om-logo.png"
              alt="Ganesha Chaturthi"
              width={32}
              height={32}
              priority
              className="h-8 w-8 rounded-full object-cover shadow-sm ring-1 ring-line"
            />
            <span className="hidden font-display text-[15px] font-semibold tracking-tight sm:block">
              Ganesha Chaturthi
            </span>
          </Link>

          <nav className="ml-6 hidden items-center gap-0.5 md:flex">
            {LINKS.map((link) => {
              const active = isActive(link.href);
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={`${link.href}${qs}`}
                  aria-current={active ? 'page' : undefined}
                  onClick={() => go(link.href)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    active ? 'bg-brand/10 text-brand' : 'text-muted hover:bg-raised hover:text-ink'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

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
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur-md md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <ul className="grid grid-cols-6">
          {LINKS.map((link) => {
            const active = isActive(link.href);
            const Icon = link.icon;
            return (
              <li key={link.href}>
                <Link
                  href={`${link.href}${qs}`}
                  aria-current={active ? 'page' : undefined}
                  onClick={() => go(link.href)}
                  className="relative flex flex-col items-center gap-0.5 py-1.5 text-[10px] font-medium"
                >
                  <span
                    aria-hidden
                    className={`absolute top-0 h-0.5 w-6 rounded-full transition-colors ${
                      active ? 'bg-brand' : 'bg-transparent'
                    }`}
                  />
                  <Icon className={`h-[18px] w-[18px] transition-colors ${active ? 'text-brand' : 'text-faint'}`} />
                  <span className={active ? 'text-brand' : 'text-faint'}>{link.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}

function NavigationOverlay() {
  return (
    <div
      role="status"
      aria-label="Loading page"
      className="fixed inset-0 z-50 grid place-items-center bg-bg/70 backdrop-blur-sm"
    >
      <Image
        src="/om-logo.png"
        alt=""
        width={56}
        height={56}
        className="h-14 w-14 animate-spin rounded-full shadow-lift"
        style={{ animationDuration: '1.4s' }}
      />
    </div>
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
        <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-brand to-accent text-xs font-semibold text-brand-ink shadow-sm">
          {initials || '?'}
        </span>
      </summary>
      <div className="absolute right-0 top-full z-40 mt-2 w-52 rounded-xl border border-line bg-surface p-1.5 shadow-lift">
        <div className="px-2.5 py-2">
          <p className="truncate text-sm font-medium text-ink">{name}</p>
          <p className="text-xs capitalize text-faint">{role}</p>
        </div>
        <div className="my-1 h-px bg-line" />
        <form action={signOutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm text-muted hover:bg-raised hover:text-ink"
          >
            <SignOutIcon className="h-4 w-4" />
            Sign out
          </button>
        </form>
      </div>
    </details>
  );
}
