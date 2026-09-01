import { donationsForYear, totals } from '@/lib/repository';
import { resolveYear } from '@/lib/year';
import { formatMoney, formatDate, today } from '@/lib/format';
import { ViewerNotice, PageHeader, EmptyState, Badge, ErrorNotice } from '@/components/ui/primitives';
import { DonationForm } from '@/components/donation-form';
import { SearchBox } from '@/components/search-box';
import { ResponsiveRecords, RecordCard, Th, Td } from '@/components/record-list';
import { currentUser, canEdit } from '@/lib/auth';
import { RecordActions } from '@/components/record-actions';
import { redactDonation } from '@/lib/redact';

export const dynamic = 'force-dynamic';

export default async function DonationsPage({
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

  let rows;
  try {
    rows = (await donationsForYear(year)).map((row) => redactDonation(row, role));
  } catch (error) {
    return <ErrorNotice message={error instanceof Error ? error.message : 'Unknown error.'} />;
  }

  const lanes = editable
    ? [...new Set(rows.map((row) => row.lane).filter(Boolean))].sort()
    : [];
  const filtered = query
    ? rows.filter((row) =>
        [row.name, row.lane, row.collectedBy, row.notes, row.receiptNo]
          .join(' ')
          .toLowerCase()
          .includes(query),
      )
    : rows;
  const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date));
  const shown = sorted.reduce((sum, row) => sum + row.amount, 0);
  const summary = totals(rows, []);

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
        ]
          .filter(Boolean)
          .join(' · ')}
      />

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

      {!editable ? <ViewerNotice /> : null}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <SearchBox placeholder="Search name, lane or collector" />
        {editable ? <DonationForm today={today()} lanes={lanes} /> : null}
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          title={query ? 'No matches' : `No donations recorded for ${year}`}
          description={
            query
              ? 'Try a different name or lane.'
              : 'Add the first contribution of the year to get started.'
          }
        />
      ) : (
        <ResponsiveRecords
          count={`${sorted.length} ${sorted.length === 1 ? 'entry' : 'entries'}${query ? ' matching' : ''}`}
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
                  {row.votedForFood !== 'No response' ? (
                    <Badge>Food: {row.votedForFood}</Badge>
                  ) : null}
                </>
              }
              actions={
                editable || deletable ? (
                  <RecordActions
                    kind="donation"
                    record={row}
                    canEdit={editable}
                    canDelete={deletable}
                    lanes={lanes}
                  />
                ) : null
              }
            />
          ))}
          table={
            <>
              <thead>
                <tr className="border-b border-line bg-raised/60">
                  <Th>Receipt</Th>
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
                    <Td className="whitespace-nowrap font-mono text-xs text-faint">
                      {row.receiptNo || '—'}
                    </Td>
                    <Td className="whitespace-nowrap text-muted">{formatDate(row.date)}</Td>
                    <Td className="font-medium text-ink">{row.name}</Td>
                    {editable ? <Td className="text-muted">{row.lane || '—'}</Td> : null}
                    <Td className="whitespace-nowrap text-muted">
                      {row.method}
                      {row.collectedBy ? (
                        <span className="text-faint"> → {row.collectedBy}</span>
                      ) : null}
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
                        <RecordActions
                          kind="donation"
                          record={row}
                          canEdit={editable}
                          canDelete={deletable}
                          lanes={lanes}
                        />
                      </Td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-line bg-raised/60">
                  <Td colSpan={editable ? 4 : 3} className="font-medium text-muted">
                    {sorted.length} {sorted.length === 1 ? 'entry' : 'entries'}
                    {query ? ' matching' : ''}
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
