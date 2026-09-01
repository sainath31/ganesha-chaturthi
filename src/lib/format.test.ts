import { describe, expect, it } from 'vitest';
import { formatMoney, formatDate, formatBytes, today } from './format';

describe('formatMoney', () => {
  it('formats a plain amount as USD', () => {
    expect(formatMoney(100)).toBe('$100.00');
  });

  it('formats cents correctly', () => {
    expect(formatMoney(101.81)).toBe('$101.81');
  });

  it('formats zero', () => {
    expect(formatMoney(0)).toBe('$0.00');
  });

  it('formats negative amounts', () => {
    expect(formatMoney(-50)).toBe('-$50.00');
  });

  it('compacts large amounts when requested', () => {
    expect(formatMoney(12345, { compact: true })).toBe('$12.3K');
  });
});

describe('formatDate', () => {
  it('formats an ISO date', () => {
    expect(formatDate('2026-08-15')).toBe('Aug 15, 2026');
  });

  it('returns an em dash for an empty string', () => {
    expect(formatDate('')).toBe('—');
  });

  it('falls back to the raw string for an unparsable date', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date');
  });
});

describe('formatBytes', () => {
  it('returns an em dash for zero bytes', () => {
    expect(formatBytes(0)).toBe('—');
  });

  it('formats bytes under 1KB', () => {
    expect(formatBytes(500)).toBe('500 B');
  });

  it('formats kilobytes with one decimal', () => {
    expect(formatBytes(1536)).toBe('1.5 KB');
  });

  it('formats megabytes', () => {
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB');
  });
});

describe('today', () => {
  it('returns an ISO date string of length 10', () => {
    expect(today()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
