import { donationsForYear, totals } from '@/lib/repository';
import { resolveYear } from '@/lib/year';
import { formatMoney, formatDate, today } from '@/lib/format';
import { PageHeader, EmptyState, Badge, ErrorNotice } from '@/components/ui/primitives';
import { DonationForm } from '@/components/donation-form';
import { SearchBox } from '@/components/search-box';
import { Table, Th, Td } from '@/components/ui/table';

export const dynamic = 'force-dynamic';

export default async function DonationsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; q?: string }>;
}) {
  const params = await searchParams;
  const year = resolveYear(params.year);
  const query = (params.q ?? '').trim().toLowerCase();

  let rows;
  try {
    rows = await donationsForYear(year);
  } catch (error) {
    return <ErrorNotice message={error instanceof Error ? error.message : 'Unknown error.'} />;
  }

  const lanes = [...new Set(rows.map((row) => row.lane).filter(Boolean))].sort();
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

  return (
    <>
      <PageHeader
        title="Donations"
        subtitle={`${year} · ${formatMoney(summary.collected)} collected from ${summary.donorCount} families`}
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <SearchBox placeholder="Search name, lane or collector" />
        <DonationForm today={today()} lanes={lanes} />
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
        <Table>
              <thead>
                <tr className="border-b border-line bg-raised/60 text-left">
                  <Th>Receipt</Th>
                  <Th>Date</Th>
                  <Th>Name</Th>
                  <Th>Lane</Th>
                  <Th>Method</Th>
                  <Th align="right">Amount</Th>
                  <Th>Status</Th>
                  <Th>Food</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {sorted.map((row) => (
                  <tr key={row.id} className="transition-colors hover:bg-raised/40">
                    <Td className="font-mono text-xs text-faint">{row.receiptNo || '—'}</Td>
                    <Td className="whitespace-nowrap text-muted">{formatDate(row.date)}</Td>
                    <Td className="font-medium text-ink">{row.name}</Td>
                    <Td className="text-muted">{row.lane || '—'}</Td>
                    <Td className="text-muted">
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
