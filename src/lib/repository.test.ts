import { describe, expect, it } from 'vitest';
import {
  totals,
  byCategory,
  reimbursements,
  byCollector,
  nextReceiptNo,
  newId,
  rsvpHeadcount,
} from './repository';
import type { Donation, Expense, Rsvp } from './schema';

function donation(overrides: Partial<Donation>): Donation {
  return {
    id: 'don_1',
    year: 2026,
    receiptNo: 'GC-2026-0001',
    date: '2026-08-10',
    name: 'Someone',
    lane: 'Lane',
    amount: 100,
    method: 'Cash',
    collectedBy: '',
    status: 'Paid',
    notes: '',
    recordedBy: '',
    recordedAt: '',
    ...overrides,
  };
}

function expense(overrides: Partial<Expense>): Expense {
  return {
    id: 'exp_1',
    year: 2026,
    date: '2026-08-10',
    category: 'Miscellaneous',
    description: 'Something',
    store: '',
    paidBy: 'Someone',
    amount: 50,
    settlement: 'Pending',
    notes: '',
    recordedBy: '',
    recordedAt: '',
    ...overrides,
  };
}

function rsvp(overrides: Partial<Rsvp>): Rsvp {
  return {
    id: 'rsvp_1',
    year: 2026,
    occasion: 'First Day Pooja',
    date: '2026-08-10',
    name: 'Someone',
    adults: 2,
    kids: 0,
    session: '',
    time: '',
    prasadam: '',
    notes: '',
    recordedBy: '',
    recordedAt: '',
    ...overrides,
  };
}

describe('rsvpHeadcount', () => {
  it('sums adults and kids across RSVP rows', () => {
    const result = rsvpHeadcount([rsvp({ adults: 2, kids: 1 }), rsvp({ adults: 1, kids: 3 })]);
    expect(result).toEqual({ adults: 3, kids: 4 });
  });
});

describe('totals', () => {
  it('sums paid donations as collected and others as pledged', () => {
    const donations = [
      donation({ status: 'Paid', amount: 100 }),
      donation({ status: 'Pledged', amount: 50 }),
    ];
    const result = totals(donations, []);
    expect(result.collected).toBe(100);
    expect(result.pledged).toBe(50);
  });

  it('excludes "Paid directly" expenses from spend but tracks them separately', () => {
    const expenses = [
      expense({ amount: 200, settlement: 'Cleared' }),
      expense({ amount: 250, settlement: 'Paid directly' }),
    ];
    const result = totals([], expenses);
    expect(result.spent).toBe(200);
    expect(result.paidDirectly).toBe(250);
  });

  it('computes balance as collected minus spent', () => {
    const donations = [donation({ status: 'Paid', amount: 300 })];
    const expenses = [expense({ amount: 120, settlement: 'Cleared' })];
    const result = totals(donations, expenses);
    expect(result.balance).toBe(180);
  });

  it('counts unique donors case-insensitively and trims whitespace', () => {
    const donations = [
      donation({ name: 'Ram Reddy' }),
      donation({ name: 'ram reddy ' }),
      donation({ name: 'Someone Else' }),
    ];
    const result = totals(donations, []);
    expect(result.donorCount).toBe(2);
  });
});

describe('byCategory', () => {
  it('groups expense amounts by category, largest first', () => {
    const expenses = [
      expense({ category: 'Idol', amount: 100 }),
      expense({ category: 'Priest', amount: 300 }),
      expense({ category: 'Idol', amount: 50 }),
    ];
    const result = byCategory(expenses);
    expect(result[0]).toEqual({ category: 'Priest', total: 300 });
    expect(result[1]).toEqual({ category: 'Idol', total: 150 });
  });

  it('excludes "Paid directly" rows so the chart matches the headline spend', () => {
    const expenses = [expense({ category: 'Priest', amount: 250, settlement: 'Paid directly' })];
    expect(byCategory(expenses)).toEqual([]);
  });
});

describe('reimbursements', () => {
  it('groups pending vs cleared amounts per person', () => {
    const expenses = [
      expense({ paidBy: 'Rama S', amount: 40, settlement: 'Pending' }),
      expense({ paidBy: 'Rama S', amount: 60, settlement: 'Cleared' }),
    ];
    const result = reimbursements(expenses);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ person: 'Rama S', total: 100, cleared: 60, pending: 40 });
  });

  it('falls back to "Unassigned" for a blank paidBy', () => {
    const result = reimbursements([expense({ paidBy: '  ', amount: 20 })]);
    expect(result[0].person).toBe('Unassigned');
  });

  it('excludes "Paid directly" rows entirely', () => {
    const result = reimbursements([expense({ paidBy: 'Host family', amount: 250, settlement: 'Paid directly' })]);
    expect(result).toEqual([]);
  });
});

describe('byCollector', () => {
  it('groups cash donations without a collector suffix when none is recorded', () => {
    const result = byCollector([donation({ method: 'Cash', collectedBy: '', amount: 100 })]);
    expect(result[0]).toMatchObject({ key: 'Cash', total: 100, count: 1 });
  });

  it('groups cash donations with a "Cash (Collector)" key when a collector is recorded', () => {
    const result = byCollector([donation({ method: 'Cash', collectedBy: 'Rama S', amount: 100 })]);
    expect(result[0].key).toBe('Cash (Rama S)');
  });

  it('groups non-cash donations with a "Method (Collector)" key', () => {
    const result = byCollector([donation({ method: 'Zelle', collectedBy: 'Mamatha', amount: 75 })]);
    expect(result[0].key).toBe('Zelle (Mamatha)');
  });

  it('excludes unpaid (pledged/pending) donations', () => {
    const result = byCollector([donation({ status: 'Pledged', amount: 100 })]);
    expect(result).toEqual([]);
  });

  it('sorts groups by total descending', () => {
    const result = byCollector([
      donation({ method: 'Cash', amount: 50 }),
      donation({ method: 'Zelle', collectedBy: 'Rama', amount: 200 }),
    ]);
    expect(result[0].total).toBe(200);
  });
});

describe('nextReceiptNo', () => {
  it('starts at 0001 when there are no existing donations for the year', () => {
    expect(nextReceiptNo([], 2026)).toBe('GC-2026-0001');
  });

  it('increments from the highest existing receipt number in that year', () => {
    const existing = [
      donation({ receiptNo: 'GC-2026-0001' }),
      donation({ receiptNo: 'GC-2026-0007' }),
      donation({ receiptNo: 'GC-2026-0003' }),
    ];
    expect(nextReceiptNo(existing, 2026)).toBe('GC-2026-0008');
  });

  it('ignores receipt numbers from a different year', () => {
    const existing = [donation({ receiptNo: 'GC-2025-0099' })];
    expect(nextReceiptNo(existing, 2026)).toBe('GC-2026-0001');
  });

  it('pads the sequence to four digits', () => {
    const existing = Array.from({ length: 9 }, (_, i) =>
      donation({ receiptNo: `GC-2026-${String(i + 1).padStart(4, '0')}` }),
    );
    expect(nextReceiptNo(existing, 2026)).toBe('GC-2026-0010');
  });
});

describe('newId', () => {
  it('prefixes the id as requested', () => {
    expect(newId('don')).toMatch(/^don_/);
  });

  it('generates unique ids across calls', () => {
    const ids = new Set(Array.from({ length: 20 }, () => newId('exp')));
    expect(ids.size).toBe(20);
  });
});
