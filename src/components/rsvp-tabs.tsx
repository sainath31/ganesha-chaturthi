'use client';

import { useState } from 'react';
import { formatDate } from '@/lib/format';
import { EmptyState, Badge, StatTile } from './ui/primitives';
import { RsvpForm } from './rsvp-form';
import { ResponsiveRecords, RecordCard, Th, Td } from './record-list';
import { RecordActions } from './record-actions';
import { RSVP_OCCASIONS, type Rsvp, type RsvpOccasion } from '@/lib/schema';
import { EVENT_DATE_LABEL } from './date-time-fields';

/** Client-safe mirror of repository.ts's rsvpHeadcount — that module also
 *  pulls in the server-only Google API client, which can't be bundled here. */
function rsvpHeadcount(rows: Rsvp[]) {
  return rows.reduce(
    (acc, row) => ({ adults: acc.adults + row.adults, kids: acc.kids + row.kids }),
    { adults: 0, kids: 0 },
  );
}

/** Short label for the tab strip on phones, where four full occasion names
 *  would never fit on one line — kept on one line rather than wrapping, so
 *  the "+ RSVP" button never gets pushed off-screen. */
const TAB_LABEL: Record<RsvpOccasion, { short: string; long: string }> = {
  'First Day Pooja': { short: 'First Day', long: 'First Day Pooja' },
  'Daily Pooja': { short: 'Daily', long: 'Daily Pooja' },
  // The tab is "Events" generically — the specific event (Ganesha Idol
  // Making today) is introduced inside the tab, so a second event later
  // slots in without renaming the tab itself.
  'Ganesha Idol Making': { short: 'Events', long: 'Events' },
  'Nimarjan Food': { short: 'Nimarjan Food', long: 'Nimarjan Food' },
};

/**
 * A segmented tab switcher rather than four stacked sections: as RSVPs pile
 * up, a "stacked sections" layout pushes each later occasion's own list (and
 * its add button) further and further down the page, off-screen until
 * scrolled to. Tabs keep exactly one occasion — and its add button — on
 * screen at all times, pinned under the site header while scrolling.
 */
export function RsvpTabs({
  rows,
  editable,
  deletable,
  today,
}: {
  rows: Rsvp[];
  editable: boolean;
  deletable: boolean;
  today: string;
}) {
  const [active, setActive] = useState<RsvpOccasion>('First Day Pooja');
  const rowsByOccasion = RSVP_OCCASIONS.reduce(
    (map, occasion) => map.set(occasion, rows.filter((row) => row.occasion === occasion)),
    new Map<RsvpOccasion, Rsvp[]>(),
  );

  return (
    <>
      <div className="sticky top-14 z-20 -mx-4 mb-6 border-b border-line bg-bg/95 px-4 py-3 backdrop-blur-md sm:-mx-0 sm:rounded-xl sm:border sm:px-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-nowrap sm:items-center sm:justify-between">
          <div className="flex min-w-0 gap-1 overflow-x-auto rounded-lg bg-raised p-1">
            {RSVP_OCCASIONS.map((occasion) => (
              <button
                key={occasion}
                type="button"
                onClick={() => setActive(occasion)}
                className={`shrink-0 whitespace-nowrap rounded-md px-2 py-1.5 text-xs font-medium transition-colors sm:px-3 sm:text-sm ${
                  active === occasion ? 'bg-surface text-brand shadow-sm' : 'text-muted hover:text-ink'
                }`}
              >
                <span className="sm:hidden">{TAB_LABEL[occasion].short}</span>
                <span className="hidden sm:inline">{TAB_LABEL[occasion].long}</span>
                <span className="ml-1 text-faint sm:ml-1.5">({(rowsByOccasion.get(occasion) ?? []).length})</span>
              </button>
            ))}
          </div>
          <RsvpForm today={today} occasion={active} />
        </div>
      </div>

      <OccasionContent
        occasion={active}
        rows={rowsByOccasion.get(active) ?? []}
        editable={editable}
        deletable={deletable}
      />
    </>
  );
}

