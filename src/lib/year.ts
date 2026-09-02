import { listDonations, listExpenses } from './repository';

export { currentYear, yearOf, resolveYear } from './resolve-year';
import { currentYear } from './resolve-year';

/** Years that already hold data, newest first, always including the current one. */
export async function availableYears(): Promise<number[]> {
  const [donationRows, expenseRows] = await Promise.all([listDonations(), listExpenses()]);
  const years = new Set<number>([currentYear()]);
  for (const row of donationRows) years.add(row.year);
  for (const row of expenseRows) years.add(row.year);
  return [...years].sort((a, b) => b - a);
}
