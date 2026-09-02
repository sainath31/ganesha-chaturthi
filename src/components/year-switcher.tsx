'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { resolveYear } from '@/lib/resolve-year';

/** Reads the selected year straight from the URL so every page stays in sync. */
export function YearSwitcher({ years, fallback }: { years: number[]; fallback: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const requested = resolveYear(params.get('year') ?? undefined);
  const selected = years.includes(requested) ? requested : fallback;

  function choose(year: string) {
    const next = new URLSearchParams(params);
    next.set('year', year);
    startTransition(() => router.push(`${pathname}?${next}`));
  }

  return (
    <label className="flex items-center gap-2">
      <span className="sr-only">Festival year</span>
      <select
        value={selected}
        disabled={pending}
        onChange={(event) => choose(event.target.value)}
        className="field w-auto py-1.5 pr-8 text-sm font-medium tabular-nums disabled:opacity-60"
      >
        {years.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    </label>
  );
}
