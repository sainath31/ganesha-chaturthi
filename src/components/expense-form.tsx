'use client';

import { createExpense } from '@/lib/actions';
import { EXPENSE_CATEGORIES, SETTLEMENT_STATUSES } from '@/lib/schema';
import { FormPanel, Field, Select } from './form-panel';
import { ReceiptInput } from './receipt-input';

export function ExpenseForm({ today, people }: { today: string; people: string[] }) {
  return (
    <FormPanel
      title="Record an expense"
      openLabel="Add expense"
      submitLabel="Save expense"
      action={createExpense}
    >
      <Field label="Description" name="description" required placeholder="Pooja items, fruits" span />
      <Field label="Date" name="date" type="date" required defaultValue={today} />
      <Field label="Amount" name="amount" type="number" step="0.01" required placeholder="53.87" />
      <Select label="Category" name="category" options={EXPENSE_CATEGORIES} />
      <Field label="Store" name="store" placeholder="Costco" />
      <div>
        <label className="label" htmlFor="paidBy">
          Paid by
        </label>
        <input id="paidBy" name="paidBy" list="people" required className="field" placeholder="Who fronted the money" />
        <datalist id="people">
          {people.map((person) => (
            <option key={person} value={person} />
          ))}
        </datalist>
      </div>
      <Select label="Settlement" name="settlement" options={SETTLEMENT_STATUSES} />
      <Field label="Notes" name="notes" span />
      <div className="sm:col-span-2">
        <span className="label">Receipts</span>
        <ReceiptInput name="receipts" />
      </div>
    </FormPanel>
  );
}
