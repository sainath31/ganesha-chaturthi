'use client';

import { createDonation } from '@/lib/actions';
import { PAYMENT_METHODS, DONATION_STATUSES, FOOD_RSVP } from '@/lib/schema';
import { FormPanel, Field, Select } from './form-panel';

export function DonationForm({ today, lanes }: { today: string; lanes: string[] }) {
  return (
    <FormPanel
      title="Record a donation"
      openLabel="Add donation"
      submitLabel="Save donation"
      action={createDonation}
    >
      <Field label="Name" name="name" required placeholder="Family or contributor name" span />
      <Field label="Date" name="date" type="date" required defaultValue={today} />
      <Field label="Amount" name="amount" type="number" step="0.01" required placeholder="100.00" />
      <div>
        <label className="label" htmlFor="lane">
          Lane
        </label>
        <input id="lane" name="lane" list="lanes" className="field" placeholder="Ellsworth Pl" />
        <datalist id="lanes">
          {lanes.map((lane) => (
            <option key={lane} value={lane} />
          ))}
        </datalist>
      </div>
      <Select label="Method" name="method" options={PAYMENT_METHODS} />
      <Field label="Collected by" name="collectedBy" placeholder="Committee member who received it" />
      <Select label="Status" name="status" options={DONATION_STATUSES} />
      <Select label="Voted for food" name="votedForFood" options={FOOD_RSVP} defaultValue="No response" />
      <Field label="Food adults" name="foodAdults" type="number" defaultValue={0} />
      <Field label="Food kids" name="foodKids" type="number" defaultValue={0} />
      <Field label="Notes" name="notes" span />
    </FormPanel>
  );
}
