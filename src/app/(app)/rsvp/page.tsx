import { rsvpsForYear, rsvpHeadcount } from '@/lib/repository';
import { resolveYear } from '@/lib/year';
import { formatDate, today } from '@/lib/format';
import { PageHeader, EmptyState, Badge, StatTile } from '@/components/ui/primitives';
import { ErrorNotice } from '@/components/ui/primitives';
import { RsvpForm } from '@/components/rsvp-form';
import { ResponsiveRecords, RecordCard, Th, Td } from '@/components/record-list';
import { currentUser, canEdit } from '@/lib/auth';
import { RecordActions } from '@/components/record-actions';
import { redactRsvp } from '@/lib/redact';
import { RSVP_OCCASIONS, type Rsvp } from '@/lib/schema';

export const dynamic = 'force-dynamic';

export default async function RsvpPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const year = resolveYear((await searchParams).year);
  const role = (await currentUser())?.role ?? 'viewer';
  const editable = canEdit(role);
  const deletable = role === 'admin';

  let rows;
  try {
    rows = (await rsvpsForYear(year)).map((row) => redactRsvp(row, role));
  } catch (error) {
    return <ErrorNotice message={error instanceof Error ? error.message : 'Unknown error.'} />;
  }

  return (
    <>
      <PageHeader title="Pooja RSVP" subtitle={`${year} · two separate sign-ups — pick the one you're attending`} />

      <div className="space-y-10">
        {RSVP_OCCASIONS.map((occasion) => (
          <OccasionSection
            key={occasion}
            occasion={occasion}
            rows={rows.filter((row) => row.occasion === occasion)}
            editable={editable}
            deletable={deletable}
          />
        ))}
      </div>
    </>
  );
}

function OccasionSection({
  occasion,
  rows,
  editable,
  deletable,
}: {
  occasion: (typeof RSVP_OCCASIONS)[number];
  rows: Rsvp[];
  editable: boolean;
  deletable: boolean;
}) {
  const sorted = [...rows].sort((a, b) => b.date.localeCompare(a.date));
  const headcount = rsvpHeadcount(rows);

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight">{occasion}</h2>
          <p className="mt-1 text-sm text-muted">
            {occasion === 'First Day Pooja'
              ? 'The big first-day sit-down — one RSVP per family.'
              : "Day-by-day RSVPs for the rest of the festival — attendance and prasadam per day."}
          </p>
        </div>
        <RsvpForm today={today()} occasion={occasion} />
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:max-w-md">
        <StatTile label="Adults" value={String(headcount.adults)} />
        <StatTile label="Kids" value={String(headcount.kids)} />
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          title={`No RSVPs yet for ${occasion}`}
          description="Anyone can add one here — no sign-in needed."
        />
      ) : (
        <ResponsiveRecords
          count={`${sorted.length} ${sorted.length === 1 ? 'entry' : 'entries'}`}
          total={`${headcount.adults} adults + ${headcount.kids} kids`}
          cards={sorted.map((row) => (
            <RecordCard
              key={row.id}
              title={row.name}
              amount={`${row.adults + row.kids}`}
              meta={[formatDate(row.date), row.prasadam || null].filter(Boolean).join(' · ')}
              badges={
                <>
                  <Badge>{row.adults} adults</Badge>
                  <Badge>{row.kids} kids</Badge>
                </>
              }
              actions={
                editable || deletable ? (
                  <RecordActions kind="rsvp" record={row} canEdit={editable} canDelete={deletable} />
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
                  <Th align="right">Adults</Th>
                  <Th align="right">Kids</Th>
                  <Th>Prasadam</Th>
                  {editable || deletable ? <Th align="right">Actions</Th> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {sorted.map((row) => (
                  <tr key={row.id} className="transition-colors hover:bg-raised/40">
                    <Td className="whitespace-nowrap text-muted">{formatDate(row.date)}</Td>
                    <Td className="font-medium text-ink">
                      {row.name}
                      {row.notes ? <span className="block text-xs text-faint">{row.notes}</span> : null}
                    </Td>
                    <Td align="right" className="tabular-nums text-ink">{row.adults}</Td>
                    <Td align="right" className="tabular-nums text-ink">{row.kids}</Td>
                    <Td className="text-muted">{row.prasadam || '—'}</Td>
                    {editable || deletable ? (
                      <Td align="right">
                        <RecordActions kind="rsvp" record={row} canEdit={editable} canDelete={deletable} />
                      </Td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-line bg-raised/60">
                  <Td colSpan={2} className="font-medium text-muted">
                    {sorted.length} {sorted.length === 1 ? 'entry' : 'entries'}
                  </Td>
                  <Td align="right" className="font-display font-semibold tabular-nums">
                    {headcount.adults}
                  </Td>
                  <Td align="right" className="font-display font-semibold tabular-nums">
                    {headcount.kids}
                  </Td>
                  <Td colSpan={editable || deletable ? 2 : 1} />
                </tr>
              </tfoot>
            </>
          }
        />
      )}
    </section>
  );
}
