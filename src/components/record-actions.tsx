'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from './modal';
import { Field, Select } from './form-panel';
import { DateField, TimeField } from './date-time-fields';
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
  FOOD_RSVP,
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
      <Select
        label="Voted for food"
        name="votedForFood"
        options={FOOD_RSVP}
        defaultValue={record.votedForFood}
      />
      <Field label="Food adults" name="foodAdults" type="number" defaultValue={record.foodAdults} />
      <Field label="Food kids" name="foodKids" type="number" defaultValue={record.foodKids} />
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

function RsvpFields({ record }: { record: Rsvp }) {
  // Session/time only apply to Daily Pooja; shown based on the record's
  // current occasion (switching the dropdown below won't toggle these live).
  const isDaily = record.occasion === 'Daily Pooja';

  return (
    <>
      <Select label="Occasion" name="occasion" options={RSVP_OCCASIONS} defaultValue={record.occasion} />
      <Field label="Name" name="name" required defaultValue={record.name} />
      <DateField label="Date" name="date" defaultValue={record.date} />
      {isDaily ? (
        <Select label="Session" name="session" options={RSVP_SESSIONS} defaultValue={record.session || 'Morning'} />
      ) : null}
      {isDaily ? <TimeField label="Time" name="time" defaultValue={record.time} /> : null}
      <Field label="Adults" name="adults" type="number" defaultValue={record.adults} />
      <Field label="Kids" name="kids" type="number" defaultValue={record.kids} />
      <Field label="Prasadam details" name="prasadam" defaultValue={record.prasadam} span />
      <Field label="Notes" name="notes" defaultValue={record.notes} span />
    </>
  );
}
