import { expensesForYear, donationsForYear, totals, reimbursements, byCategory } from '@/lib/repository';
import { receipts as receiptTable } from '@/lib/repository';
import { resolveYear } from '@/lib/year';
import { formatMoney, today } from '@/lib/format';
import { ViewerNotice, PageHeader, ErrorNotice } from '@/components/ui/primitives';
import { Table, Th, Td } from '@/components/ui/table';
import { ExpensesBrowser } from '@/components/expenses-browser';
import { currentUser, canEdit, canDelete } from '@/lib/auth';
import { redactExpense, redactDonation } from '@/lib/redact';

export const dynamic = 'force-dynamic';

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const params = await searchParams;
  const year = resolveYear(params.year);
  const role = (await currentUser())?.role ?? 'viewer';
  const editable = canEdit(role);
  const deletable = canDelete(role);

  let rows, donationRows, receiptRows;
  try {
    const [rawExpenses, rawDonations, rawReceipts] = await Promise.all([
      expensesForYear(year),
      donationsForYear(year),
      receiptTable.list(),
    ]);
    rows = rawExpenses.map((row) => redactExpense(row, role));
    donationRows = rawDonations.map((row) => redactDonation(row, role));
    receiptRows = rawReceipts;
  } catch (error) {
    return <ErrorNotice message={error instanceof Error ? error.message : 'Unknown error.'} />;
  }

  const receiptCount = new Map<string, number>();
  for (const receipt of receiptRows) {
    if (receipt.year !== year || !receipt.expenseId) continue;
    receiptCount.set(receipt.expenseId, (receiptCount.get(receipt.expenseId) ?? 0) + 1);
  }

  const people = editable
    ? [...new Set(rows.map((row) => row.paidBy).filter(Boolean))].sort()
    : [];
  const summary = totals(donationRows, rows);
  const owed = reimbursements(rows);
  const categories = byCategory(rows);

  return (
    <>
      <PageHeader
        title="Expenses"
        subtitle={`${year} · ${formatMoney(summary.spent)} spent of ${formatMoney(summary.collected)} collected`}
      />

      {!editable ? <ViewerNotice /> : null}

      {categories.length > 1 ? (
        <section className="card mb-6 p-5">
          <h2 className="font-display text-base font-semibold">
            Subtotals by category
            <span className="ml-2 text-sm font-normal text-faint">
              ({categories.length} categories)
            </span>
          </h2>
          <ul className="mt-4 grid gap-x-6 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((row) => (
              <li
                key={row.category}
                className="flex items-baseline justify-between gap-3 border-b border-line pb-2"
              >
                <span className="truncate text-sm text-ink">{row.category}</span>
                <span className="shrink-0 text-sm font-medium tabular-nums text-muted">
                  {formatMoney(row.total)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <ExpensesBrowser
        rows={rows}
        editable={editable}
        deletable={deletable}
        people={people}
        receiptCount={receiptCount}
        today={today()}
        year={year}
      />

      {owed.length > 0 ? (
        <div className="mt-6">
          <h2 className="mb-3 font-display text-lg font-semibold">Reimbursements</h2>
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
              {owed.map((row) => (
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
          </Table>
        </div>
      ) : null}
    </>
  );
}
