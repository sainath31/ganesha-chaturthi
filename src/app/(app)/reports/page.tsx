import { donationsForYear, expensesForYear, totals, byCategory, byCollector, reimbursements } from '@/lib/repository';
import { resolveYear } from '@/lib/year';
import { currentUser, canEdit } from '@/lib/auth';
import { redactDonation, redactExpense } from '@/lib/redact';
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

  const role = (await currentUser())?.role ?? 'viewer';

  let donationRows, expenseRows;
  try {
    const [rawDonations, rawExpenses] = await Promise.all([
      donationsForYear(year),
      expensesForYear(year),
    ]);
    donationRows = rawDonations.map((row) => redactDonation(row, role));
    expenseRows = rawExpenses.map((row) => redactExpense(row, role));
  } catch (error) {
    return <ErrorNotice message={error instanceof Error ? error.message : 'Unknown error.'} />;
  }

  const editable = canEdit(role);
  const summary = totals(donationRows, expenseRows);
  const categories = byCategory(expenseRows);
  // Who received or fronted money is committee-internal; the public
  // statement shows method/category totals only, not member names.
  const collectors = byCollector(
    editable ? donationRows : donationRows.map((row) => ({ ...row, collectedBy: '' })),
  );
  const settlements = reimbursements(expenseRows);
  const settlementTotals = settlements.reduce(
    (acc, row) => ({
      total: acc.total + row.total,
      cleared: acc.cleared + row.cleared,
      pending: acc.pending + row.pending,
    }),
    { total: 0, cleared: 0, pending: 0 },
  );
  const categoryTotal = categories.reduce((sum, row) => sum + row.total, 0);

  return (
    <>
      <PageHeader
        title="Statement of accounts"
        subtitle={`Ganesha Chaturthi ${year}`}
        action={<PrintButton />}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatTile label="Total received" value={formatMoney(summary.collected)} tone="positive" />
        <StatTile label="Total spent" value={formatMoney(summary.spent)} tone="accent" />
        <StatTile
          label={summary.balance < 0 ? 'Shortfall' : 'Balance remaining'}
          value={formatMoney(Math.abs(summary.balance))}
          tone={summary.balance < 0 ? 'negative' : 'positive'}
        />
      </div>

      <section className="card mt-6 p-6">
        <div className="mb-5 flex items-baseline justify-between gap-4">
          <h2 className="font-display text-lg font-semibold">Expenditure by category</h2>
          <span className="font-display text-base font-semibold tabular-nums">
            {formatMoney(categoryTotal)}
          </span>
        </div>
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
                  className={`font-medium tabular-nums ${row.pending > 0 ? 'text-negative' : 'text-positive'}`}
                >
                  {formatMoney(row.pending)}
                </Td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-line bg-raised/60">
              <Td className="font-medium text-muted">Total</Td>
              <Td align="right" className="font-display font-semibold tabular-nums">
                {formatMoney(settlementTotals.total)}
              </Td>
              <Td align="right" className="font-medium tabular-nums text-positive">
                {formatMoney(settlementTotals.cleared)}
              </Td>
              <Td
                align="right"
                className={`font-display font-semibold tabular-nums ${
                  settlementTotals.pending > 0 ? 'text-negative' : 'text-positive'
                }`}
              >
                {formatMoney(settlementTotals.pending)}
              </Td>
            </tr>
          </tfoot>
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
