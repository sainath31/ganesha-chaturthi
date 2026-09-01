import type { Donation, Expense, Receipt, Rsvp } from './schema';
import type { Role } from './auth';
import { canEdit, canViewReceipts } from './auth';

/**
 * Read access is public, so anything that could identify a household is
 * stripped on the server before it is ever serialised into the page. Hiding
 * these fields with CSS would still ship them in the HTML payload.
 *
 * Editors and admins see the real values; everyone else sees these reductions.
 */

/** "Ram Reddy & Soumya" -> "Ram R." · "Aravind" -> "Aravind" */
export function shortenName(name: string): string {
  const cleaned = name.replace(/\s*&.*$/, '').replace(/\s+family\s*$/i, '').trim();
  const [first, second] = cleaned.split(/\s+/);
  if (!first) return 'Anonymous';
  return second ? `${first} ${second[0].toUpperCase()}.` : first;
}

const HIDDEN = '—';

/** Anything that reads like an email or a phone number, wherever it turns up. */
export function scrubContacts(value: string): string {
  return value
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, HIDDEN)
    .replace(/(?:\+?\d[\s().-]?){7,}\d/g, HIDDEN);
}

export function redactDonation(row: Donation, role: Role): Donation {
  if (canEdit(role)) return row;
  return {
    ...row,
    name: shortenName(row.name),
    lane: HIDDEN,
    collectedBy: row.collectedBy ? shortenName(row.collectedBy) : '',
    notes: '',
    recordedBy: '',
  };
}

export function redactExpense(row: Expense, role: Role): Expense {
  if (canEdit(role)) return row;
  return {
    ...row,
    // Store and amount are the substance of a public account; the payer is a
    // named neighbour, so it is shortened rather than shown in full.
    paidBy: row.paidBy ? shortenName(row.paidBy) : '',
    description: scrubContacts(row.description),
    notes: '',
    recordedBy: '',
  };
}

export function redactRsvp(row: Rsvp, role: Role): Rsvp {
  if (canEdit(role)) return row;
  return {
    ...row,
    name: shortenName(row.name),
    notes: '',
    recordedBy: '',
  };
}

export function redactReceipt(row: Receipt, role: Role, email?: string | null): Receipt {
  if (canViewReceipts(role, email)) return row;
  return {
    ...row,
    // The file itself is withheld from viewers, so its name — often a shop,
    // a date, sometimes a person — goes with it.
    fileName: 'Receipt',
    webViewLink: '',
    uploadedBy: '',
  };
}
