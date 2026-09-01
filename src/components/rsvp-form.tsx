'use client';

import { createRsvp } from '@/lib/actions';
import type { RsvpOccasion } from '@/lib/schema';
import { FormPanel, Field } from './form-panel';

export function RsvpForm({ today, occasion }: { today: string; occasion: RsvpOccasion }) {
  return (
    <FormPanel
      title={`RSVP — ${occasion}`}
      openLabel={`RSVP for ${occasion}`}
      submitLabel="Save RSVP"
      action={createRsvp}
    >
      <input type="hidden" name="occasion" value={occasion} />
      <Field label="Name" name="name" required placeholder="Family or attendee name" span />
      <Field label="Date" name="date" type="date" required defaultValue={today} />
      <Field label="Adults" name="adults" type="number" defaultValue={1} />
      <Field label="Kids" name="kids" type="number" defaultValue={0} />
      <Field label="Prasadam details" name="prasadam" placeholder="Any prasadam you're signing up to bring" span />
      <Field label="Notes" name="notes" span />
    </FormPanel>
  );
}
