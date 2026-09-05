'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from './modal';
import { Field, Select } from './form-panel';
import {
  DateField,
  TimeField,
  FESTIVAL_START_DATE,
  FESTIVAL_END_DATE,
  DAILY_POOJA_START_DATE,
  EVENT_DATE,
  EVENT_TIME,
  EVENT_DATE_LABEL,
} from './date-time-fields';
import { useToast } from './toast';
import { ReceiptInput } from './receipt-input';
import {
  updateDonation,
  deleteDonation,
  updateExpense,
  deleteExpense,
  updateRsvp,
  deleteRsvp,
  type ActionResult,
} from '@/lib/actions';
import {
  PAYMENT_METHODS,
  DONATION_STATUSES,
  EXPENSE_CATEGORIES,
  SETTLEMENT_STATUSES,
  RSVP_OCCASIONS,
  RSVP_SESSIONS,
  type Donation,
  type Expense,
  type Rsvp,
} from '@/lib/schema';

type Props =
  | { kind: 'donation'; record: Donation; canEdit: boolean; canDelete: boolean; lanes: string[] }
  | { kind: 'expense'; record: Expense; canEdit: boolean; canDelete: boolean; people: string[] }
  | { kind: 'rsvp'; record: Rsvp; canEdit: boolean; canDelete: boolean };

export function RecordActions(props: Props) {
  const { kind, record, canEdit, canDelete } = props;
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const toast = useToast();

  if (!canEdit && !canDelete) return null;

  const label =
    kind === 'donation'
      ? (record as Donation).name
      : kind === 'rsvp'
        ? (record as Rsvp).name
        : (record as Expense).description;

  function run(action: () => Promise<ActionResult>, successMessage: string, onDone: () => void) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        onDone();
        toast(successMessage);
        router.refresh();
      } else {
        setError(result.error);
        toast(result.error, 'error');
      }
    });
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    run(
      () => {
        if (kind === 'donation') return updateDonation(record.id, formData);
        if (kind === 'rsvp') return updateRsvp(record.id, formData);
        return updateExpense(record.id, formData);
      },
      'Changes saved.',
      () => setEditing(false),
    );
  }

  return (
    <>
      <div className="flex items-center justify-end gap-1">
        {canEdit ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-lg px-2 py-1 text-xs font-medium text-muted transition-colors hover:bg-raised hover:text-ink"
          >
            Edit
          </button>
        ) : null}
        {canDelete ? (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="rounded-lg px-2 py-1 text-xs font-medium text-muted transition-colors hover:bg-negative/10 hover:text-negative"
          >
            Delete
          </button>
        ) : null}
      </div>

      {editing ? (
        <Modal
          title={kind === 'donation' ? 'Edit donation' : kind === 'rsvp' ? 'Edit RSVP' : 'Edit expense'}
          onClose={() => setEditing(false)}
        >
          <form onSubmit={onSubmit}>
            <div className="grid gap-4 overflow-x-hidden sm:grid-cols-2">
              {props.kind === 'donation' ? (
                <DonationFields record={props.record} lanes={props.lanes} />
              ) : props.kind === 'rsvp' ? (
                <RsvpFields record={props.record} />
              ) : (
                <ExpenseFields record={props.record} people={props.people} />
              )}
            </div>

            {error ? (
              <p role="alert" className="mt-4 rounded-xl bg-negative/10 px-3 py-2 text-sm text-negative">
                {error}
              </p>
            ) : null}

            <div className="mt-6 flex gap-2">
              <button type="submit" className="btn-primary" disabled={pending}>
                {pending ? 'Saving…' : 'Save changes'}
              </button>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setEditing(false)}
                disabled={pending}
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {confirming ? (
        <Modal title="Delete this record?" onClose={() => setConfirming(false)}>
          <p className="text-sm text-muted">
            <span className="font-medium text-ink">{label}</span> will be removed from the sheet.
            {kind === 'expense' ? ' Its receipts stay in Drive.' : ''} This cannot be undone from
            here.
          </p>

          {error ? (
            <p role="alert" className="mt-4 rounded-xl bg-negative/10 px-3 py-2 text-sm text-negative">
              {error}
            </p>
          ) : null}

          <div className="mt-6 flex gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                run(
                  () => {
                    if (kind === 'donation') return deleteDonation(record.id);
                    if (kind === 'rsvp') return deleteRsvp(record.id);
                    return deleteExpense(record.id);
                  },
                  'Record deleted.',
                  () => setConfirming(false),
                )
              }
              className="btn bg-negative text-white hover:bg-negative/90"
            >
              {pending ? 'Deleting…' : 'Delete'}
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setConfirming(false)}
              disabled={pending}
            >
              Cancel
            </button>
          </div>
        </Modal>
      ) : null}
    </>
  );
}

function DonationFields({ record, lanes }: { record: Donation; lanes: string[] }) {
  return (
    <>
      <Field label="Name" name="name" required defaultValue={record.name} span />
      <DateField label="Date" name="date" defaultValue={record.date} />
      <Field
        label="Amount"
        name="amount"
        type="number"
        step="0.01"
        required
        defaultValue={record.amount}
      />
      <div className="min-w-0">
        <label className="label" htmlFor={`lane-${record.id}`}>
          Lane
        </label>
        <input
          id={`lane-${record.id}`}
          name="lane"
          list="lanes-edit"
          defaultValue={record.lane}
          className="field min-w-0"
        />
        <datalist id="lanes-edit">
          {lanes.map((lane) => (
            <option key={lane} value={lane} />
          ))}
        </datalist>
      </div>
      <Select label="Method" name="method" options={PAYMENT_METHODS} defaultValue={record.method} />
      <Field label="Collected by" name="collectedBy" defaultValue={record.collectedBy} />
      <Select label="Status" name="status" options={DONATION_STATUSES} defaultValue={record.status} />
      <Field label="Notes" name="notes" defaultValue={record.notes} span />
    </>
  );
}

