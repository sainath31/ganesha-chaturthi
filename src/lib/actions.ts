'use server';

import { revalidatePath } from 'next/cache';
import { requireEditor, requireAdmin } from './auth';
import { donations, expenses, receipts, newId, nextReceiptNo } from './repository';
import { yearOf } from './year';
import { donationInputSchema, expenseInputSchema } from './schema';
import { uploadReceipt, deleteReceiptFile } from './drive';

export type ActionResult = { ok: true } | { ok: false; error: string };

function fail(error: unknown): ActionResult {
  return { ok: false, error: error instanceof Error ? error.message : 'Something went wrong.' };
}

export async function createDonation(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireEditor();
    const input = donationInputSchema.parse(Object.fromEntries(formData));
    const year = yearOf(input.date);
    const existing = (await donations.list()).filter((row) => row.year === year);

    await donations.append({
      ...input,
      id: newId('don'),
      year,
      receiptNo: nextReceiptNo(existing, year),
      recordedBy: user.email,
      recordedAt: new Date().toISOString(),
    });

    revalidatePath('/donations');
    revalidatePath('/');
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function updateDonation(id: string, formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireEditor();
    const input = donationInputSchema.parse(Object.fromEntries(formData));
    const existing = (await donations.list()).find((row) => row.id === id);
    if (!existing) return { ok: false, error: 'That donation no longer exists.' };

    await donations.update(id, {
      ...existing,
      ...input,
      year: yearOf(input.date),
      recordedBy: user.email,
      recordedAt: new Date().toISOString(),
    });

    revalidatePath('/donations');
    revalidatePath('/');
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteDonation(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await donations.delete(id);
    revalidatePath('/donations');
    revalidatePath('/');
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function createExpense(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireEditor();
    const input = expenseInputSchema.parse(Object.fromEntries(formData));
    const id = newId('exp');
    const year = yearOf(input.date);

    await expenses.append({
      ...input,
      id,
      year,
      recordedBy: user.email,
      recordedAt: new Date().toISOString(),
    });

    const files = formData.getAll('receipts').filter((f): f is File => f instanceof File && f.size > 0);
    for (const file of files) {
      const uploaded = await uploadReceipt(file, { year });
      await receipts.append({
        ...uploaded,
        id: newId('rec'),
        year,
        expenseId: id,
        uploadedBy: user.email,
        uploadedAt: new Date().toISOString(),
      });
    }

    revalidatePath('/expenses');
    revalidatePath('/receipts');
    revalidatePath('/');
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function updateExpense(id: string, formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireEditor();
    const input = expenseInputSchema.parse(Object.fromEntries(formData));
    const existing = (await expenses.list()).find((row) => row.id === id);
    if (!existing) return { ok: false, error: 'That expense no longer exists.' };

    const year = yearOf(input.date);
    await expenses.update(id, {
      ...existing,
      ...input,
      year,
      recordedBy: user.email,
      recordedAt: new Date().toISOString(),
    });

    // The edit dialog can attach further receipts to an expense already recorded.
    const files = formData
      .getAll('receipts')
      .filter((f): f is File => f instanceof File && f.size > 0);
    for (const file of files) {
      const uploaded = await uploadReceipt(file, { year });
      await receipts.append({
        ...uploaded,
        id: newId('rec'),
        year,
        expenseId: id,
        uploadedBy: user.email,
        uploadedAt: new Date().toISOString(),
      });
    }

    revalidatePath('/expenses');
    revalidatePath('/receipts');
    revalidatePath('/');
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteExpense(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await expenses.delete(id);
    revalidatePath('/expenses');
    revalidatePath('/');
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

/** Standalone receipt upload, optionally attached to an existing expense. */
export async function uploadReceipts(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireEditor();
    const expenseId = String(formData.get('expenseId') ?? '');
    const year = yearOf(String(formData.get('year') ?? ''));
    const files = formData.getAll('receipts').filter((f): f is File => f instanceof File && f.size > 0);
    if (files.length === 0) return { ok: false, error: 'Choose at least one file to upload.' };

    for (const file of files) {
      const uploaded = await uploadReceipt(file, { year });
      await receipts.append({
        ...uploaded,
        id: newId('rec'),
        year,
        expenseId,
        uploadedBy: user.email,
        uploadedAt: new Date().toISOString(),
      });
    }

    revalidatePath('/receipts');
    revalidatePath('/expenses');
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteReceipt(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const receipt = (await receipts.list()).find((row) => row.id === id);
    if (!receipt) return { ok: false, error: 'That receipt no longer exists.' };

    // Trashed rather than permanently deleted, so a misclick is recoverable
    // from the Drive bin for 30 days.
    await deleteReceiptFile(receipt.fileId);
    await receipts.delete(id);

    revalidatePath('/receipts');
    revalidatePath('/expenses');
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}
