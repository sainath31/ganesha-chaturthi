import { describe, expect, it } from 'vitest';
import {
  donationSchema,
  donationInputSchema,
  expenseSchema,
  receiptSchema,
  rsvpSchema,
  accessRequestSchema,
} from './schema';

const validDonation = {
  id: 'don_1',
  year: 2026,
  receiptNo: 'GC-2026-0001',
  date: '2026-08-10',
  name: 'Ram Reddy',
  lane: 'Gardiner Lane',
  amount: 100,
  method: 'Cash',
  collectedBy: '',
  status: 'Paid',
  notes: '',
  recordedBy: 'admin@example.com',
  recordedAt: '2026-08-10T10:00:00.000Z',
};

describe('donationSchema', () => {
  it('accepts a fully valid row', () => {
    expect(donationSchema.safeParse(validDonation).success).toBe(true);
  });

  it('rejects a missing name', () => {
    const result = donationSchema.safeParse({ ...validDonation, name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects a malformed date', () => {
    const result = donationSchema.safeParse({ ...validDonation, date: '08/10/2026' });
    expect(result.success).toBe(false);
  });

  it('rejects a negative amount', () => {
    const result = donationSchema.safeParse({ ...validDonation, amount: -5 });
    expect(result.success).toBe(false);
  });

  it('coerces a string amount from sheet cells into a number', () => {
    const result = donationSchema.safeParse({ ...validDonation, amount: '150.5' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.amount).toBe(150.5);
  });

  it('defaults an unknown/blank method to Cash', () => {
    const result = donationSchema.safeParse({ ...validDonation, method: undefined });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.method).toBe('Cash');
  });

  it('rejects a method outside the enum', () => {
    const result = donationSchema.safeParse({ ...validDonation, method: 'Bitcoin' });
    expect(result.success).toBe(false);
  });

  it('rejects a year outside the sane range', () => {
    const result = donationSchema.safeParse({ ...validDonation, year: 1899 });
    expect(result.success).toBe(false);
  });

});

describe('donationInputSchema', () => {
  it('omits server-assigned fields', () => {
    const { id, year, receiptNo, recordedBy, recordedAt, ...rest } = validDonation;
    expect(donationInputSchema.safeParse(rest).success).toBe(true);
  });
});

const validExpense = {
  id: 'exp_1',
  year: 2026,
  date: '2026-08-10',
  category: 'Pooja Items',
  description: 'Coconut and flowers',
  store: 'Taaza Mart',
  paidBy: 'Mamatha Sainath',
  amount: 101.81,
  settlement: 'Cleared',
  notes: '',
  recordedBy: 'admin@example.com',
  recordedAt: '2026-08-10T10:00:00.000Z',
};

describe('expenseSchema', () => {
  it('accepts a fully valid row', () => {
    expect(expenseSchema.safeParse(validExpense).success).toBe(true);
  });

  it('rejects a missing description', () => {
    expect(expenseSchema.safeParse({ ...validExpense, description: '' }).success).toBe(false);
  });

  it('rejects a missing paidBy', () => {
    expect(expenseSchema.safeParse({ ...validExpense, paidBy: '' }).success).toBe(false);
  });

  it('allows a negative amount (refunds/corrections)', () => {
    expect(expenseSchema.safeParse({ ...validExpense, amount: -10 }).success).toBe(true);
  });

  it('defaults settlement to Pending when omitted', () => {
    const result = expenseSchema.safeParse({ ...validExpense, settlement: undefined });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.settlement).toBe('Pending');
  });
});

const validReceipt = {
  id: 'rec_1',
  year: 2026,
  date: '2026-08-10',
  expenseId: 'exp_1',
  fileId: 'drive_file_1',
  fileName: 'coconut.jpg',
  mimeType: 'image/jpeg',
  sizeBytes: 12345,
  webViewLink: 'https://drive.google.com/file/d/drive_file_1',
  uploadedBy: 'admin@example.com',
  uploadedAt: '2026-08-10T10:00:00.000Z',
};

describe('receiptSchema', () => {
  it('accepts a fully valid row', () => {
    expect(receiptSchema.safeParse(validReceipt).success).toBe(true);
  });

  it('defaults missing sizeBytes to 0', () => {
    const result = receiptSchema.safeParse({ ...validReceipt, sizeBytes: undefined });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.sizeBytes).toBe(0);
  });

  it('rejects a missing fileId', () => {
    expect(receiptSchema.safeParse({ ...validReceipt, fileId: undefined }).success).toBe(false);
  });
});

const validRsvp = {
  id: 'rsvp_1',
  year: 2026,
  date: '2026-08-10',
  name: 'Ram Reddy',
  adults: 2,
  kids: 1,
  prasadam: 'Sweets',
  notes: '',
  recordedBy: '',
  recordedAt: '2026-08-10T10:00:00.000Z',
};

describe('rsvpSchema', () => {
  it('accepts a fully valid row', () => {
    expect(rsvpSchema.safeParse(validRsvp).success).toBe(true);
  });

  it('rejects a missing name', () => {
    expect(rsvpSchema.safeParse({ ...validRsvp, name: '' }).success).toBe(false);
  });

  it('defaults adults and kids to 0 when omitted', () => {
    const { adults, kids, ...rest } = validRsvp;
    const result = rsvpSchema.safeParse(rest);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.adults).toBe(0);
      expect(result.data.kids).toBe(0);
    }
  });

  it('rejects a negative headcount', () => {
    expect(rsvpSchema.safeParse({ ...validRsvp, adults: -2 }).success).toBe(false);
  });

  it('defaults session to blank for First Day Pooja (no session needed)', () => {
    const result = rsvpSchema.safeParse(validRsvp);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.session).toBe('');
  });

  it('accepts Morning or Evening for a Daily Pooja session', () => {
    const result = rsvpSchema.safeParse({ ...validRsvp, occasion: 'Daily Pooja', session: 'Evening', time: '18:30' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.session).toBe('Evening');
      expect(result.data.time).toBe('18:30');
    }
  });

  it('rejects a session value outside Morning/Evening', () => {
    expect(rsvpSchema.safeParse({ ...validRsvp, session: 'Afternoon' }).success).toBe(false);
  });
});

const validAccessRequest = {
  id: 'req_1',
  email: 'someone@example.com',
  name: 'Someone',
  message: 'Please add me',
  requestedAt: '2026-08-10T10:00:00.000Z',
};

describe('accessRequestSchema', () => {
  it('accepts a fully valid request', () => {
    expect(accessRequestSchema.safeParse(validAccessRequest).success).toBe(true);
  });

  it('rejects an invalid email', () => {
    expect(accessRequestSchema.safeParse({ ...validAccessRequest, email: 'not-an-email' }).success).toBe(false);
  });

  it('allows name and message to be blank', () => {
    const result = accessRequestSchema.safeParse({ ...validAccessRequest, name: undefined, message: undefined });
    expect(result.success).toBe(true);
  });
});
