import { formatMoney } from '@/lib/format';

/**
 * Charts are inline SVG rather than a charting library: the shapes needed here
 * are simple, and it keeps the bundle small and the colours on the same tokens
 * as the rest of the app in both themes.
 */

export function CategoryBars({ data }: { data: { category: string; total: number }[] }) {
  const max = Math.max(...data.map((d) => d.total), 1);

  return (
    <ul className="space-y-3">
      {data.map((row) => (
        <li key={row.category}>
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <span className="truncate text-sm text-ink">{row.category}</span>
            <span className="shrink-0 text-sm font-medium tabular-nums text-muted">
              {formatMoney(row.total)}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-raised">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${Math.max((row.total / max) * 100, 2)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function BalanceMeter({
  collected,
  spent,
}: {
  collected: number;
  spent: number;
}) {
  const ceiling = Math.max(collected, spent, 1);
  const collectedPct = (collected / ceiling) * 100;
  const spentPct = (spent / ceiling) * 100;
  const overspent = spent > collected;

  return (
    <div className="space-y-4">
      <Track label="Collected" value={collected} pct={collectedPct} className="bg-positive" />
      <Track
        label="Spent"
        value={spent}
        pct={spentPct}
        className={overspent ? 'bg-negative' : 'bg-accent'}
      />
      <div className="flex items-baseline justify-between border-t border-line pt-3">
        <span className="text-sm font-medium text-ink">
          {overspent ? 'Shortfall' : 'Remaining'}
        </span>
        <span
          className={`font-display text-xl font-semibold tabular-nums ${
            overspent ? 'text-negative' : 'text-positive'
          }`}
        >
          {formatMoney(Math.abs(collected - spent))}
        </span>
      </div>
    </div>
  );
}

function Track({
  label,
  value,
  pct,
  className,
}: {
  label: string;
  value: number;
  pct: number;
  className: string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-sm text-muted">{label}</span>
        <span className="text-sm font-medium tabular-nums text-ink">{formatMoney(value)}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-raised">
        <div className={`h-full rounded-full ${className}`} style={{ width: `${Math.max(pct, 2)}%` }} />
      </div>
    </div>
  );
}
