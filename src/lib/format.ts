import { env } from './env';

export function formatMoney(amount: number, options: { compact?: boolean } = {}): string {
  return new Intl.NumberFormat(env.locale, {
    style: 'currency',
    currency: env.currency,
    maximumFractionDigits: options.compact ? 1 : 2,
    notation: options.compact ? 'compact' : 'standard',
  }).format(amount);
}

export function formatDate(iso: string): string {
  if (!iso) return 'Not set';
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(env.locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** exponent).toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}
