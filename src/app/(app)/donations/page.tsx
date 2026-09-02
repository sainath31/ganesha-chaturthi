import { donationsForYear, totals, foodHeadcount } from '@/lib/repository';
import { resolveYear } from '@/lib/year';
import { formatMoney, today } from '@/lib/format';
import { ViewerNotice, PageHeader, ErrorNotice } from '@/components/ui/primitives';
import { DonationsBrowser } from '@/components/donations-browser';
import { currentUser, canEdit, canDelete } from '@/lib/auth';
import { redactDonation } from '@/lib/redact';

export const dynamic = 'force-dynamic';

export default async function DonationsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const params = await searchParams;
  const year = resolveYear(params.year);
  const role = (await currentUser())?.role ?? 'viewer';
  const editable = canEdit(role);
  const deletable = canDelete(role);

  let rows;
  try {
    rows = (await donationsForYear(year)).map((row) => redactDonation(row, role));
  } catch (error) {
    return <ErrorNotice message={error instanceof Error ? error.message : 'Unknown error.'} />;
  }

  const lanes = editable
    ? [...new Set(rows.map((row) => row.lane).filter(Boolean))].sort()
    : [];
  const summary = totals(rows, []);
  const food = foodHeadcount(rows);

  // Lanes are redacted for public viewers, so the per-lane rollup is only
  // meaningful — and only shown — to signed-in members.
  const laneTotals = editable
    ? [...rows
        .reduce((map, row) => {
          const lane = row.lane.trim() || 'Unspecified';
          const existing = map.get(lane) ?? { lane, total: 0, count: 0 };
          existing.total += row.amount;
          existing.count += 1;
          return map.set(lane, existing);
        }, new Map<string, { lane: string; total: number; count: number }>())
        .values()].sort((a, b) => b.total - a.total)
    : [];

  return (
    <>
      <PageHeader
        title="Donations"
        subtitle={[
          `${year}`,
          `${formatMoney(summary.collected)} collected from ${summary.donorCount} families`,
          summary.pledged > 0 ? `${formatMoney(summary.pledged)} pledged` : null,
          food.adults + food.kids > 0 ? `${food.adults} adults + ${food.kids} kids for food` : null,
        ]
          .filter(Boolean)
          .join(' · ')}
      />

      {!editable ? <ViewerNotice /> : null}

      {laneTotals.length > 1 ? (
        <section className="card mb-6 p-5">
          <h2 className="mb-4 font-display text-base font-semibold">Collected by lane</h2>
          <ul className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {laneTotals.map((row) => (
              <li
                key={row.lane}
                className="flex items-baseline justify-between gap-3 border-b border-line pb-2"
              >
                <span className="truncate text-sm text-ink">{row.lane}</span>
                <span className="shrink-0 text-sm font-medium tabular-nums text-muted">
                  {formatMoney(row.total)}
                  <span className="ml-1.5 text-xs text-faint">({row.count})</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <DonationsBrowser rows={rows} editable={editable} deletable={deletable} lanes={lanes} today={today()} year={year} />
    </>
  );
}