const OCCASION_BLURB: Record<RsvpOccasion, string> = {
  'First Day Pooja': 'The big first-day sit-down, one RSVP per family.',
  'Daily Pooja': 'Please register your family for your preferred morning/evening slot to lead/offer Pooja and bring prasadam to Bappa.',
  'Ganesha Idol Making': "A kids' craft session: register how many kids (and accompanying adults) are coming.",
  'Nimarjan Food': 'Headcount for food on Nimarjan (immersion) day, just adults and kids.',
};

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
  const guestHeadcount = rows.reduce(
    (acc, row) => ({ adults: acc.adults + row.guestAdults, kids: acc.kids + row.guestKids }),
    { adults: 0, kids: 0 },
  );
  const isDaily = occasion === 'Daily Pooja';
  const isEvent = occasion === 'Ganesha Idol Making';
  const isFoodDay = occasion === 'Nimarjan Food';
  const showPrasadam = occasion === 'First Day Pooja' || occasion === 'Daily Pooja';
  const adultsLabel = isEvent ? 'Accompanying adults' : isFoodDay ? 'Family adults' : 'Adults';
  const kidsLabel = isEvent ? 'Kids attending' : isFoodDay ? 'Family children' : 'Kids';
  const sessionLabel = (row: Rsvp) => [row.session, row.time].filter(Boolean).join(' · ') || null;
  const extraColumns = (showPrasadam ? 1 : 0) + (editable || deletable ? 1 : 0);

  return (
    <section>
      {isEvent ? <EventIntro /> : null}

      <p className="mb-4 text-sm text-muted">{OCCASION_BLURB[occasion]}</p>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:max-w-md">
        <StatTile label={adultsLabel} value={String(headcount.adults)} />
        <StatTile label={kidsLabel} value={String(headcount.kids)} />
        {isFoodDay ? (
          <>
            <StatTile label="Guest adults" value={String(guestHeadcount.adults)} />
            <StatTile label="Guest children" value={String(guestHeadcount.kids)} />
          </>
        ) : null}
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          title={`No sign-ups yet for ${TAB_LABEL[occasion].long}`}
          description="Anyone can add one here, no sign-in needed."
        />
      ) : (
        <ResponsiveRecords
          count={`${sorted.length} ${sorted.length === 1 ? 'entry' : 'entries'}`}
          total={
            isFoodDay
              ? `${headcount.adults + guestHeadcount.adults} adults + ${headcount.kids + guestHeadcount.kids} kids`
              : `${headcount.adults} adults + ${headcount.kids} kids`
          }
          cards={sorted.map((row) => (
            <RecordCard
              key={row.id}
              title={row.name}
              amount={`${row.adults + row.kids + row.guestAdults + row.guestKids}`}
              meta={[formatDate(row.date), isDaily ? sessionLabel(row) : null, showPrasadam ? row.prasadam || null : null]
                .filter(Boolean)
                .join(' · ')}
              badges={
                <>
                  <Badge>{row.adults} adults</Badge>
                  <Badge>{row.kids} kids</Badge>
                  {isFoodDay && (row.guestAdults > 0 || row.guestKids > 0) ? (
                    <Badge>
                      +{row.guestAdults} guest adults, {row.guestKids} guest kids
                    </Badge>
                  ) : null}
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
                  <Th align="right">{adultsLabel}</Th>
                  <Th align="right">{kidsLabel}</Th>
                  {isFoodDay ? <Th align="right">Guest adults</Th> : null}
                  {isFoodDay ? <Th align="right">Guest children</Th> : null}
                  {showPrasadam ? <Th>Prasadam</Th> : null}
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
                    {isFoodDay ? <Td align="right" className="tabular-nums text-muted">{row.guestAdults}</Td> : null}
                    {isFoodDay ? <Td align="right" className="tabular-nums text-muted">{row.guestKids}</Td> : null}
                    {showPrasadam ? <Td className="text-muted">{row.prasadam || 'N/A'}</Td> : null}
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
                  {isFoodDay ? (
                    <Td align="right" className="font-display font-semibold tabular-nums">
                      {guestHeadcount.adults}
                    </Td>
                  ) : null}
                  {isFoodDay ? (
                    <Td align="right" className="font-display font-semibold tabular-nums">
                      {guestHeadcount.kids}
                    </Td>
                  ) : null}
                  <Td colSpan={extraColumns} />
                </tr>
              </tfoot>
            </>
          }
        />
      )}
    </section>
  );
}

/** Introduces the Ganesha Idol Making event: the video sets the scene, and
 *  the safety note sits right where a parent is about to sign their kids up. */
function EventIntro() {
  return (
    <div className="card mb-5 overflow-hidden p-0">
      <div className="relative aspect-[21/9] w-full bg-raised">
        <video
          src="/ganesha-clay-making.mp4"
          aria-label="Kids making a Ganesha idol using clay"
          className="h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          controls
        />
      </div>
      <div className="p-4 sm:p-5">
        <h2 className="font-display text-lg font-semibold text-ink">Ganesha Idol Making (Clay)</h2>
        <p className="mt-1 text-sm font-medium text-brand">{EVENT_DATE_LABEL}</p>
        <p className="mt-1 text-sm text-muted">
          Kids get hands-on with clay to shape their own small Ganesha idol.
        </p>
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-brand/20 bg-brand/5 p-3">
          <span aria-hidden className="text-base leading-none">⚠️</span>
          <p className="text-xs text-muted sm:text-sm">
            Kids must be accompanied by an adult for the full session.
          </p>
        </div>
      </div>
    </div>
  );
}
