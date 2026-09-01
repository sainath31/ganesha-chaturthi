import { describe, expect, it } from 'vitest';
import { yearOf, resolveYear } from './year';

describe('yearOf', () => {
  it('extracts the year from an ISO date', () => {
    expect(yearOf('2026-08-15')).toBe(2026);
  });

  it('falls back to the given default for an unparsable date', () => {
    expect(yearOf('not-a-date', 2020)).toBe(2020);
  });
});

describe('resolveYear', () => {
  it('parses a valid year string', () => {
    expect(resolveYear('2025')).toBe(2025);
  });

  it('falls back to the current year for undefined', () => {
    expect(resolveYear(undefined)).toBe(new Date().getFullYear());
  });

  it('falls back to the current year for an out-of-range value', () => {
    expect(resolveYear('1500')).toBe(new Date().getFullYear());
  });

  it('falls back to the current year for garbage input', () => {
    expect(resolveYear('abc')).toBe(new Date().getFullYear());
  });

  it('takes the first value when given an array (repeated query param)', () => {
    expect(resolveYear(['2024', '2025'])).toBe(2024);
  });
});
