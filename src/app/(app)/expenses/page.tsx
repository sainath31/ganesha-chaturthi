import { expensesForYear, donationsForYear, totals, reimbursements } from '@/lib/repository';
import { receipts as receiptTable } from '@/lib/repository';
import { resolveYear } from '@/lib/year';
import { formatMoney, formatDate, today } from '@/lib/format';
import { PageHeader, EmptyState, Badge, ErrorNotice } from '@/components/ui/primitives';
import { Table, Th, Td } from '@/components/ui/table';
import { ExpenseForm } from '@/components/expense-form';
import { SearchBox } from '@/components/search-box';

export const dynamic = 'force-dynamic';

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; q?: string }>;
}) {
  const params = await searchParams;
  const year = resolveYear(params.year);
  const query = (params.q ?? '').trim().toLowerCase();

  let rows, donationRows, receiptRows;
  try {
    [rows, donationRows, receiptRows] = await Promise.all([
      expensesForYear(year),
      donationsForYear(year),
      receiptTable.list(),
    ]);
  } catch (error) {
    return <ErrorNotice message={error instanceof Error ? error.message : 'Unknown error.'} />;
  }

  const receiptCount = new Map<string, number>();
  for (const receipt of receiptRows) {
    if (receipt.year !== year || !receipt.expenseId) continue;
    receiptCount.set(receipt.expenseId, (receiptCount.get(receipt.expenseId) ?? 0) + 1);
  }

  const people = [...new Set(rows.map((row) => row.paidBy).filter(Boolean))].sort();
  const filtered = query
    ? rows.filter((row) =>
        [row.description, row.category, row.store, row.paidBy, row.notes]
          .join(' ')
          .toLowerCase()
          .includes(query),
      )
    : rows;
  const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date));
  const shown = sorted.reduce((sum, row) => sum + row.amount, 0);
  const summary = totals(donationRows, rows);
  const owed = reimbursements(rows);

  return (
    <>
      <PageHeader
        title="Expenses"
        subtitle={`${year} · ${formatMoney(summary.spent)} spent of ${formatMoney(summary.collected)} collected`}
      />

      {owed.length > 0 ? (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {owed.map((row) => (
            <div key={row.person} className="card p-4">
              <p className="truncate text-xs font-medium uppercase tracking-wide text-faint">
                {row.person}
              </p>
              <p className="mt-1.5 font-display text-xl font-semibold tabular-nums">
                {formatMoney(row.total)}
              </p>
              <p className={`mt-0.5 text-xs ${row.pending > 0 ? 'text-negative' : 'text-positive'}`}>
                {row.pending > 0 ? `${formatMoney(row.pending)} outstanding` : 'Settled'}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <SearchBox placeholder="Search description, store or payer" />
        <ExpenseForm today={today()} people={people} />
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          title={query ? 'No matches' : `No expenses recorded for ${year}`}
          description={
            query ? 'Try a different store or category.' : 'Add the first cost of the year, with its receipt.'
          }
        />
      ) : (
        <Table>
          <thead>
            <tr className="border-b border-line bg-raised/60">
              <Th>Date</Th>
              <Th>Description</Th>
              <Th>Category</Th>
              <Th>Store</Th>
              <Th>Paid by</Th>
              <Th align="right">Amount</Th>
              <Th>Settlement</Th>
              <Th>Receipts</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {sorted.map((row) => (
              <tr key={row.id} className="transition-colors hover:bg-raised/40">
                <Td className="whitespace-nowrap text-muted">{formatDate(row.date)}</Td>
                <Td className="font-medium text-ink">
                  {row.description}
                  {row.notes ? <span className="block text-xs text-faint">{row.notes}</span> : null}
                </Td>
                <Td className="text-muted">{row.category}</Td>
                <Td className="text-muted">{row.store || '—'}</Td>
                <Td className="text-muted">{row.paidBy}</Td>
                <Td align="right" className="font-medium tabular-nums text-ink">
                  {formatMoney(row.amount)}
                </Td>
                <Td>
                  <Badge tone={row.settlement === 'Cleared' ? 'brand' : 'neutral'}>
                    {row.settlement}
                  </Badge>
                </Td>
                <Td className="tabular-nums text-muted">{receiptCount.get(row.id) ?? 0}</Td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-line bg-raised/60">
              <Td colSpan={5} className="font-medium text-muted">
                {sorted.length} {sorted.length === 1 ? 'entry' : 'entries'}
                {query ? ' matching' : ''}
              </Td>
              <Td align="right" className="font-display text-base font-semibold tabular-nums">
                {formatMoney(shown)}
              </Td>
              <Td colSpan={2} />
            </tr>
          </tfoot>
        </Table>
      )}
    </>
  );
}
