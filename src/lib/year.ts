import { donations, expenses } from './repository';

/**
 * The app is always looking at exactly one festival year. A new year needs no
 * setup step: the first record dated in that year brings it into existence, and
 * every list is filtered by the selected year.
 */
export function currentYear(): number {
  return new Date().getFullYear();
}

export function yearOf(isoDate: string, fallback = currentYear()): number {
  const parsed = Number.parseInt(isoDate.slice(0, 4), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/** Years that already hold data, newest first, always including the current one. */
export async function availableYears(): Promise<number[]> {
  const [donationRows, expenseRows] = await Promise.all([donations.list(), expenses.list()]);
  const years = new Set<number>([currentYear()]);
  for (const row of donationRows) years.add(row.year);
  for (const row of expenseRows) years.add(row.year);
  return [...years].sort((a, b) => b - a);
}

/** Parses the ?year= search param, falling back to the current festival year. */
export function resolveYear(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(raw ?? '', 10);
  return Number.isFinite(parsed) && parsed >= 2000 && parsed <= 2100 ? parsed : currentYear();
}
