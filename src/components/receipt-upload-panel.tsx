'use client';

import { uploadReceipts } from '@/lib/actions';
import { FormPanel } from './form-panel';
import { ReceiptInput } from './receipt-input';

export function ReceiptUploadPanel({
  year,
  expenses,
}: {
  year: number;
  expenses: { id: string; label: string }[];
}) {
  return (
    <FormPanel
      title="Upload receipts"
      openLabel="Upload receipts"
      submitLabel="Upload to Drive"
      action={uploadReceipts}
    >
      <input type="hidden" name="year" value={`${year}-01-01`} />
      <div className="sm:col-span-2">
        <label className="label" htmlFor="expenseId">
          Attach to expense (optional)
        </label>
        <select id="expenseId" name="expenseId" className="field" defaultValue="">
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
