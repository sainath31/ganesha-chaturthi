'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

export function SearchBox({ placeholder }: { placeholder: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  function onChange(value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set('q', value);
    else next.delete('q');
    startTransition(() => router.replace(`${pathname}?${next}`, { scroll: false }));
  }

  return (
    <input
      type="search"
      defaultValue={params.get('q') ?? ''}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      className="field sm:max-w-xs"
    />
  );
}
