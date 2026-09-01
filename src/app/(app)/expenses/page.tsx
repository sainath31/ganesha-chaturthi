import { expensesForYear, donationsForYear, totals, reimbursements, byCategory } from '@/lib/repository';
import { receipts as receiptTable } from '@/lib/repository';
import { resolveYear } from '@/lib/year';
import { formatMoney, formatDate, today } from '@/lib/format';
import { ViewerNotice, PageHeader, EmptyState, Badge, ErrorNotice } from '@/components/ui/primitives';
import { ResponsiveRecords, RecordCard, Th, Td } from '@/components/record-list';
import { ExpenseForm } from '@/components/expense-form';
import { SearchBox } from '@/components/search-box';
import { currentUser, canEdit } from '@/lib/auth';
import { RecordActions } from '@/components/record-actions';
import { redactExpense, redactDonation } from '@/lib/redact';

export const dynamic = 'force-dynamic';

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; q?: string }>;
}) {
  const params = await searchParams;
  const year = resolveYear(params.year);
  const query = (params.q ?? '').trim().toLowerCase();
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
  const filtered = query
    ? rows.filter((row) =>
        [row.description, row.category, row.store, row.paidBy, row.notes]
          .join(' ')
          .toLowerCase()
          .includes(query),
      )
    : rows;
  const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date));
  // The footer must agree with the "spent" figure in the header, so costs a
  // family absorbed outright are listed but not summed.
  const shown = sorted
    .filter((row) => row.settlement !== 'Paid directly')
    .reduce((sum, row) => sum + row.amount, 0);
  const shownDirect = sorted
    .filter((row) => row.settlement === 'Paid directly')
    .reduce((sum, row) => sum + row.amount, 0);
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
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
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

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <SearchBox placeholder="Search description, store or payer" />
        {editable ? <ExpenseForm today={today()} people={people} /> : null}
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          title={query ? 'No matches' : `No expenses recorded for ${year}`}
          description={
            query ? 'Try a different store or category.' : 'Add the first cost of the year, with its receipt.'
          }
        />
      ) : (
        <ResponsiveRecords
          count={`${sorted.length} ${sorted.length === 1 ? 'entry' : 'entries'}${query ? ' matching' : ''}`}
          total={formatMoney(shown)}
          cards={sorted.map((row) => (
            <RecordCard
              key={row.id}
              title={row.description}
              amount={formatMoney(row.amount)}
              meta={[formatDate(row.date), row.store || null, `Paid by ${row.paidBy}`]
                .filter(Boolean)
                .join(' · ')}
              badges={
                <>
                  <Badge>{row.category}</Badge>
                  <Badge tone={row.settlement === 'Cleared' ? 'brand' : 'neutral'}>
                    {row.settlement}
                  </Badge>
                  {(receiptCount.get(row.id) ?? 0) > 0 ? (
                    <Badge>{receiptCount.get(row.id)} receipt{receiptCount.get(row.id) === 1 ? '' : 's'}</Badge>
                  ) : null}
                </>
              }
              actions={
                editable || deletable ? (
                  <RecordActions
                    kind="expense"
                    record={row}
                    canEdit={editable}
                    canDelete={deletable}
                    people={people}
                  />
                ) : null
              }
            />
          ))}
          table={
            <>
              <thead>
                <tr className="border-b border-line bg-raised/60">
                  <Th>Date</Th>
                  <Th>Description</Th>
                  <Th>Category</Th>
                  <Th>Store</Th>
                  <Th>Paid by</Th>
                  <Th align="right">Amount</Th>
                  <Th>Settlement</Th>
                  <Th align="right">Receipts</Th>
                  {editable || deletable ? <Th align="right">Actions</Th> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {sorted.map((row) => (
                  <tr key={row.id} className="transition-colors hover:bg-raised/40">
                    <Td className="whitespace-nowrap text-muted">{formatDate(row.date)}</Td>
                    <Td className="font-medium text-ink">
                      {row.description}
                      {row.notes ? (
                        <span className="block text-xs text-faint">{row.notes}</span>
                      ) : null}
                    </Td>
                    <Td className="whitespace-nowrap text-muted">{row.category}</Td>
                    <Td className="text-muted">{row.store || '—'}</Td>
                    <Td className="whitespace-nowrap text-muted">{row.paidBy}</Td>
                    <Td align="right" className="font-medium tabular-nums text-ink">
                      {formatMoney(row.amount)}
                    </Td>
                    <Td>
                      <Badge tone={row.settlement === 'Cleared' ? 'brand' : 'neutral'}>
                        {row.settlement}
                      </Badge>
                    </Td>
                    <Td align="right" className="tabular-nums text-muted">
                      {receiptCount.get(row.id) ?? 0}
                    </Td>
                    {editable || deletable ? (
                      <Td align="right">
                        <RecordActions
                          kind="expense"
                          record={row}
                          canEdit={editable}
                          canDelete={deletable}
                          people={people}
                        />
                      </Td>
                    ) : null}
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
                  <Td colSpan={editable || deletable ? 3 : 2} />
                </tr>
              </tfoot>
            </>
          }
        />
      )}

      {shownDirect > 0 ? (
        <p className="mt-3 text-xs text-muted">
          Total excludes {formatMoney(shownDirect)} paid directly by families, which is listed
          above but never passed through the committee fund.
        </p>
      ) : null}
    </>
  );
}
