'use client';

import { useState } from 'react';
import { formatDate } from '@/lib/format';
import { EmptyState, Badge, StatTile } from './ui/primitives';
import { RsvpForm } from './rsvp-form';
import { ResponsiveRecords, RecordCard, Th, Td } from './record-list';
import { RecordActions } from './record-actions';
import { RSVP_OCCASIONS, type Rsvp, type RsvpOccasion } from '@/lib/schema';

/** Client-safe mirror of repository.ts's rsvpHeadcount — that module also
 *  pulls in the server-only Google API client, which can't be bundled here. */
function rsvpHeadcount(rows: Rsvp[]) {
  return rows.reduce(
    (acc, row) => ({ adults: acc.adults + row.adults, kids: acc.kids + row.kids }),
    { adults: 0, kids: 0 },
  );
}

/**
 * A segmented tab switcher rather than two stacked sections: as RSVPs pile
 * up, a "stacked sections" layout pushes the second occasion's own list (and
 * its add button) further and further down the page, off-screen until
 * scrolled to. Tabs keep exactly one occasion — and its add button — on
 * screen at all times, pinned under the site header while scrolling.
 */
export function RsvpTabs({
  firstDayRows,
  dailyRows,
  editable,
  deletable,
  today,
}: {
  firstDayRows: Rsvp[];
  dailyRows: Rsvp[];
  editable: boolean;
  deletable: boolean;
  today: string;
}) {
  const [active, setActive] = useState<RsvpOccasion>('First Day Pooja');
  const rowsByOccasion: Record<RsvpOccasion, Rsvp[]> = {
    'First Day Pooja': firstDayRows,
    'Daily Pooja': dailyRows,
  };

  return (
    <>
      <div className="sticky top-14 z-20 -mx-4 mb-6 border-b border-line bg-bg/95 px-4 py-3 backdrop-blur-md sm:-mx-0 sm:rounded-xl sm:border sm:px-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1 rounded-lg bg-raised p-1">
            {RSVP_OCCASIONS.map((occasion) => (
              <button
                key={occasion}
                type="button"
                onClick={() => setActive(occasion)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  active === occasion ? 'bg-surface text-brand shadow-sm' : 'text-muted hover:text-ink'
                }`}
              >
                {occasion}
                <span className="ml-1.5 text-xs text-faint">({rowsByOccasion[occasion].length})</span>
              </button>
            ))}
          </div>
          <RsvpForm today={today} occasion={active} />
        </div>
      </div>

      <OccasionContent occasion={active} rows={rowsByOccasion[active]} editable={editable} deletable={deletable} />
    </>
  );
}

function OccasionContent({
  occasion,
  rows,
  editable,
  deletable,
}: {
  occasion: RsvpOccasion;
  rows: Rsvp[];
  editable: boolean;
  deletable: boolean;
}) {
  const sorted = [...rows].sort((a, b) => b.date.localeCompare(a.date));
  const headcount = rsvpHeadcount(rows);
  const isDaily = occasion === 'Daily Pooja';
  const sessionLabel = (row: Rsvp) => [row.session, row.time].filter(Boolean).join(' · ') || null;

  return (
    <section>
      <p className="mb-4 text-sm text-muted">
        {occasion === 'First Day Pooja'
          ? 'The big first-day sit-down, one RSVP per family.'
          : 'Day-by-day RSVPs for the rest of the festival, attendance and prasadam per day.'}
      </p>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:max-w-md">
        <StatTile label="Adults" value={String(headcount.adults)} />
        <StatTile label="Kids" value={String(headcount.kids)} />
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          title={`No RSVPs yet for ${occasion}`}
          description="Anyone can add one here, no sign-in needed."
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
              meta={[formatDate(row.date), isDaily ? sessionLabel(row) : null, row.prasadam || null]
                .filter(Boolean)
                .join(' · ')}
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
                  {isDaily ? <Th>Session</Th> : null}
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
                    {isDaily ? <Td className="whitespace-nowrap text-muted">{sessionLabel(row) ?? 'N/A'}</Td> : null}
                    <Td align="right" className="tabular-nums text-ink">{row.adults}</Td>
                    <Td align="right" className="tabular-nums text-ink">{row.kids}</Td>
                    <Td className="text-muted">{row.prasadam || 'N/A'}</Td>
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
                  <Td colSpan={isDaily ? 3 : 2} className="font-medium text-muted">
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