function ExpenseFields({ record, people }: { record: Expense; people: string[] }) {
  return (
    <>
      <Field label="Description" name="description" required defaultValue={record.description} span />
      <DateField label="Date" name="date" defaultValue={record.date} />
      <Field
        label="Amount"
        name="amount"
        type="number"
        step="0.01"
        required
        defaultValue={record.amount}
      />
      <Select
        label="Category"
        name="category"
        options={EXPENSE_CATEGORIES}
        defaultValue={record.category}
      />
      <Field label="Store" name="store" defaultValue={record.store} />
      <div className="min-w-0">
        <label className="label" htmlFor={`paidBy-${record.id}`}>
          Paid by
        </label>
        <input
          id={`paidBy-${record.id}`}
          name="paidBy"
          list="people-edit"
          required
          defaultValue={record.paidBy}
          className="field min-w-0"
        />
        <datalist id="people-edit">
          {people.map((person) => (
            <option key={person} value={person} />
          ))}
        </datalist>
      </div>
      <Select
        label="Settlement"
        name="settlement"
        options={SETTLEMENT_STATUSES}
        defaultValue={record.settlement}
      />
      <Field label="Notes" name="notes" defaultValue={record.notes} span />
      <div className="sm:col-span-2">
        <span className="label">Add more receipts</span>
        <ReceiptInput name="receipts" />
      </div>
    </>
  );
}

const FESTIVAL_YEAR = Number(FESTIVAL_START_DATE.slice(0, 4));

function RsvpFields({ record }: { record: Rsvp }) {
  const [occasion, setOccasion] = useState(record.occasion);
  const isDaily = occasion === 'Daily Pooja';
  const isEvent = occasion === 'Ganesha Idol Making';
  const isFoodDay = occasion === 'Nimarjan Food';
  const showPrasadam = occasion === 'First Day Pooja' || isDaily;
  const [session, setSession] = useState<(typeof RSVP_SESSIONS)[number]>(
    (record.session as (typeof RSVP_SESSIONS)[number]) || 'Morning',
  );
  const [date, setDate] = useState(record.date);
  // Clamping the date to this year's festival window only makes sense while
  // editing a record already in that year — otherwise it silently rewrites a
  // past year's RSVP onto today's dates. Ganesha Idol Making has no fixed
  // date at all, so it's never clamped.
  const inCurrentFestivalYear = record.year === FESTIVAL_YEAR;
  // The last day closes before evening — nothing is scheduled that night.
  const sessionsAllowed = date === FESTIVAL_END_DATE ? RSVP_SESSIONS.filter((s) => s === 'Morning') : RSVP_SESSIONS;

  if (isDaily && date === FESTIVAL_END_DATE && session !== 'Morning') {
    setSession('Morning');
  }

  const clamped = !isEvent && inCurrentFestivalYear;
  const minDate = clamped ? (isDaily ? DAILY_POOJA_START_DATE : isFoodDay ? FESTIVAL_END_DATE : FESTIVAL_START_DATE) : undefined;
  const maxDate = clamped ? (isDaily ? FESTIVAL_END_DATE : isFoodDay ? FESTIVAL_END_DATE : FESTIVAL_START_DATE) : undefined;

  const adultsLabel = isEvent ? 'Accompanying adults' : isFoodDay ? 'Family adults' : 'Adults';
  const kidsLabel = isEvent ? 'Kids attending' : isFoodDay ? 'Family children' : 'Kids';

  return (
    <>
      <Select
        label="Occasion"
        name="occasion"
        options={RSVP_OCCASIONS}
        value={occasion}
        onChange={(v) => setOccasion(v as typeof occasion)}
      />
      <Field label="Name" name="name" required defaultValue={record.name} />
      {isEvent ? (
        <>
          <input type="hidden" name="date" value={EVENT_DATE} />
          <input type="hidden" name="time" value={EVENT_TIME} />
          <div className="min-w-0 sm:col-span-2">
            <span className="label">Date &amp; time</span>
            <p className="field flex items-center text-ink">{EVENT_DATE_LABEL}</p>
          </div>
        </>
      ) : (
        <DateField
          label="Date"
          name="date"
          defaultValue={record.date}
          minDate={minDate}
          maxDate={maxDate}
          onChange={setDate}
        />
      )}
      {isDaily ? (
        <Select label="Session" name="session" options={sessionsAllowed} value={session} onChange={(v) => setSession(v as typeof session)} />
      ) : null}
      {isDaily ? (
        <TimeField label="Time" name="time" defaultValue={record.time} autoPeriod={session === 'Morning' ? 'AM' : 'PM'} />
      ) : null}
      <Field label={adultsLabel} name="adults" type="number" defaultValue={record.adults} />
      <Field label={kidsLabel} name="kids" type="number" defaultValue={record.kids} />
      {isFoodDay ? (
        <>
          <Field label="Guest adults" name="guestAdults" type="number" defaultValue={record.guestAdults} />
          <Field label="Guest children" name="guestKids" type="number" defaultValue={record.guestKids} />
        </>
      ) : null}
      {showPrasadam ? <Field label="Prasadam details" name="prasadam" defaultValue={record.prasadam} span /> : null}
      <Field label="Notes" name="notes" defaultValue={record.notes} span />
      {isEvent ? (
        <p className="text-xs text-muted sm:col-span-2 sm:text-sm">
          ⚠️ Kids must be accompanied by an adult for the full session.
        </p>
      ) : null}
    </>
  );
}
