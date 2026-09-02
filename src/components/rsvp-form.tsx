'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createRsvp } from '@/lib/actions';
import { RSVP_SESSIONS, type RsvpOccasion } from '@/lib/schema';
import { Field, Select } from './form-panel';
import { DateField, TimeField } from './date-time-fields';
import { Modal } from './modal';
import { useToast } from './toast';

/**
 * Opens in a Modal rather than FormPanel's inline disclosure: this button
 * lives in the RSVP page's sticky tab bar, and an inline form expanding there
 * would blow the sticky bar up to full form height mid-scroll.
 */
export function RsvpForm({ today, occasion }: { today: string; occasion: RsvpOccasion }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const toast = useToast();
  const isDaily = occasion === 'Daily Pooja';

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setError(null);

    startTransition(async () => {
      const result = await createRsvp(formData);
      if (result.ok) {
        form.reset();
        setOpen(false);
        toast('RSVP saved.');
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <>
      <button type="button" className="btn-primary shrink-0" onClick={() => setOpen(true)}>
        + RSVP
      </button>

      {open ? (
        <Modal title={`${occasion} RSVP`} onClose={() => setOpen(false)}>
          <form onSubmit={onSubmit}>
            <input type="hidden" name="occasion" value={occasion} />
            <div className="grid gap-4 overflow-x-hidden sm:grid-cols-2">
              <Field label="Name" name="name" required placeholder="Family or attendee name" span />
              <DateField label="Date" name="date" defaultValue={today} />
              {isDaily ? <Select label="Session" name="session" options={RSVP_SESSIONS} defaultValue="Morning" /> : null}
              {isDaily ? <TimeField label="Time" name="time" /> : null}
              <Field label="Adults" name="adults" type="number" defaultValue={1} />
              <Field label="Kids" name="kids" type="number" defaultValue={0} />
              <Field
                label="Prasadam details"
                name="prasadam"
                placeholder="Any prasadam you're signing up to bring"
                span
              />
              <Field label="Notes" name="notes" span />
            </div>

            {error ? (
              <p role="alert" className="mt-4 rounded-xl bg-negative/10 px-3 py-2 text-sm text-negative">
                {error}
              </p>
            ) : null}

            <div className="mt-6 flex gap-2">
              <button type="submit" className="btn-primary" disabled={pending}>
                {pending ? 'Saving…' : 'Save RSVP'}
              </button>
              <button type="button" className="btn-ghost" onClick={() => setOpen(false)} disabled={pending}>
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </>
  );
}
