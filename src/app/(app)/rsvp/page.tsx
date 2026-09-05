import { rsvpsForYear } from '@/lib/repository';
import { resolveYear } from '@/lib/year';
import { today } from '@/lib/format';
import { PageHeader, ErrorNotice } from '@/components/ui/primitives';
import { RsvpTabs } from '@/components/rsvp-tabs';
import { currentUser, canEdit, canDelete } from '@/lib/auth';
import { redactRsvp } from '@/lib/redact';

export const dynamic = 'force-dynamic';

export default async function RsvpPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const year = resolveYear((await searchParams).year);
  const role = (await currentUser())?.role ?? 'viewer';
  const editable = canEdit(role);
  const deletable = canDelete(role);

  let rows;
  try {
    rows = (await rsvpsForYear(year)).map((row) => redactRsvp(row, role));
  } catch (error) {
    return <ErrorNotice message={error instanceof Error ? error.message : 'Unknown error.'} />;
  }

  return (
    <>
      <PageHeader title="RSVP" subtitle={`${year} · pooja sign-ups, kids' events and Nimarjan food`} />

      <RsvpTabs rows={rows} editable={editable} deletable={deletable} today={today()} />
    </>
  );
}
