'use client';

import { useMemo, useState } from 'react';
import { formatMoney, formatDate } from '@/lib/format';
import { EmptyState, Badge } from './ui/primitives';
import { DonationForm } from './donation-form';
import { SearchBox } from './search-box';
import { ResponsiveRecords, RecordCard, Th, Td } from './record-list';
import { RecordActions } from './record-actions';
import type { Donation } from '@/lib/schema';

/**
 * All rows for the year are already on the page, so search filters them
 * entirely client-side rather than round-tripping through the server on
 * every keystroke — the previous URL-param-driven search remounted the list
 * (and dropped input focus) on each character.
 */
export function DonationsBrowser({
  rows,
  editable,
  deletable,
  lanes,
  today,
  year,
}: {
  rows: Donation[];
  editable: boolean;
  deletable: boolean;
  lanes: string[];
  today: string;
  year: number;
}) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();

  const sorted = useMemo(() => {
    const filtered = q
      ? rows.filter((row) =>
          [row.name, row.lane, row.collectedBy, row.notes, row.receiptNo]
            .join(' ')
            .toLowerCase()
            .includes(q),
        )
      : rows;
    return [...filtered].sort((a, b) => b.date.localeCompare(a.date));
  }, [rows, q]);

  const shown = sorted.reduce((sum, row) => sum + row.amount, 0);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <SearchBox placeholder="Search name, lane or collector" value={query} onChange={setQuery} />
        {editable ? <DonationForm today={today} lanes={lanes} /> : null}
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          title={q ? 'No matches' : `No donations recorded for ${year}`}
          description={q ? 'Try a different name or lane.' : 'Add the first contribution of the year to get started.'}
        />
      ) : (
        <ResponsiveRecords
          count={`${sorted.length} ${sorted.length === 1 ? 'entry' : 'entries'}${q ? ' matching' : ''}`}
          total={formatMoney(shown)}
          cards={sorted.map((row) => (
            <RecordCard
              key={row.id}
              title={row.name}
              amount={formatMoney(row.amount)}
              meta={[formatDate(row.date), editable && row.lane ? row.lane : null, row.method]
                .filter(Boolean)
                .join(' · ')}
              badges={
                <>
                  <Badge tone={row.status === 'Paid' ? 'brand' : 'neutral'}>{row.status}</Badge>
                  {row.votedForFood !== 'No response' ? <Badge>Food: {row.votedForFood}</Badge> : null}
                  {row.foodAdults + row.foodKids > 0 ? (
                    <Badge>
                      {row.foodAdults}A + {row.foodKids}K for food
                    </Badge>
                  ) : null}
                </>
              }
              actions={
                editable || deletable ? (
                  <RecordActions kind="donation" record={row} canEdit={editable} canDelete={deletable} lanes={lanes} />
                ) : null
              }
            />
          ))}
          table={
            <>
              <thead>
                <tr className="border-b border-line bg-raised/60">
                  <Th>Date</Th>
                  <Th>Name</Th>
                  {editable ? <Th>Lane</Th> : null}
                  <Th>Method</Th>
                  <Th align="right">Amount</Th>
                  <Th>Status</Th>
                  <Th>Food</Th>
                  {editable || deletable ? <Th align="right">Actions</Th> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {sorted.map((row) => (
                  <tr key={row.id} className="transition-colors hover:bg-raised/40">
                    <Td className="whitespace-nowrap text-muted">{formatDate(row.date)}</Td>
                    <Td className="font-medium text-ink">{row.name}</Td>
                    {editable ? <Td className="text-muted">{row.lane || 'N/A'}</Td> : null}
                    <Td className="whitespace-nowrap text-muted">
                      {row.method}
                      {row.collectedBy ? <span className="text-faint"> → {row.collectedBy}</span> : null}
                    </Td>
                    <Td align="right" className="font-medium tabular-nums text-ink">
                      {formatMoney(row.amount)}
                    </Td>
                    <Td>
                      <Badge tone={row.status === 'Paid' ? 'brand' : 'neutral'}>{row.status}</Badge>
                    </Td>
                    <Td className="text-muted">{row.votedForFood}</Td>
                    {editable || deletable ? (
                      <Td align="right">
                        <RecordActions kind="donation" record={row} canEdit={editable} canDelete={deletable} lanes={lanes} />
                      </Td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-line bg-raised/60">
                  <Td colSpan={editable ? 3 : 2} className="font-medium text-muted">
                    {sorted.length} {sorted.length === 1 ? 'entry' : 'entries'}
                    {q ? ' matching' : ''}
                  </Td>
                  <Td />
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
    </>
  );
}
