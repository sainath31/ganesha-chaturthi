'use server';

import { revalidatePath } from 'next/cache';
import { requireEditor, requireAdmin, currentUser, signOut } from './auth';
import { donations, expenses, receipts, rsvps, accessRequests, newId, nextReceiptNo } from './repository';
import { yearOf } from './year';
import { donationInputSchema, expenseInputSchema, rsvpInputSchema, accessRequestInputSchema } from './schema';
import { uploadReceipt, deleteReceiptFile } from './drive';
import { notifyAccessRequest } from './mail';

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: '/' });
}

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

    const updated = await donations.update(id, {
      ...existing,
      ...input,
      year: yearOf(input.date),
      recordedBy: user.email,
      recordedAt: new Date().toISOString(),
    });
    if (!updated) return { ok: false, error: 'That donation no longer exists.' };

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
    const uploaded = await Promise.all(files.map((file) => uploadReceipt(file, { year })));
    await Promise.all(
      uploaded.map((file) =>
        receipts.append({
          ...file,
          id: newId('rec'),
          year,
          date: input.date,
          expenseId: id,
          uploadedBy: user.email,
          uploadedAt: new Date().toISOString(),
        }),
      ),
    );

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
    const updated = await expenses.update(id, {
      ...existing,
      ...input,
      year,
      recordedBy: user.email,
      recordedAt: new Date().toISOString(),
    });
    if (!updated) return { ok: false, error: 'That expense no longer exists.' };

    // The edit dialog can attach further receipts to an expense already recorded.
    const files = formData
      .getAll('receipts')
      .filter((f): f is File => f instanceof File && f.size > 0);
    const uploaded = await Promise.all(files.map((file) => uploadReceipt(file, { year })));
    await Promise.all(
      uploaded.map((file) =>
        receipts.append({
          ...file,
          id: newId('rec'),
          year,
          date: input.date,
          expenseId: id,
          uploadedBy: user.email,
          uploadedAt: new Date().toISOString(),
        }),
      ),
    );

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
    const date = String(formData.get('date') ?? '');
    const year = yearOf(date);
    const files = formData.getAll('receipts').filter((f): f is File => f instanceof File && f.size > 0);
    if (files.length === 0) return { ok: false, error: 'Choose at least one file to upload.' };

    const uploaded = await Promise.all(files.map((file) => uploadReceipt(file, { year })));
    await Promise.all(
      uploaded.map((file) =>
        receipts.append({
          ...file,
          id: newId('rec'),
          year,
          date,
          expenseId,
          uploadedBy: user.email,
          uploadedAt: new Date().toISOString(),
        }),
      ),
    );

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

/**
 * Pooja RSVP is a public sign-up, not a financial record: anyone with the
 * link — signed in or not — can submit one. Editing and removing entries
 * stays restricted, so a stray submission can't be used to tamper with
 * someone else's.
 */
export async function createRsvp(formData: FormData): Promise<ActionResult> {
  try {
    const user = await currentUser();
    const input = rsvpInputSchema.parse(Object.fromEntries(formData));

    await rsvps.append({
      ...input,
      id: newId('rsvp'),
      year: yearOf(input.date),
      recordedBy: user?.email ?? '',
      recordedAt: new Date().toISOString(),
    });

    revalidatePath('/rsvp');
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function updateRsvp(id: string, formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireEditor();
    const input = rsvpInputSchema.parse(Object.fromEntries(formData));
    const existing = (await rsvps.list()).find((row) => row.id === id);
    if (!existing) return { ok: false, error: 'That RSVP no longer exists.' };

    const updated = await rsvps.update(id, {
      ...existing,
      ...input,
      year: yearOf(input.date),
      recordedBy: user.email,
      recordedAt: new Date().toISOString(),
    });
    if (!updated) return { ok: false, error: 'That RSVP no longer exists.' };

    revalidatePath('/rsvp');
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteRsvp(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await rsvps.delete(id);
    revalidatePath('/rsvp');
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

/** Public: anyone denied access (or without an account at all) can ask to be added. */
export async function requestAccess(formData: FormData): Promise<ActionResult> {
  try {
    const input = accessRequestInputSchema.parse(Object.fromEntries(formData));

    // The signin page isn't wrapped by the main app layout, so ensure the
    // tab exists here rather than relying on a prior page visit for it.
    await accessRequests.ensure();
    await accessRequests.append({
      ...input,
      id: newId('req'),
      requestedAt: new Date().toISOString(),
    });

    await notifyAccessRequest(input);
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}
