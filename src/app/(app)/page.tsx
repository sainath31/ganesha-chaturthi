import Link from 'next/link';
import { donationsForYear, expensesForYear, totals, byCategory, reimbursements, byCollector } from '@/lib/repository';
import { resolveYear } from '@/lib/year';
import { formatMoney } from '@/lib/format';
import { PageHeader, StatTile, EmptyState, ErrorNotice } from '@/components/ui/primitives';
import { CategoryBars, BalanceMeter } from '@/components/charts';

export const dynamic = 'force-dynamic';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const year = resolveYear((await searchParams).year);

  let donationRows, expenseRows;
  try {
    [donationRows, expenseRows] = await Promise.all([
      donationsForYear(year),
      expensesForYear(year),
    ]);
  } catch (error) {
    return (
      <ErrorNotice message={error instanceof Error ? error.message : 'Unknown error.'} />
    );
  }

  const summary = totals(donationRows, expenseRows);
  const categories = byCategory(expenseRows).slice(0, 8);
  const owed = reimbursements(expenseRows).filter((row) => row.pending > 0);
  const collectors = byCollector(donationRows);

  if (donationRows.length === 0 && expenseRows.length === 0) {
    return (
      <>
        <PageHeader title={`${year} Festival`} subtitle="Committee accounts" />
        <EmptyState
          title={`Nothing recorded for ${year} yet`}
          description="This year starts with a clean slate. Add the first donation or expense and the dashboard will fill in."
          action={
            <div className="mt-2 flex gap-2">
              <Link href={`/donations?year=${year}`} className="btn-primary">
                Add a donation
              </Link>
              <Link href={`/expenses?year=${year}`} className="btn-ghost">
                Add an expense
              </Link>
            </div>
          }
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={`${year} Festival`}
        subtitle={`${summary.donationCount} donations · ${summary.expenseCount} expenses`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Collected"
          value={formatMoney(summary.collected)}
          hint={summary.pledged > 0 ? `${formatMoney(summary.pledged)} pledged` : undefined}
          tone="positive"
        />
        <StatTile label="Spent" value={formatMoney(summary.spent)} hint={`${summary.expenseCount} entries`} />
        <StatTile
          label={summary.balance < 0 ? 'Shortfall' : 'Remaining'}
          value={formatMoney(Math.abs(summary.balance))}
          tone={summary.balance < 0 ? 'negative' : 'brand'}
        />
        <StatTile label="Contributing families" value={String(summary.donorCount)} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <section className="card p-6 lg:col-span-2">
          <h2 className="mb-5 font-display text-lg font-semibold">Balance</h2>
          <BalanceMeter collected={summary.collected} spent={summary.spent} />
          {summary.paidDirectly > 0 ? (
            <p className="mt-4 text-xs text-muted">
              Excludes {formatMoney(summary.paidDirectly)} paid directly by families, which never
              passed through the committee fund.
            </p>
          ) : null}
        </section>

        <section className="card p-6 lg:col-span-3">
          <h2 className="mb-5 font-display text-lg font-semibold">Spending by category</h2>
          {categories.length ? (
            <CategoryBars data={categories} />
          ) : (
            <p className="text-sm text-muted">No expenses recorded yet.</p>
          )}
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="card p-6">
          <h2 className="mb-1 font-display text-lg font-semibold">Reimbursements owed</h2>
          <p className="mb-4 text-sm text-muted">Money members fronted and have not been paid back.</p>
          {owed.length ? (
            <ul className="divide-y divide-line">
              {owed.map((row) => (
                <li key={row.person} className="flex items-center justify-between py-2.5">
                  <span className="text-sm text-ink">{row.person}</span>
                  <span className="text-sm font-medium tabular-nums text-negative">
                    {formatMoney(row.pending)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-positive">Everyone has been settled up.</p>
          )}
        </section>

        <section className="card p-6">
          <h2 className="mb-1 font-display text-lg font-semibold">Where the money came in</h2>
          <p className="mb-4 text-sm text-muted">Grouped by method and who received it.</p>
          {collectors.length ? (
            <ul className="divide-y divide-line">
              {collectors.map((row) => (
                <li key={row.key} className="flex items-center justify-between py-2.5">
                  <span className="text-sm text-ink">{row.key}</span>
                  <span className="text-sm font-medium tabular-nums text-muted">
                    {formatMoney(row.total)}
                    <span className="ml-2 text-xs text-faint">({row.count})</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">No donations recorded yet.</p>
          )}
        </section>
      </div>
    </>
  );
}
