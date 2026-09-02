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

export async function ensureAllTabs(): Promise<void> {
  // Sequential: each ensure() reads spreadsheet metadata that a previous
  // addSheet may have changed.
  await donations.ensure();
  await expenses.ensure();
  await receipts.ensure();
  await rsvps.ensure();
  await accessRequests.ensure();
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

  // Costs a family absorbed outright are real spending but never touch the
  // committee's pot, so they are reported separately rather than folded in.
  const committeeExpenses = expenseRows.filter((row) => row.settlement !== 'Paid directly');
  const spent = committeeExpenses.reduce((sum, row) => sum + row.amount, 0);
  const paidDirectly = expenseRows
    .filter((row) => row.settlement === 'Paid directly')
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
    const key = row.method === 'Cash' || !collector ? row.method : `${row.method} (${collector})`;
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
    if (row.settlement === 'Paid directly') continue;
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
    if (row.settlement === 'Paid directly') continue;
    groups.set(row.category, (groups.get(row.category) ?? 0) + row.amount);
  }
  return [...groups.entries()]
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}


/** Everything the app shows is read through these, so nothing leaks across years. */
export async function donationsForYear(year: number): Promise<Donation[]> {
  return (await donations.list()).filter((row) => row.year === year);
}

export async function expensesForYear(year: number): Promise<Expense[]> {
  return (await expenses.list()).filter((row) => row.year === year);
}

export async function rsvpsForYear(year: number): Promise<Rsvp[]> {
  return (await rsvps.list()).filter((row) => row.year === year);
}

/** How many are coming for food, split by age — the number catering needs to plan for. */
export function foodHeadcount(donationRows: Donation[]) {
  return donationRows.reduce(
    (acc, row) => ({ adults: acc.adults + row.foodAdults, kids: acc.kids + row.foodKids }),
    { adults: 0, kids: 0 },
  );
}

export function rsvpHeadcount(rsvpRows: Rsvp[]) {
  return rsvpRows.reduce(
    (acc, row) => ({ adults: acc.adults + row.adults, kids: acc.kids + row.kids }),
    { adults: 0, kids: 0 },
  );
}
