import { expensesForYear, donationsForYear, totals, reimbursements, byCategory } from '@/lib/repository';
import { receipts as receiptTable } from '@/lib/repository';
import { resolveYear } from '@/lib/year';
import { formatMoney, today } from '@/lib/format';
import { ViewerNotice, PageHeader, ErrorNotice } from '@/components/ui/primitives';
import { ExpensesBrowser } from '@/components/expenses-browser';
import { currentUser, canEdit } from '@/lib/auth';
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
  const deletable = role === 'admin';

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

      {owed.length > 0 ? (
        <div className="mb-6">
          <h2 className="mb-1 font-display text-lg font-semibold">Reimbursements</h2>
          <p className="mb-4 text-sm text-muted">
            One card per committee member who fronted money, what they paid out and whether
            it's been paid back.
          </p>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {owed.map((row) => (
              <div key={row.person} className="card p-4">
                <p className="truncate text-xs font-medium uppercase tracking-wide text-faint">
                  {row.person}
                </p>
                <p className="mt-1.5 font-display text-xl font-semibold tabular-nums">
                  {formatMoney(row.total)}
                </p>
                <p className="text-[11px] text-faint">fronted</p>
                <p className={`mt-1 text-xs ${row.pending > 0 ? 'text-negative' : 'text-positive'}`}>
                  {row.pending > 0 ? `${formatMoney(row.pending)} outstanding` : 'Settled'}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {!editable ? <ViewerNotice /> : null}

      {categories.length > 1 ? (
        <details className="card mb-6 p-5">
          <summary className="cursor-pointer list-none font-display text-base font-semibold">
            Subtotals by category
            <span className="ml-2 text-sm font-normal text-faint">
              ({categories.length} categories)
            </span>
          </summary>
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
        </details>
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
    </>
  );
}
