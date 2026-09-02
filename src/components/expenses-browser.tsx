'use client';

import { useMemo, useState } from 'react';
import { formatMoney, formatDate } from '@/lib/format';
import { EmptyState, Badge } from './ui/primitives';
import { ExpenseForm } from './expense-form';
import { SearchBox } from './search-box';
import { ResponsiveRecords, RecordCard, Th, Td } from './record-list';
import { RecordActions } from './record-actions';
import type { Expense } from '@/lib/schema';

/** Client-side search, same rationale as DonationsBrowser: everything is
 *  already loaded, so filtering shouldn't round-trip through the server. */
export function ExpensesBrowser({
  rows,
  editable,
  deletable,
  people,
  receiptCount,
  today,
  year,
}: {
  rows: Expense[];
  editable: boolean;
  deletable: boolean;
  people: string[];
  receiptCount: Map<string, number>;
  today: string;
  year: number;
}) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();

  const sorted = useMemo(() => {
    const filtered = q
      ? rows.filter((row) =>
          [row.description, row.category, row.store, row.paidBy, row.notes]
            .join(' ')
            .toLowerCase()
            .includes(q),
        )
      : rows;
    return [...filtered].sort((a, b) => b.date.localeCompare(a.date));
  }, [rows, q]);

  const shown = sorted.filter((row) => row.settlement !== 'Paid directly').reduce((sum, row) => sum + row.amount, 0);
  const shownDirect = sorted
    .filter((row) => row.settlement === 'Paid directly')
    .reduce((sum, row) => sum + row.amount, 0);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <SearchBox placeholder="Search description, store or payer" value={query} onChange={setQuery} />
        {editable ? <ExpenseForm today={today} people={people} /> : null}
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          title={q ? 'No matches' : `No expenses recorded for ${year}`}
          description={q ? 'Try a different store or category.' : 'Add the first cost of the year, with its receipt.'}
        />
      ) : (
        <ResponsiveRecords
          count={`${sorted.length} ${sorted.length === 1 ? 'entry' : 'entries'}${q ? ' matching' : ''}`}
          total={formatMoney(shown)}
          cards={sorted.map((row) => (
            <RecordCard
              key={row.id}
              title={row.description}
              amount={formatMoney(row.amount)}
              meta={[formatDate(row.date), row.store || null, editable ? `Paid by ${row.paidBy}` : null]
                .filter(Boolean)
                .join(' · ')}
              badges={
                <>
                  <Badge>{row.category}</Badge>
                  <Badge tone={row.settlement === 'Cleared' ? 'positive' : row.settlement === 'Pending' ? 'negative' : 'neutral'}>{settlementLabel(row.settlement)}</Badge>
                  {(receiptCount.get(row.id) ?? 0) > 0 ? (
                    <Badge>
                      {receiptCount.get(row.id)} receipt{receiptCount.get(row.id) === 1 ? '' : 's'}
                    </Badge>
                  ) : null}
                </>
              }
              actions={
                editable || deletable ? (
                  <RecordActions kind="expense" record={row} canEdit={editable} canDelete={deletable} people={people} />
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
                  {editable ? <Th>Paid by</Th> : null}
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
                      {row.notes ? <span className="block text-xs text-faint">{row.notes}</span> : null}
                    </Td>
                    <Td className="whitespace-nowrap text-muted">{row.category}</Td>
                    <Td className="text-muted">{row.store || 'N/A'}</Td>
                    {editable ? <Td className="whitespace-nowrap text-muted">{row.paidBy}</Td> : null}
                    <Td align="right" className="font-medium tabular-nums text-ink">
                      {formatMoney(row.amount)}
                    </Td>
                    <Td>
                      <Badge tone={row.settlement === 'Cleared' ? 'positive' : row.settlement === 'Pending' ? 'negative' : 'neutral'}>{settlementLabel(row.settlement)}</Badge>
                    </Td>
                    <Td align="right" className="tabular-nums text-muted">
                      {receiptCount.get(row.id) ?? 0}
                    </Td>
                    {editable || deletable ? (
                      <Td align="right">
                        <RecordActions kind="expense" record={row} canEdit={editable} canDelete={deletable} people={people} />
                      </Td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-line bg-raised/60">
                  <Td colSpan={editable ? 5 : 4} className="font-medium text-muted">
                    {sorted.length} {sorted.length === 1 ? 'entry' : 'entries'}
                    {q ? ' matching' : ''}
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
          Total excludes {formatMoney(shownDirect)} paid directly by families, which is listed above but never
          passed through the committee fund.
        </p>
      ) : null}
    </>
  );
}

/** "Pending" alone read oddly once the payer's name is hidden from viewers, since
 *  it wasn't clear what was pending. Spelled out, it stands on its own. */
function settlementLabel(settlement: Expense['settlement']): string {
  return settlement === 'Pending' ? 'Pending payment' : settlement;
}
