import { donationsForYear, expensesForYear, totals, byCategory, byCollector, reimbursements } from '@/lib/repository';
import { resolveYear } from '@/lib/year';
import { formatMoney } from '@/lib/format';
import { PageHeader, StatTile, ErrorNotice } from '@/components/ui/primitives';
import { Table, Th, Td } from '@/components/ui/table';
import { CategoryBars } from '@/components/charts';
import { PrintButton } from '@/components/print-button';

export const dynamic = 'force-dynamic';

export default async function ReportsPage({
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
    return <ErrorNotice message={error instanceof Error ? error.message : 'Unknown error.'} />;
  }

  const summary = totals(donationRows, expenseRows);
  const categories = byCategory(expenseRows);
  const collectors = byCollector(donationRows);
  const settlements = reimbursements(expenseRows);

  return (
    <>
      <PageHeader
        title="Statement of accounts"
        subtitle={`Ganesha Chaturthi ${year}`}
        action={<PrintButton />}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Total received" value={formatMoney(summary.collected)} tone="positive" />
        <StatTile label="Total spent" value={formatMoney(summary.spent)} />
        <StatTile
          label={summary.balance < 0 ? 'Shortfall' : 'Balance remaining'}
          value={formatMoney(Math.abs(summary.balance))}
          tone={summary.balance < 0 ? 'negative' : 'brand'}
        />
      </div>

      <section className="card mt-6 p-6">
        <h2 className="mb-5 font-display text-lg font-semibold">Expenditure by category</h2>
        {categories.length ? (
          <CategoryBars data={categories} />
        ) : (
          <p className="text-sm text-muted">Nothing recorded yet.</p>
        )}
      </section>

      <section className="mt-6">
        <h2 className="mb-3 font-display text-lg font-semibold">Receipts by collection method</h2>
        <Table>
          <thead>
            <tr className="border-b border-line bg-raised/60">
              <Th>Method</Th>
              <Th align="right">Entries</Th>
              <Th align="right">Amount</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {collectors.map((row) => (
              <tr key={row.key}>
                <Td className="text-ink">{row.key}</Td>
                <Td align="right" className="tabular-nums text-muted">{row.count}</Td>
                <Td align="right" className="font-medium tabular-nums text-ink">
                  {formatMoney(row.total)}
                </Td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-line bg-raised/60">
              <Td className="font-medium text-muted">Total</Td>
              <Td align="right" className="tabular-nums text-muted">{summary.donationCount}</Td>
              <Td align="right" className="font-display font-semibold tabular-nums">
                {formatMoney(summary.collected)}
              </Td>
            </tr>
          </tfoot>
        </Table>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 font-display text-lg font-semibold">Member settlements</h2>
        <Table>
          <thead>
            <tr className="border-b border-line bg-raised/60">
              <Th>Member</Th>
              <Th align="right">Fronted</Th>
              <Th align="right">Cleared</Th>
              <Th align="right">Outstanding</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {settlements.map((row) => (
              <tr key={row.person}>
                <Td className="text-ink">{row.person}</Td>
                <Td align="right" className="tabular-nums text-muted">{formatMoney(row.total)}</Td>
                <Td align="right" className="tabular-nums text-positive">{formatMoney(row.cleared)}</Td>
                <Td
                  align="right"
                  className={`font-medium tabular-nums ${row.pending > 0 ? 'text-negative' : 'text-muted'}`}
                >
                  {formatMoney(row.pending)}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </section>

      {summary.paidDirectly > 0 ? (
        <p className="mt-6 text-sm text-muted">
          A further {formatMoney(summary.paidDirectly)} was paid directly by families and is not
          included in the committee totals above.
        </p>
      ) : null}
    </>
  );
}
