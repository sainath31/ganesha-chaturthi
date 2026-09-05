import { cache } from 'react';
import { SheetTable } from './sheet-table';
import {
  DONATION_COLUMNS,
  EXPENSE_COLUMNS,
  RECEIPT_COLUMNS,
  RSVP_COLUMNS,
  ACCESS_REQUEST_COLUMNS,
  donationSchema,
  expenseSchema,
  receiptSchema,
  rsvpSchema,
  accessRequestSchema,
  type Donation,
  type Expense,
  type Rsvp,
} from './schema';

export const TABS = {
  donations: 'Donations',
  expenses: 'Expenses',
  receipts: 'Receipts',
  rsvps: 'RSVP',
  accessRequests: 'Access Requests',
} as const;

export const donations = new SheetTable(TABS.donations, DONATION_COLUMNS, donationSchema);
export const expenses = new SheetTable(TABS.expenses, EXPENSE_COLUMNS, expenseSchema);
export const receipts = new SheetTable(TABS.receipts, RECEIPT_COLUMNS, receiptSchema);
export const rsvps = new SheetTable(TABS.rsvps, RSVP_COLUMNS, rsvpSchema);
export const accessRequests = new SheetTable(
  TABS.accessRequests,
  ACCESS_REQUEST_COLUMNS,
  accessRequestSchema,
);

// Once a tab has been verified to exist with the right headers, it won't
// stop existing — re-checking on every single page navigation for the life
// of the server process is pure overhead, so this only actually runs once.
let allTabsEnsured = false;

export async function ensureAllTabs(): Promise<void> {
  if (allTabsEnsured) return;
  // Sequential: each ensure() reads spreadsheet metadata that a previous
  // addSheet may have changed.
  await donations.ensure();
  await expenses.ensure();
  await receipts.ensure();
  await rsvps.ensure();
  await accessRequests.ensure();
  allTabsEnsured = true;
}

/** "Paid directly" costs a family absorbed outright without claiming it
 *  back — real spending, but it never touches the committee's pot, so every
 *  aggregate below excludes it the same way. */
function isCommitteeExpense(row: Expense): boolean {
  return row.settlement !== 'Paid directly';
}

export function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Receipt numbers are sequential per year (GC-2026-0001). Derived from the
 * existing rows rather than stored in a counter, so a hand-edited sheet still
 * produces the right next number.
 */
export function nextReceiptNo(existing: Donation[], year = new Date().getFullYear()): string {
  const prefix = `GC-${year}-`;
  const highest = existing.reduce((max, donation) => {
    if (!donation.receiptNo.startsWith(prefix)) return max;
    const value = Number.parseInt(donation.receiptNo.slice(prefix.length), 10);
    return Number.isFinite(value) && value > max ? value : max;
  }, 0);
  return `${prefix}${String(highest + 1).padStart(4, '0')}`;
}

export function totals(donationRows: Donation[], expenseRows: Expense[]) {
  const collected = donationRows
    .filter((row) => row.status === 'Paid')
    .reduce((sum, row) => sum + row.amount, 0);
  const pledged = donationRows
    .filter((row) => row.status !== 'Paid')
    .reduce((sum, row) => sum + row.amount, 0);

  const committeeExpenses = expenseRows.filter(isCommitteeExpense);
  const spent = committeeExpenses.reduce((sum, row) => sum + row.amount, 0);
  const paidDirectly = expenseRows
    .filter((row) => !isCommitteeExpense(row))
    .reduce((sum, row) => sum + row.amount, 0);

  return {
    collected,
    pledged,
    spent,
    paidDirectly,
    balance: collected - spent,
    donorCount: new Set(donationRows.map((row) => row.name.trim().toLowerCase())).size,
    donationCount: donationRows.length,
    expenseCount: expenseRows.length,
  };
}

/** Money in, grouped by the committee member who received it. */
export function byCollector(donationRows: Donation[]) {
  const groups = new Map<string, { key: string; method: string; total: number; count: number }>();
  for (const row of donationRows) {
    if (row.status !== 'Paid') continue;
    const collector = row.collectedBy.trim();
    const key = collector ? `${row.method} (${collector})` : row.method;
    const existing = groups.get(key) ?? { key, method: row.method, total: 0, count: 0 };
    existing.total += row.amount;
    existing.count += 1;
    groups.set(key, existing);
  }
  return [...groups.values()].sort((a, b) => b.total - a.total);
}

/** What each person fronted and is still owed back. */
export function reimbursements(expenseRows: Expense[]) {
  const groups = new Map<string, { person: string; total: number; cleared: number; pending: number }>();
  for (const row of expenseRows) {
    if (!isCommitteeExpense(row)) continue;
    const person = row.paidBy.trim() || 'Unassigned';
    const existing = groups.get(person) ?? { person, total: 0, cleared: 0, pending: 0 };
    existing.total += row.amount;
    if (row.settlement === 'Cleared') existing.cleared += row.amount;
    else existing.pending += row.amount;
    groups.set(person, existing);
  }
  return [...groups.values()].sort((a, b) => b.total - a.total);
}

/**
 * Spend per category, largest first. Mirrors the `spent` total by excluding
 * costs a family absorbed outright — otherwise the chart sums to more than the
 * headline figure and the two visibly disagree.
 */
export function byCategory(expenseRows: Expense[]) {
  const groups = new Map<string, number>();
  for (const row of expenseRows) {
    if (!isCommitteeExpense(row)) continue;
    groups.set(row.category, (groups.get(row.category) ?? 0) + row.amount);
  }
  return [...groups.entries()]
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}


// Deduped per request: the layout reads donations/expenses to compute the
// year list, and the page below reads the exact same tabs again to render
// rows — without this, that's two full Sheets reads apiece on every view.
export const listDonations = cache(() => donations.list());
export const listExpenses = cache(() => expenses.list());
const listRsvps = cache(() => rsvps.list());

/** Everything the app shows is read through these, so nothing leaks across years. */
export async function donationsForYear(year: number): Promise<Donation[]> {
  return (await listDonations()).filter((row) => row.year === year);
}

export async function expensesForYear(year: number): Promise<Expense[]> {
  return (await listExpenses()).filter((row) => row.year === year);
}

export async function rsvpsForYear(year: number): Promise<Rsvp[]> {
  return (await listRsvps()).filter((row) => row.year === year);
}

export function rsvpHeadcount(rsvpRows: Rsvp[]) {
  return rsvpRows.reduce(
    (acc, row) => ({ adults: acc.adults + row.adults, kids: acc.kids + row.kids }),
    { adults: 0, kids: 0 },
  );
}
