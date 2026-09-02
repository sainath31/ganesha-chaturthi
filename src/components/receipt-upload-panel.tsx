'use client';

import { uploadReceipts } from '@/lib/actions';
import { FormPanel, Field } from './form-panel';
import { ReceiptInput } from './receipt-input';

export function ReceiptUploadPanel({
  today,
  expenses,
}: {
  today: string;
  expenses: { id: string; label: string }[];
}) {
  return (
    <FormPanel
      title="Upload receipts"
      openLabel="Upload receipts"
      submitLabel="Upload to Drive"
      action={uploadReceipts}
    >
      <Field label="Date on the bill" name="date" type="date" required defaultValue={today} />
      <div className="min-w-0">
        <label className="label" htmlFor="expenseId">
          Attach to expense (optional)
        </label>
        <select id="expenseId" name="expenseId" className="field min-w-0" defaultValue="">
          <option value="">Not linked to an expense</option>
          {expenses.map((expense) => (
            <option key={expense.id} value={expense.id}>
              {expense.label}
            </option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <span className="label">Files</span>
        <ReceiptInput name="receipts" />
      </div>
    </FormPanel>
  );
}
