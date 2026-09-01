import type { ReactNode } from 'react';
import { Table, Th, Td } from './ui/table';

/**
 * Wide financial tables do not survive a 390px viewport — the amount, which is
 * the one column people actually look for, ends up off-screen behind a
 * horizontal scroll. So phones get a stacked card per record and tablets up get
 * the table. Both are rendered server-side from the same rows; only one is ever
 * visible.
 */
export function ResponsiveRecords({
  cards,
  table,
  count,
  total,
}: {
  cards: ReactNode;
  table: ReactNode;
  /** Mirrors the table footer, which the card layout has no equivalent of. */
  count: string;
  total: string;
}) {
  return (
    <>
      <div className="sm:hidden">
        <ul className="space-y-3">{cards}</ul>
        <div className="card mt-3 flex items-baseline justify-between p-4">
          <span className="text-sm font-medium text-muted">{count}</span>
          <span className="font-display text-lg font-semibold tabular-nums text-ink">{total}</span>
        </div>
      </div>
      <div className="hidden sm:block">
        <Table>{table}</Table>
      </div>
    </>
  );
}

export function RecordCard({
  title,
  amount,
  meta,
  badges,
  actions,
}: {
  title: string;
  amount: string;
  meta: string;
  badges?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <li className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium text-ink">{title}</p>
          <p className="mt-0.5 truncate text-xs text-muted">{meta}</p>
        </div>
        <p className="shrink-0 font-display text-lg font-semibold tabular-nums text-ink">
          {amount}
        </p>
      </div>
      {badges || actions ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
          {badges}
          {actions ? <div className="ml-auto">{actions}</div> : null}
        </div>
      ) : null}
    </li>
  );
}

export { Th, Td };
